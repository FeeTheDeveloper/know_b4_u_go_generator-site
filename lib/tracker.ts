import { FMCSA_RATES, QUARTERS, type Quarter } from "./constants";
import type { DrawRecord } from "./types";

export interface QuarterProgress {
  quarter: Quarter;
  drugCompleted: number;
  alcoholCompleted: number;
  drugRequired: number;
  alcoholRequired: number;
}

export interface YtdProgress {
  poolSize: number;
  year: number;
  drugCompleted: number;
  alcoholCompleted: number;
  drugRequiredAnnual: number;
  alcoholRequiredAnnual: number;
  onTrack: boolean;
  quarters: QuarterProgress[];
}

function currentQuarter(now = new Date()): Quarter {
  const m = now.getUTCMonth();
  if (m <= 2) return "Q1";
  if (m <= 5) return "Q2";
  if (m <= 8) return "Q3";
  return "Q4";
}

export function computeYtdProgress(
  companyId: string,
  poolSize: number,
  year: number,
  draws: readonly DrawRecord[],
  now: Date = new Date(),
): YtdProgress {
  const drugRequiredAnnual = Math.ceil(poolSize * FMCSA_RATES.controlledSubstances);
  const alcoholRequiredAnnual = Math.ceil(poolSize * FMCSA_RATES.alcohol);

  const qBuckets: Record<Quarter, { drug: number; alcohol: number }> = {
    Q1: { drug: 0, alcohol: 0 },
    Q2: { drug: 0, alcohol: 0 },
    Q3: { drug: 0, alcohol: 0 },
    Q4: { drug: 0, alcohol: 0 },
  };

  for (const d of draws) {
    if (d.companyId !== companyId || d.year !== year) continue;
    const primary = d.selectedPrimary.length;
    if (d.testType === "drug") qBuckets[d.cycle].drug += primary;
    else if (d.testType === "alcohol") qBuckets[d.cycle].alcohol += primary;
    else {
      qBuckets[d.cycle].drug += primary;
      qBuckets[d.cycle].alcohol += primary;
    }
  }

  const drugRequiredPerQ = Math.ceil(drugRequiredAnnual / 4);
  const alcoholRequiredPerQ = Math.ceil(alcoholRequiredAnnual / 4);
  const quarters: QuarterProgress[] = QUARTERS.map((q) => ({
    quarter: q,
    drugCompleted: qBuckets[q].drug,
    alcoholCompleted: qBuckets[q].alcohol,
    drugRequired: drugRequiredPerQ,
    alcoholRequired: alcoholRequiredPerQ,
  }));

  const drugCompleted = quarters.reduce((s, q) => s + q.drugCompleted, 0);
  const alcoholCompleted = quarters.reduce((s, q) => s + q.alcoholCompleted, 0);

  const nowQ = year === now.getUTCFullYear() ? currentQuarter(now) : "Q4";
  const nowQIdx = QUARTERS.indexOf(nowQ);
  const drugExpectedByNow = drugRequiredPerQ * (nowQIdx + 1);
  const alcoholExpectedByNow = alcoholRequiredPerQ * (nowQIdx + 1);
  const onTrack =
    drugCompleted >= drugExpectedByNow &&
    alcoholCompleted >= alcoholExpectedByNow;

  return {
    poolSize,
    year,
    drugCompleted,
    alcoholCompleted,
    drugRequiredAnnual,
    alcoholRequiredAnnual,
    onTrack,
    quarters,
  };
}
