"use client";

import type { YtdProgress } from "@/lib/tracker";

export function QuarterlyTracker({ progress }: { progress: YtdProgress }) {
  const drugPct = pct(progress.drugCompleted, progress.drugRequiredAnnual);
  const alcoholPct = pct(progress.alcoholCompleted, progress.alcoholRequiredAnnual);
  return (
    <div className="panel">
      <div className="panel-header flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">
            {progress.year} annual progress
          </h3>
          <p className="text-xs text-ink-300">
            Pool size {progress.poolSize} · FMCSA minimums
          </p>
        </div>
        <span
          className={`chip ${
            progress.onTrack
              ? "border-status-ok/40 text-status-ok"
              : "border-status-warn/40 text-status-warn"
          }`}
        >
          {progress.onTrack ? "On track" : "Behind"}
        </span>
      </div>
      <div className="grid gap-4 p-6 md:grid-cols-2">
        <Bar
          label="Controlled substances"
          done={progress.drugCompleted}
          total={progress.drugRequiredAnnual}
          pct={drugPct}
        />
        <Bar
          label="Alcohol"
          done={progress.alcoholCompleted}
          total={progress.alcoholRequiredAnnual}
          pct={alcoholPct}
        />
      </div>
      <div className="border-t border-white/5 p-6 pt-4">
        <p className="mb-2 text-xs uppercase tracking-widest text-ink-300">
          Quarterly spread
        </p>
        <div className="grid grid-cols-4 gap-3">
          {progress.quarters.map((q) => (
            <div
              key={q.quarter}
              className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
            >
              <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-wider text-ink-300">
                <span>{q.quarter}</span>
                <span>
                  {q.drugCompleted}/{q.drugRequired}·{q.alcoholCompleted}/{q.alcoholRequired}
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      pct(q.drugCompleted, Math.max(1, q.drugRequired)),
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Bar({
  label,
  done,
  total,
  pct: p,
}: {
  label: string;
  done: number;
  total: number;
  pct: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm text-ink-200">{label}</span>
        <span className="font-mono text-xs text-ink-300">
          {done} / {total} ({p.toFixed(0)}%)
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${Math.min(100, p)}%` }} />
      </div>
    </div>
  );
}

function pct(a: number, b: number): number {
  if (b <= 0) return 0;
  return (a / b) * 100;
}
