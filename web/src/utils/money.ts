// WoW currency: 1 gold = 100 silver, 1 silver = 100 copper.

export interface Coins {
  gold: number;
  silver: number;
  copper: number;
}

export function toCoins(totalCopper: number): Coins {
  const c = Math.round(totalCopper);
  return {
    gold: Math.floor(c / 10_000),
    silver: Math.floor((c % 10_000) / 100),
    copper: c % 100,
  };
}

/** 1234567 -> "123g 45s 67c". Leading zero units are dropped: 4500 -> "45s". */
export function formatGold(totalCopper: number | null | undefined): string {
  if (totalCopper == null) return "—";
  const { gold, silver, copper } = toCoins(totalCopper);
  const parts: string[] = [];
  if (gold > 0) parts.push(`${gold.toLocaleString("en-US")}g`);
  if (gold > 0 || silver > 0) parts.push(`${silver}s`);
  parts.push(`${copper}c`);
  return parts.join(" ");
}

/** Short label for chart axes: 1234567 -> "123.5g". */
export function formatGoldShort(totalCopper: number): string {
  const gold = totalCopper / 10_000;
  return `${gold >= 100 ? Math.round(gold).toLocaleString("en-US") : gold.toFixed(1)}g`;
}

export function formatPct(pct: number | null | undefined): string {
  if (pct == null) return "—";
  return `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
}
