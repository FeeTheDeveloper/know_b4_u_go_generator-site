"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { buildDrawPdf, drawToCsv } from "@/lib/pdf";
import { TEST_TYPE_LABEL } from "@/lib/constants";
import { dataLayer } from "@/lib/storage";
import type { AuditStore, DrawRecord } from "@/lib/types";

export default function AuditPage() {
  const [store, setStore] = useState<AuditStore>({ companies: [], draws: [] });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setStore(await dataLayer.loadStore());
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl">
              <span className="text-white">Audit </span>
              <span className="gold-text italic">trail</span>
            </h1>
            <p className="mt-1 text-sm text-ink-300">
              Every draw, with seed, pool hash, and full selection roster.
            </p>
          </div>
          <span className="chip">
            backend:{" "}
            <span className="ml-1 font-mono text-ink-200">
              {dataLayer.backendLabel}
            </span>
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-status-bad/40 bg-status-bad/10 p-4 text-sm text-status-bad">
            {error}
          </div>
        )}

        <div className="panel">
          <div className="panel-header">
            <h2 className="font-semibold text-white">
              {store.draws.length} draw{store.draws.length === 1 ? "" : "s"} recorded
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {store.draws.length === 0 && (
              <div className="p-8 text-center text-sm text-ink-300">
                No draws yet. Run one from the dashboard.
              </div>
            )}
            {store.draws.map((d) => (
              <DrawRow key={d.id} record={d} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function DrawRow({ record }: { record: DrawRecord }) {
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
    <div className="grid gap-4 p-6 md:grid-cols-[1fr_auto]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-white">{record.companyName}</span>
          <span className="chip">{record.cycle} {record.year}</span>
          <span className="chip">{TEST_TYPE_LABEL[record.testType]}</span>
          <span className="chip">pool {record.poolSize}</span>
          <span className="chip">
            selected {record.selectedPrimary.length}
            {record.selectedAlternates.length > 0 &&
              ` + ${record.selectedAlternates.length} alt`}
          </span>
        </div>
        <div className="mt-2 text-xs text-ink-300">
          {new Date(record.timestamp).toUTCString()} · operator {record.operator}
        </div>
        <div className="mt-2 font-mono text-[11px] text-ink-400">
          seed {record.seedHex.slice(0, 24)}… · pool_hash {record.poolHash.slice(0, 24)}…
        </div>
      </div>
      <div className="flex items-start gap-2">
        <button className="btn-ghost" onClick={downloadCsv}>
          CSV
        </button>
        <button className="btn-gold" onClick={downloadPdf}>
          PDF
        </button>
      </div>
    </div>
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
