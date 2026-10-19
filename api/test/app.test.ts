import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";
import type { Repository } from "../src/types";

// A fake repository, so these tests check the HTTP layer without a database.
function fakeRepo(overrides: Partial<Repository> = {}): Repository {
  return {
    ping: vi.fn().mockResolvedValue(undefined),
    searchItems: vi.fn().mockResolvedValue([]),
    getItem: vi.fn().mockResolvedValue(null),
    getPriceHistory: vi.fn().mockResolvedValue([]),
    getMovers: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe("GET /health", () => {
  it("returns ok when the database responds", async () => {
    const res = await request(createApp(fakeRepo())).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("returns 503 when the database is down", async () => {
    const repo = fakeRepo({ ping: vi.fn().mockRejectedValue(new Error("down")) });
    const res = await request(createApp(repo)).get("/health");
    expect(res.status).toBe(503);
  });
});

describe("GET /api/items", () => {
  it("passes the search term and a capped limit to the repository", async () => {
    const repo = fakeRepo();
    await request(createApp(repo)).get("/api/items?search=ore&limit=500");
    expect(repo.searchItems).toHaveBeenCalledWith("ore", 100);
  });
});

describe("GET /api/items/:id", () => {
  it("returns 400 for a non-numeric id", async () => {
    const res = await request(createApp(fakeRepo())).get("/api/items/abc");
    expect(res.status).toBe(400);
  });

  it("returns 404 when the item doesn't exist", async () => {
    const res = await request(createApp(fakeRepo())).get("/api/items/1");
    expect(res.status).toBe(404);
  });

  it("adds the 24h change and buy/sell signal", async () => {
    const repo = fakeRepo({
      getItem: vi.fn().mockResolvedValue({
        id: 1,
        name: "Bismuth",
        quality: "COMMON",
        iconUrl: null,
        stats: {
          currentPrice: 80,
          quantity: 500,
          lastUpdated: "2026-01-01T00:00:00.000Z",
          avg7d: 100,
          low30d: 70,
          high30d: 130,
          price24hAgo: 100,
        },
      }),
    });
    const res = await request(createApp(repo)).get("/api/items/1");
    expect(res.status).toBe(200);
    expect(res.body.change24hPct).toBe(-20);
    expect(res.body.signal.label).toBe("buy");
  });
});

describe("GET /api/items/:id/prices", () => {
  it("rejects an unknown range", async () => {
    const res = await request(createApp(fakeRepo())).get("/api/items/1/prices?range=1y");
    expect(res.status).toBe(400);
  });

  it("defaults to 7 days", async () => {
    const repo = fakeRepo();
    await request(createApp(repo)).get("/api/items/1/prices");
    expect(repo.getPriceHistory).toHaveBeenCalledWith(1, "7d");
  });
});

describe("GET /api/movers", () => {
  it("returns gainers and losers", async () => {
    const repo = fakeRepo();
    const res = await request(createApp(repo)).get("/api/movers");
    expect(res.body).toEqual({ gainers: [], losers: [] });
    expect(repo.getMovers).toHaveBeenCalledWith("up", 10);
    expect(repo.getMovers).toHaveBeenCalledWith("down", 10);
  });
});

describe("errors", () => {
  it("returns 500 JSON when the repository throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const repo = fakeRepo({ searchItems: vi.fn().mockRejectedValue(new Error("boom")) });
    const res = await request(createApp(repo)).get("/api/items");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});

describe("CORS", () => {
  it("lets other domains (the Vercel site) read /api responses", async () => {
    const res = await request(createApp(fakeRepo())).get("/api/movers");
    expect(res.headers["access-control-allow-origin"]).toBe("*");
  });
});
