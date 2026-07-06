"use client";

import { useState } from "react";
import {
  CONSORTIUM_KEY,
  QUARTERS,
  type Quarter,
  type TestType,
} from "@/lib/constants";
import type { Company } from "@/lib/types";

export interface DrawFormValue {
  companyId: string;
  testType: TestType;
  cycle: Quarter;
  year: number;
  operator: string;
}

interface Props {
  companies: readonly Company[];
  activeCompanyId: string;
  poolSize: number;
  disabled: boolean;
  onSubmit(value: DrawFormValue): void;
}

const CURRENT_YEAR = 2026;

export function DrawForm({
  companies,
  activeCompanyId,
  poolSize,
  disabled,
  onSubmit,
}: Props) {
  const [testType, setTestType] = useState<TestType>("drug");
  const [cycle, setCycle] = useState<Quarter>(currentQuarter());
  const [year, setYear] = useState<number>(CURRENT_YEAR);
  const [operator, setOperator] = useState<string>("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operator.trim()) return;
    onSubmit({ companyId: activeCompanyId, testType, cycle, year, operator: operator.trim() });
  };

  const companyLabel =
    activeCompanyId === CONSORTIUM_KEY
      ? "Consortium (all companies)"
      : companies.find((c) => c.id === activeCompanyId)?.name ?? "—";

  return (
    <form onSubmit={submit} className="panel">
      <div className="panel-header">
        <h3 className="font-semibold text-white">Perform draw</h3>
        <p className="text-xs text-ink-300">
          {companyLabel} · pool size {poolSize}
        </p>
      </div>
      <div className="grid gap-4 p-6 md:grid-cols-2">
        <div>
          <label className="label">Test type</label>
          <select
            className="select"
            value={testType}
            onChange={(e) => setTestType(e.target.value as TestType)}
          >
            <option value="drug">Controlled substances (50%)</option>
            <option value="alcohol">Alcohol (10%)</option>
            <option value="both">Drug + Alcohol combined draw</option>
          </select>
        </div>
        <div>
          <label className="label">Cycle</label>
          <select
            className="select"
            value={cycle}
            onChange={(e) => setCycle(e.target.value as Quarter)}
          >
            {QUARTERS.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Year</label>
          <input
            className="input"
            type="number"
            value={year}
            min={2024}
            max={2099}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Operator name</label>
          <input
            className="input"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            placeholder="Your full name"
          />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-white/5 px-6 py-4">
        <p className="text-xs text-ink-400">
          Every draw is logged with a cryptographic seed and pool hash for audit.
        </p>
        <button className="btn-gold" type="submit" disabled={disabled || !operator.trim()}>
          Run random selection
        </button>
      </div>
    </form>
  );
}

function currentQuarter(): Quarter {
  const m = new Date().getUTCMonth();
  if (m <= 2) return "Q1";
  if (m <= 5) return "Q2";
  if (m <= 8) return "Q3";
  return "Q4";
}
