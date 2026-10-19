// Shapes of the JSON the API returns. All prices are in copper.

export type PriceRange = "24h" | "7d" | "30d";

export interface ItemSummary {
  id: number;
  name: string;
  quality: string | null;
  iconUrl: string | null;
  currentPrice: number | null;
  quantity: number | null;
}

export interface ItemStats {
  currentPrice: number | null;
  quantity: number | null;
  lastUpdated: string | null;
  avg7d: number | null;
  low30d: number | null;
  high30d: number | null;
  price24hAgo: number | null;
}

export interface Signal {
  label: "buy" | "sell" | "hold" | "unknown";
  message: string;
  diffPct: number | null; // current price vs. 7-day average, in percent
}

export interface ItemDetail {
  id: number;
  name: string;
  quality: string | null;
  iconUrl: string | null;
  stats: ItemStats;
  change24hPct: number | null;
  signal: Signal;
}

export interface PricePoint {
  time: string;
  minPrice: number;
  avgPrice: number;
  quantity: number;
  movingAvg24h: number;
}

export interface Mover {
  id: number;
  name: string;
  quality: string | null;
  iconUrl: string | null;
  currentPrice: number;
  previousPrice: number;
  changePct: number;
}

// Everything the routes need from the database. The real implementation is
// in repository.ts; tests pass in a fake one so they don't need PostgreSQL.
export interface Repository {
  ping(): Promise<void>;
  searchItems(search: string, limit: number): Promise<ItemSummary[]>;
  getItem(id: number): Promise<(Omit<ItemDetail, "change24hPct" | "signal">) | null>;
  getPriceHistory(id: number, range: PriceRange): Promise<PricePoint[]>;
  getMovers(direction: "up" | "down", limit: number): Promise<Mover[]>;
}
