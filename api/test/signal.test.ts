import { describe, expect, it } from "vitest";
import { percentChange, priceSignal } from "../src/signal";

describe("priceSignal", () => {
  it("says buy when well below the 7-day average", () => {
    const s = priceSignal(80, 100);
    expect(s.label).toBe("buy");
    expect(s.diffPct).toBe(-20);
  });

  it("says sell when well above the 7-day average", () => {
    expect(priceSignal(125, 100).label).toBe("sell");
  });

  it("says hold when close to the average", () => {
    expect(priceSignal(95, 100).label).toBe("hold");
  });

  it("says unknown without data", () => {
    expect(priceSignal(null, 100).label).toBe("unknown");
    expect(priceSignal(100, null).label).toBe("unknown");
  });
});

describe("percentChange", () => {
  it("rounds to one decimal", () => {
    expect(percentChange(110, 90)).toBe(22.2);
  });

  it("returns null when there's nothing to compare", () => {
    expect(percentChange(100, null)).toBeNull();
    expect(percentChange(100, 0)).toBeNull();
  });
});
