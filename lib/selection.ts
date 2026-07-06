import { FMCSA_RATES, ALGORITHM_VERSION, type TestType } from "./constants";
import type { Driver } from "./types";
import { fisherYates, newSeedHex, seededPrng } from "./rng";
import { hashPool } from "./hash";

export interface RequiredCounts {
  drug: number;
  alcohol: number;
}

export function requiredCounts(
  poolSize: number,
  rates: { drug: number; alcohol: number } = {
    drug: FMCSA_RATES.controlledSubstances,
    alcohol: FMCSA_RATES.alcohol,
  },
): RequiredCounts {
  if (poolSize < 0 || !Number.isFinite(poolSize)) {
    throw new Error("poolSize must be a non-negative finite number");
  }
  return {
    drug: Math.ceil(poolSize * rates.drug),
    alcohol: Math.ceil(poolSize * rates.alcohol),
  };
}

export function annualRequiredForYear(
  avgPoolSize: number,
  rates: { drug: number; alcohol: number } = {
    drug: FMCSA_RATES.controlledSubstances,
    alcohol: FMCSA_RATES.alcohol,
  },
): RequiredCounts {
  return requiredCounts(avgPoolSize, rates);
}

export function drawCountForCycle(poolSize: number, rate: number): number {
  const annual = Math.ceil(poolSize * rate);
  return Math.ceil(annual / 4);
}

export interface DrawInput {
  pool: readonly Driver[];
  testType: TestType;
  seedHex?: string;
  alternatesPct?: number;
}

export interface DrawOutput {
  seedHex: string;
  poolHash: string;
  algorithmVersion: string;
  requiredDrug: number;
  requiredAlcohol: number;
  primary: Driver[];
  alternates: Driver[];
}

export async function performDraw(input: DrawInput): Promise<DrawOutput> {
  const active = input.pool.filter((d) => d.status === "active");
  if (active.length === 0) {
    throw new Error("Cannot draw: pool contains no active drivers.");
  }

  const seedHex = input.seedHex ?? newSeedHex();
  const rand = seededPrng(seedHex);
  const shuffled = fisherYates(active, rand);

  const cycleDrug = drawCountForCycle(active.length, FMCSA_RATES.controlledSubstances);
  const cycleAlcohol = drawCountForCycle(active.length, FMCSA_RATES.alcohol);

  let primaryCount = 0;
  if (input.testType === "drug") primaryCount = cycleDrug;
  else if (input.testType === "alcohol") primaryCount = cycleAlcohol;
  else primaryCount = Math.max(cycleDrug, cycleAlcohol);

  primaryCount = Math.min(primaryCount, shuffled.length);

  const altPct = input.alternatesPct ?? 0.25;
  const altTarget = Math.max(1, Math.ceil(primaryCount * altPct));
  const altCount = Math.min(altTarget, Math.max(0, shuffled.length - primaryCount));

  const primary = shuffled.slice(0, primaryCount);
  const alternates = shuffled.slice(primaryCount, primaryCount + altCount);

  const poolHash = await hashPool(active);

  return {
    seedHex,
    poolHash,
    algorithmVersion: ALGORITHM_VERSION,
    requiredDrug: cycleDrug,
    requiredAlcohol: cycleAlcohol,
    primary,
    alternates,
  };
}
