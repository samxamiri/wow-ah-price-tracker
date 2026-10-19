import type { Signal } from "./types";

/**
 * Compares the current price to the 7-day average and suggests buy/sell/hold.
 * A pure function (no database, no I/O), so it's easy to unit test.
 */
export function priceSignal(
  currentPrice: number | null,
  avg7d: number | null,
  thresholdPct = 10,
): Signal {
  if (currentPrice == null || avg7d == null || avg7d <= 0) {
    return { label: "unknown", message: "Not enough price history yet.", diffPct: null };
  }

  const diffPct = Math.round(((currentPrice - avg7d) / avg7d) * 1000) / 10;

  if (diffPct <= -thresholdPct) {
    return {
      label: "buy",
      message: `Price is ${Math.abs(diffPct)}% below its 7-day average. Good time to buy.`,
      diffPct,
    };
  }
  if (diffPct >= thresholdPct) {
    return {
      label: "sell",
      message: `Price is ${diffPct}% above its 7-day average. Good time to sell.`,
      diffPct,
    };
  }
  return {
    label: "hold",
    message: `Price is within ${thresholdPct}% of its 7-day average.`,
    diffPct,
  };
}

export function percentChange(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null || previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
