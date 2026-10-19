// Mirrors the JSON returned by the API (see api/src/types.ts). Prices are in copper.

export type PriceRange = "24h" | "7d" | "30d";

export interface ItemSummary {
  id: number;
  name: string;
  quality: string | null;
  iconUrl: string | null;
  currentPrice: number | null;
  quantity: number | null;
}

export interface ItemDetail {
  id: number;
  name: string;
  quality: string | null;
  iconUrl: string | null;
  stats: {
    currentPrice: number | null;
    quantity: number | null;
    lastUpdated: string | null;
    avg7d: number | null;
    low30d: number | null;
    high30d: number | null;
    price24hAgo: number | null;
  };
  change24hPct: number | null;
  signal: {
    label: "buy" | "sell" | "hold" | "unknown";
    message: string;
    diffPct: number | null;
  };
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
