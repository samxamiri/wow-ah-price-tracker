import { describe, expect, it } from "vitest";
import { formatGold, formatGoldShort, formatPct, toCoins } from "./money";

describe("toCoins", () => {
  it("splits copper into gold, silver and copper", () => {
    expect(toCoins(1_234_567)).toEqual({ gold: 123, silver: 45, copper: 67 });
  });
});

describe("formatGold", () => {
  it("formats all three units", () => {
    expect(formatGold(1_234_567)).toBe("123g 45s 67c");
  });

  it("keeps zero silver when there is gold", () => {
    expect(formatGold(10_000)).toBe("1g 0s 0c");
  });

  it("drops leading zero units", () => {
    expect(formatGold(4_500)).toBe("45s 0c");
    expect(formatGold(7)).toBe("7c");
  });

  it("adds thousands separators to gold", () => {
    expect(formatGold(123_456_0000)).toBe("123,456g 0s 0c");
  });

  it("shows a dash for missing values", () => {
    expect(formatGold(null)).toBe("—");
  });
});

describe("formatGoldShort", () => {
  it("uses one decimal for small amounts and none for large", () => {
    expect(formatGoldShort(15_000)).toBe("1.5g");
    expect(formatGoldShort(1_850_000)).toBe("185g");
  });
});

describe("formatPct", () => {
  it("adds a plus sign to gains", () => {
    expect(formatPct(12.34)).toBe("+12.3%");
    expect(formatPct(-5)).toBe("-5.0%");
  });
});
