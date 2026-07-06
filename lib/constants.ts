export const ALGORITHM_VERSION = "kbug-selection-1.0.0";

export const FMCSA_RATES = {
  effectiveYear: 2026,
  citation: "49 CFR § 382.305",
  controlledSubstances: 0.5,
  alcohol: 0.1,
  notes:
    "Effective calendar year 2026, FMCSA retained the minimum annual random-testing rates at 50% for controlled substances and 10% for alcohol.",
} as const;

export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";
export const QUARTERS: readonly Quarter[] = ["Q1", "Q2", "Q3", "Q4"] as const;

export type TestType = "drug" | "alcohol" | "both";

export const TEST_TYPE_LABEL: Record<TestType, string> = {
  drug: "Controlled Substances",
  alcohol: "Alcohol",
  both: "Drug + Alcohol",
};

export const CONSORTIUM_KEY = "__consortium__";
