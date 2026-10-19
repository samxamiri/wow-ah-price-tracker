import express, { NextFunction, Request, Response } from "express";
import { percentChange, priceSignal } from "./signal";
import type { PriceRange, Repository } from "./types";

const RANGES: PriceRange[] = ["24h", "7d", "30d"];

// Express 4 doesn't catch errors thrown in async handlers. This wrapper
// forwards them to the error handler at the bottom instead of crashing.
const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

function parseLimit(value: unknown, fallback: number, max: number): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) return fallback;
  return Math.min(n, max);
}

function parseId(value: string): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Builds the Express app. The repository is passed in so tests can use a fake one. */
export function createApp(repo: Repository) {
  const app = express();

  // Kubernetes and Docker use this to check the API is alive and can reach the DB.
  app.get("/health", async (_req, res) => {
    try {
      await repo.ping();
      res.json({ status: "ok" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    }
  });

  const api = express.Router();

  // CORS: lets the website call this API from a different domain (Vercel → Render).
  // The API is public and read-only (GET only, no cookies), so any origin is fine.
  api.use((_req, res, next) => {
    res.set("Access-Control-Allow-Origin", "*");
    next();
  });

  // GET /api/items?search=ore&limit=20
  api.get(
    "/items",
    wrap(async (req, res) => {
      const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
      res.json(await repo.searchItems(search, parseLimit(req.query.limit, 20, 100)));
    }),
  );

  // GET /api/items/:id
  api.get(
    "/items/:id",
    wrap(async (req, res) => {
      const id = parseId(req.params.id);
      if (id == null) return res.status(400).json({ error: "Invalid item id" });

      const item = await repo.getItem(id);
      if (!item) return res.status(404).json({ error: "Item not found" });

      res.json({
        ...item,
        change24hPct: percentChange(item.stats.currentPrice, item.stats.price24hAgo),
        signal: priceSignal(item.stats.currentPrice, item.stats.avg7d),
      });
    }),
  );

  // GET /api/items/:id/prices?range=7d
  api.get(
    "/items/:id/prices",
    wrap(async (req, res) => {
      const id = parseId(req.params.id);
      if (id == null) return res.status(400).json({ error: "Invalid item id" });

      const range = (req.query.range ?? "7d") as PriceRange;
      if (!RANGES.includes(range)) {
        return res.status(400).json({ error: `range must be one of ${RANGES.join(", ")}` });
      }
      res.json(await repo.getPriceHistory(id, range));
    }),
  );

  // GET /api/movers?limit=10
  api.get(
    "/movers",
    wrap(async (req, res) => {
      const limit = parseLimit(req.query.limit, 10, 50);
      const [gainers, losers] = await Promise.all([
        repo.getMovers("up", limit),
        repo.getMovers("down", limit),
      ]);
      res.json({ gainers, losers });
    }),
  );

  app.use("/api", api);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
