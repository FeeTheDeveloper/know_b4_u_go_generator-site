import { describe, expect, it } from "vitest";
import { drawCountForCycle, performDraw, requiredCounts } from "../selection";
import { fisherYates, seededPrng } from "../rng";
import type { Driver } from "../types";

const makePool = (n: number): Driver[] =>
  Array.from({ length: n }, (_, i) => ({
    driverId: `D${String(i + 1).padStart(4, "0")}`,
    name: `Driver ${i + 1}`,
    cdlNumber: `TX${1000000 + i}`,
    company: "Test Co.",
    status: "active",
  }));

describe("requiredCounts (49 CFR 382 math)", () => {
  it("hits FMCSA 2026 minimums for a 50-driver pool", () => {
    const r = requiredCounts(50);
    expect(r.drug).toBe(25);
    expect(r.alcohol).toBe(5);
  });

  it("rounds up (a partial test still owes you a full one)", () => {
    const r = requiredCounts(9);
    expect(r.drug).toBe(5);
    expect(r.alcohol).toBe(1);
  });

  it("returns zero for empty pool", () => {
    const r = requiredCounts(0);
    expect(r.drug).toBe(0);
    expect(r.alcohol).toBe(0);
  });

  it("respects custom rates when passed", () => {
    const r = requiredCounts(20, { drug: 0.25, alcohol: 0.1 });
    expect(r.drug).toBe(5);
    expect(r.alcohol).toBe(2);
  });
});

describe("drawCountForCycle (quarterly spread)", () => {
  it("splits a 50-driver / 50% annual across 4 quarters", () => {
    expect(drawCountForCycle(50, 0.5)).toBe(7);
  });
  it("small pool at 10% alcohol still requires >= 1 per cycle when annual > 0", () => {
    expect(drawCountForCycle(10, 0.1)).toBe(1);
  });
});

describe("Fisher–Yates via seeded PRNG", () => {
  it("is deterministic for a fixed seed", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const a = fisherYates(items, seededPrng("a".repeat(64)));
    const b = fisherYates(items, seededPrng("a".repeat(64)));
    expect(a).toEqual(b);
  });

  it("differs across independent seeds", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const a = fisherYates(items, seededPrng("a".repeat(64)));
    const b = fisherYates(items, seededPrng("b".repeat(64)));
    expect(a).not.toEqual(b);
  });

  it("gives roughly equal probability across many trials", () => {
    const items = ["a", "b", "c", "d", "e"];
    const trials = 20000;
    const counts: Record<string, number> = { a: 0, b: 0, c: 0, d: 0, e: 0 };
    for (let t = 0; t < trials; t++) {
      const seed =
        t.toString(16).padStart(8, "0").repeat(8);
      const [first] = fisherYates(items, seededPrng(seed));
      counts[first] = (counts[first] ?? 0) + 1;
    }
    const expected = trials / items.length;
    const tolerance = expected * 0.1;
    for (const k of items) {
      expect(Math.abs(counts[k] - expected)).toBeLessThan(tolerance);
    }
  });
});

describe("performDraw", () => {
  it("returns the correct primary count for drug on a 50-driver pool this quarter", async () => {
    const pool = makePool(50);
    const out = await performDraw({ pool, testType: "drug" });
    expect(out.primary.length).toBe(7);
    expect(out.alternates.length).toBeGreaterThan(0);
  });

  it("is fully reproducible from the returned seed", async () => {
    const pool = makePool(30);
    const first = await performDraw({ pool, testType: "both" });
    const replay = await performDraw({
      pool,
      testType: "both",
      seedHex: first.seedHex,
    });
    expect(replay.primary.map((d) => d.driverId)).toEqual(
      first.primary.map((d) => d.driverId),
    );
    expect(replay.alternates.map((d) => d.driverId)).toEqual(
      first.alternates.map((d) => d.driverId),
    );
    expect(replay.poolHash).toBe(first.poolHash);
  });

  it("refuses to draw against an empty active pool", async () => {
    const pool = makePool(3).map(
      (d) => ({ ...d, status: "inactive" as const }),
    );
    await expect(performDraw({ pool, testType: "drug" })).rejects.toThrow();
  });

  it("selects without repeating within a single draw", async () => {
    const pool = makePool(40);
    const out = await performDraw({ pool, testType: "both" });
    const ids = [...out.primary, ...out.alternates].map((d) => d.driverId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
