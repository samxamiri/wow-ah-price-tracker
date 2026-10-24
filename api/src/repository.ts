import { Pool, types } from "pg";
import type { ItemSummary, Mover, PricePoint, PriceRange, Repository } from "./types";

// PostgreSQL BIGINT (type id 20) comes back as a string by default, because
// it can exceed JavaScript's safe integer range. Our copper prices are far
// below that, so parse them as numbers.
types.setTypeParser(20, (value) => Number(value));

const RANGE_INTERVALS: Record<PriceRange, string> = {
  "24h": "24 hours",
  "7d": "7 days",
  "30d": "30 days",
};

// Items with only a few units listed jump around wildly (one cheap listing
// = "-80%!"), so the movers page ignores them.
const MIN_MOVER_QUANTITY = 100;

// Escape % and _ so a search for "100%" doesn't act as a wildcard.
function likePattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, "\\$&")}%`;
}

export class PgRepository implements Repository {
  constructor(private readonly pool: Pool) {}

  async ping(): Promise<void> {
    await this.pool.query("SELECT 1");
  }

  async searchItems(search: string, limit: number): Promise<ItemSummary[]> {
    // LATERAL runs the subquery once per item: "get this item's latest snapshot".
    const { rows } = await this.pool.query(
      `SELECT i.id, i.name, i.quality, i.icon_url, l.min_price, l.total_quantity
         FROM items i
         LEFT JOIN LATERAL (
           SELECT min_price, total_quantity
             FROM price_snapshots s
            WHERE s.item_id = i.id
            ORDER BY s.snapshot_time DESC
            LIMIT 1
         ) l ON true
        WHERE i.name ILIKE $1
        ORDER BY i.name
        LIMIT $2`,
      [likePattern(search), limit],
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      quality: r.quality,
      iconUrl: r.icon_url,
      currentPrice: r.min_price ?? null,
      quantity: r.total_quantity ?? null,
    }));
  }

  async getItem(id: number) {
    const itemResult = await this.pool.query(
      "SELECT id, name, quality, icon_url FROM items WHERE id = $1",
      [id],
    );
    const item = itemResult.rows[0];
    if (!item) return null;

    // Time windows are measured from the latest snapshot, not now(), so the
    // stats still make sense if the worker hasn't run for a while.
    const { rows } = await this.pool.query(
      `WITH s AS (
         SELECT * FROM price_snapshots WHERE item_id = $1
       ),
       latest AS (
         SELECT * FROM s ORDER BY snapshot_time DESC LIMIT 1
       )
       SELECT
         latest.min_price      AS current_price,
         latest.total_quantity AS quantity,
         latest.snapshot_time  AS last_updated,
         (SELECT AVG(min_price)::float8 FROM s
           WHERE s.snapshot_time > latest.snapshot_time - INTERVAL '7 days')  AS avg_7d,
         (SELECT MIN(min_price) FROM s
           WHERE s.snapshot_time > latest.snapshot_time - INTERVAL '30 days') AS low_30d,
         (SELECT MAX(min_price) FROM s
           WHERE s.snapshot_time > latest.snapshot_time - INTERVAL '30 days') AS high_30d,
         (SELECT min_price FROM s
           WHERE s.snapshot_time <= latest.snapshot_time - INTERVAL '24 hours'
           ORDER BY s.snapshot_time DESC LIMIT 1)                             AS price_24h_ago
       FROM latest`,
      [id],
    );
    const s = rows[0]; // undefined if the item has no snapshots yet

    return {
      id: item.id,
      name: item.name,
      quality: item.quality,
      iconUrl: item.icon_url,
      stats: {
        currentPrice: s?.current_price ?? null,
        quantity: s?.quantity ?? null,
        lastUpdated: s?.last_updated?.toISOString() ?? null,
        avg7d: s?.avg_7d == null ? null : Math.round(s.avg_7d),
        low30d: s?.low_30d ?? null,
        high30d: s?.high_30d ?? null,
        price24hAgo: s?.price_24h_ago ?? null,
      },
    };
  }

  async getPriceHistory(id: number, range: PriceRange): Promise<PricePoint[]> {
    // The window function computes a rolling average over the previous
    // 24 rows (= 24 hours, since there's one snapshot per hour).
    const { rows } = await this.pool.query(
      `WITH latest AS (
         SELECT MAX(snapshot_time) AS t FROM price_snapshots WHERE item_id = $1
       )
       SELECT p.snapshot_time, p.min_price, p.avg_price, p.total_quantity,
              AVG(p.min_price) OVER (
                ORDER BY p.snapshot_time
                ROWS BETWEEN 23 PRECEDING AND CURRENT ROW
              )::float8 AS moving_avg_24h
         FROM price_snapshots p, latest
        WHERE p.item_id = $1
          AND p.snapshot_time > latest.t - $2::interval
        ORDER BY p.snapshot_time`,
      [id, RANGE_INTERVALS[range]],
    );
    return rows.map((r) => ({
      time: r.snapshot_time.toISOString(),
      minPrice: r.min_price,
      avgPrice: r.avg_price,
      quantity: r.total_quantity,
      movingAvg24h: Math.round(r.moving_avg_24h),
    }));
  }

  async getMovers(direction: "up" | "down", limit: number): Promise<Mover[]> {
    // These are fixed strings chosen in code, never user input, so putting
    // them into the SQL is safe. Gainers must have gone up, losers down.
    const order = direction === "up" ? "DESC" : "ASC";
    const changeFilter = direction === "up" ? "l.min_price > d.min_price" : "l.min_price < d.min_price";
    // DISTINCT ON (item_id) keeps the first row per item after sorting,
    // i.e. each item's newest snapshot (or newest one at least 24h older).
    const { rows } = await this.pool.query(
      `WITH latest AS (
         SELECT DISTINCT ON (item_id) item_id, snapshot_time, min_price, total_quantity
           FROM price_snapshots
          ORDER BY item_id, snapshot_time DESC
       ),
       day_ago AS (
         SELECT DISTINCT ON (s.item_id) s.item_id, s.min_price
           FROM price_snapshots s
           JOIN latest l ON l.item_id = s.item_id
          WHERE s.snapshot_time <= l.snapshot_time - INTERVAL '24 hours'
          ORDER BY s.item_id, s.snapshot_time DESC
       )
       SELECT i.id, i.name, i.quality, i.icon_url,
              l.min_price AS current_price,
              d.min_price AS previous_price,
              ROUND(100.0 * (l.min_price - d.min_price) / d.min_price, 1)::float8 AS change_pct
         FROM latest l
         JOIN day_ago d ON d.item_id = l.item_id
         JOIN items i   ON i.id = l.item_id
        WHERE d.min_price > 0
          AND l.total_quantity >= ${MIN_MOVER_QUANTITY}
          AND ${changeFilter}
        ORDER BY change_pct ${order}
        LIMIT $1`,
      [limit],
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      quality: r.quality,
      iconUrl: r.icon_url,
      currentPrice: r.current_price,
      previousPrice: r.previous_price,
      changePct: r.change_pct,
    }));
  }
}
