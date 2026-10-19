import type { ItemDetail, ItemSummary, Mover, PricePoint, PriceRange } from "./types";

// Where the API lives. Left empty, calls go to the same site ("/api/..."), which
// the Vite proxy (dev) and nginx (Docker/Kubernetes) forward to the API.
// On Vercel the API is on a different domain (Render), so the build sets
// VITE_API_URL=https://<your-api>.onrender.com and the browser calls it directly.
const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`);
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
