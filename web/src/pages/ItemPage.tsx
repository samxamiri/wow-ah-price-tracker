import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { Gold } from "../components/Gold";
import { ItemIcon, qualityClass } from "../components/ItemIcon";
import { PriceChart } from "../components/PriceChart";
import type { PriceRange } from "../types";
import { useFetch } from "../useFetch";
import { formatPct } from "../utils/money";

const RANGES: PriceRange[] = ["24h", "7d", "30d"];

export function ItemPage() {
  const id = Number(useParams().id);
  const [range, setRange] = useState<PriceRange>("7d");

  const item = useFetch(() => api.getItem(id), [id]);
  const prices = useFetch(() => api.getPrices(id, range), [id, range]);

  if (item.loading) return <p className="muted">Loading…</p>;
  if (item.error || !item.data) {
    return (
      <p className="error">
        {item.error ?? "Item not found"}. <Link to="/">Back to search</Link>
      </p>
    );
  }

  const { name, quality, iconUrl, stats, change24hPct, signal } = item.data;

  return (
    <article>
      <Link to="/" className="back-link">
        ← All items
      </Link>

      <header className="item-header">
        <ItemIcon name={name} iconUrl={iconUrl} quality={quality} size={56} />
        <div>
          <h1 className={qualityClass(quality)}>{name}</h1>
          <p className="muted">
            Item #{id}
            {stats.lastUpdated && ` · updated ${new Date(stats.lastUpdated).toLocaleString()}`}
          </p>
        </div>
      </header>

      <div className={`signal signal-${signal.label}`} role="status">
        {signal.message}
      </div>

      <dl className="stats">
        <Stat label="Current price">
          <Gold copper={stats.currentPrice} />
        </Stat>
        <Stat label="24h change">
          <span className={change24hPct == null ? "" : change24hPct >= 0 ? "up" : "down"}>
            {formatPct(change24hPct)}
          </span>
        </Stat>
        <Stat label="7-day average">
          <Gold copper={stats.avg7d} />
        </Stat>
        <Stat label="30-day low">
          <Gold copper={stats.low30d} />
        </Stat>
        <Stat label="30-day high">
          <Gold copper={stats.high30d} />
        </Stat>
        <Stat label="Quantity listed">{stats.quantity?.toLocaleString("en-US") ?? "—"}</Stat>
      </dl>

      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Price history</h2>
          <div className="range-buttons" role="group" aria-label="Time range">
            {RANGES.map((r) => (
              <button
                key={r}
                className={r === range ? "active" : ""}
                aria-pressed={r === range}
                onClick={() => setRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        {prices.error && <p className="error">{prices.error}</p>}
        {prices.data && <PriceChart points={prices.data} range={range} />}
      </section>
    </article>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
