import { describe, expect, it } from "vitest";
import {
  netWin,
  maxBetForHouse,
  toMicro,
  fmtStx,
  shortAddr,
  parseFlipResult,
  MIN_BET,
  MAX_BET,
  ONE_STX,
} from "@/lib/stacks";

describe("netWin (mirrors xikomu-flip.clar)", () => {
  it("pays ~0.95x the bet", () => {
    expect(netWin(ONE_STX)).toBe(950_000n); // 1 STX -> 0.95 STX
    expect(netWin(MIN_BET)).toBe(9_500n); // 0.01 STX -> 0.0095 STX
    expect(netWin(MAX_BET)).toBe(4_750_000n); // 5 STX -> 4.75 STX
  });
  it("is 0 for non-positive bets", () => {
    expect(netWin(0n)).toBe(0n);
    expect(netWin(-5n)).toBe(0n);
  });
});

describe("maxBetForHouse", () => {
  it("returns the largest bet the house can cover, capped at MAX_BET", () => {
    // house exactly covers a 1 STX win (0.95 STX) -> max bet 1 STX
    expect(maxBetForHouse(950_000n)).toBe(ONE_STX);
    // a big house is capped at MAX_BET
    expect(maxBetForHouse(1_000_000_000n)).toBe(MAX_BET);
    // empty house -> 0
    expect(maxBetForHouse(0n)).toBe(0n);
  });
  it("never lets netWin(maxBet) exceed the house", () => {
    for (const house of [0n, 1_234n, 950_000n, 4_750_000n, 10_000_000n]) {
      const cap = maxBetForHouse(house);
      if (cap > 0n) expect(netWin(cap) <= house).toBe(true);
    }
  });
});

describe("toMicro / fmtStx", () => {
  it("parses STX strings to microSTX", () => {
    expect(toMicro("1")).toBe(1_000_000n);
    expect(toMicro("0.01")).toBe(10_000n);
    expect(toMicro("5")).toBe(5_000_000n);
    expect(toMicro("0.123456")).toBe(123_456n);
    expect(toMicro("  2.5 ")).toBe(2_500_000n);
    expect(toMicro("0")).toBe(0n);
  });
  it("truncates beyond 6 decimals", () => {
    expect(toMicro("0.1234567")).toBe(123_456n);
  });
  it("formats microSTX back to STX", () => {
    expect(fmtStx(1_500_000n)).toBe("1.5");
    expect(fmtStx(10_000n)).toBe("0.01");
    expect(fmtStx(undefined)).toBe("0");
  });
});

describe("shortAddr", () => {
  it("abbreviates a principal", () => {
    expect(shortAddr("ST20RVFS6R3ZXJ01NZVV3FHKTQXRG4NY3WMQYWZK2")).toBe("ST20R…WZK2");
    expect(shortAddr(undefined)).toBe("");
  });
});

describe("parseFlipResult", () => {
  it("reads won / result-heads from a flip tx repr (any key order)", () => {
    expect(parseFlipResult("(ok (tuple (result-heads false) (won true)))")).toEqual({
      won: true,
      resultHeads: false,
    });
    expect(parseFlipResult("(ok (tuple (won false) (result-heads true)))")).toEqual({
      won: false,
      resultHeads: true,
    });
  });
  it("returns null for non-flip / missing reprs", () => {
    expect(parseFlipResult(undefined)).toBeNull();
    expect(parseFlipResult("(ok u5)")).toBeNull();
  });
});
