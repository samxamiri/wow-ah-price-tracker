import type { ItemDetail, ItemSummary, Mover, PricePoint, PriceRange } from "./types";

// Relative URL: works with the Vite proxy in dev and with nginx in production.
async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`);
  if (!res.ok) {
    throw new Error(res.status === 404 ? "Not found" : `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  searchItems: (search: string) =>
    getJson<ItemSummary[]>(`/items?search=${encodeURIComponent(search)}`),
  getItem: (id: number) => getJson<ItemDetail>(`/items/${id}`),
  getPrices: (id: number, range: PriceRange) =>
    getJson<PricePoint[]>(`/items/${id}/prices?range=${range}`),
  getMovers: () => getJson<{ gainers: Mover[]; losers: Mover[] }>("/movers"),
};
