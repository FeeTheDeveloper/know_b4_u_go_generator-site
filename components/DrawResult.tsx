"use client";

import { TEST_TYPE_LABEL } from "@/lib/constants";
import { buildDrawPdf, drawToCsv } from "@/lib/pdf";
import type { DrawRecord } from "@/lib/types";

export function DrawResult({ record }: { record: DrawRecord }) {
  const downloadPdf = () => {
    const blob = buildDrawPdf(record);
    triggerDownload(blob, `${slug(record.companyName)}_${record.cycle}_${record.year}.pdf`);
  };
  const downloadCsv = () => {
    const csv = drawToCsv(record);
    const blob = new Blob([csv], { type: "text/csv" });
    triggerDownload(blob, `${slug(record.companyName)}_${record.cycle}_${record.year}.csv`);
  };

  return (
    <div className="panel">
      <div className="panel-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-gradient text-navy-950">
            <CheckIcon />
          </span>
          <div>
            <h3 className="font-semibold text-white">Selection complete</h3>
            <p className="text-xs text-ink-300">
              {record.companyName} · {record.cycle} {record.year} ·{" "}
              {TEST_TYPE_LABEL[record.testType]}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={downloadCsv}>
            Export CSV
          </button>
          <button className="btn-gold" onClick={downloadPdf}>
            Export PDF
          </button>
        </div>
      </div>
      <div className="grid gap-4 p-6 md:grid-cols-2">
        <List
          title={`Primary selections (${record.selectedPrimary.length})`}
          rows={record.selectedPrimary.map((d) => ({
            id: d.driverId,
            name: d.name,
            cdl: d.cdlNumber,
            company: d.company,
          }))}
        />
        <List
          title={`Alternates (${record.selectedAlternates.length})`}
          rows={record.selectedAlternates.map((d) => ({
            id: d.driverId,
            name: d.name,
            cdl: d.cdlNumber,
            company: d.company,
          }))}
          muted
        />
      </div>
      <div className="border-t border-white/5 px-6 py-4">
        <p className="text-[11px] uppercase tracking-widest text-ink-300">
          Reproducibility record
        </p>
        <div className="mt-2 grid gap-1 font-mono text-[11px] text-ink-300">
          <div>
            <span className="text-ink-400">seed:      </span>
            {record.seedHex}
          </div>
          <div>
            <span className="text-ink-400">pool_hash: </span>
            {record.poolHash}
          </div>
          <div>
            <span className="text-ink-400">algorithm: </span>
            {record.algorithmVersion}
          </div>
          <div>
            <span className="text-ink-400">operator:  </span>
            {record.operator}
          </div>
          <div>
            <span className="text-ink-400">timestamp: </span>
            {record.timestamp}
          </div>
        </div>
      </div>
    </div>
  );
}

function List({
  title,
  rows,
  muted,
}: {
  title: string;
  rows: { id: string; name: string; cdl: string; company: string }[];
  muted?: boolean;
}) {
  return (
    <div className={muted ? "opacity-80" : ""}>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-300">
        {title}
      </h4>
      <div className="max-h-72 overflow-auto rounded-lg border border-white/5 bg-white/[0.02]">
        <table className="w-full">
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="p-4 text-center text-xs text-ink-400">None</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/5 first:border-t-0">
                <td className="table-cell">
                  <div className="font-medium text-white">{r.name}</div>
                  <div className="text-[11px] text-ink-400">
                    {r.id} · {r.company}
                  </div>
                </td>
                <td className="table-cell text-right font-mono text-xs">
                  {r.cdl}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 12l5 5L20 6"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
