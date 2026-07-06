"use client";

import { useRef, useState } from "react";
import { parseDriversCsv } from "@/lib/csv";
import type { Driver } from "@/lib/types";

interface Props {
  fallbackCompany?: string;
  onImport(drivers: Driver[]): void;
}

export function CsvUpload({ fallbackCompany, onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{
    drivers: Driver[];
    warnings: string[];
    errors: string[];
    fileName: string;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const result = parseDriversCsv(text, fallbackCompany);
    setPreview({ ...result, fileName: file.name });
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition ${
          dragging
            ? "border-gold-600 bg-gold-gradient-soft"
            : "border-white/10 bg-white/[0.02]"
        }`}
      >
        <p className="text-sm text-ink-200">
          Drop a driver CSV here, or
        </p>
        <button
          className="btn-gold"
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          Choose CSV
        </button>
        <p className="max-w-md text-xs text-ink-400">
          Columns: <code className="text-gold-300">driver_id, name, cdl_number, company, status</code>{" "}
          (first_name / last_name / state also accepted). Data stays in your browser.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {preview && (
        <div className="mt-4 rounded-xl border border-white/5 bg-navy-900/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">
                {preview.fileName}
              </p>
              <p className="text-xs text-ink-300">
                {preview.drivers.length} drivers ready ·{" "}
                {preview.warnings.length} warnings · {preview.errors.length} errors
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPreview(null)}
                className="btn-ghost"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onImport(preview.drivers);
                  setPreview(null);
                }}
                className="btn-gold"
                type="button"
                disabled={preview.drivers.length === 0}
              >
                Import {preview.drivers.length} drivers
              </button>
            </div>
          </div>

          {(preview.warnings.length > 0 || preview.errors.length > 0) && (
            <details className="mb-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs">
              <summary className="cursor-pointer text-ink-300">
                Show {preview.warnings.length + preview.errors.length} messages
              </summary>
              <ul className="mt-2 space-y-1 text-ink-300">
                {preview.errors.map((e, i) => (
                  <li key={`e${i}`} className="text-status-bad">
                    ⛔ {e}
                  </li>
                ))}
                {preview.warnings.map((w, i) => (
                  <li key={`w${i}`} className="text-status-warn">
                    ⚠ {w}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="max-h-64 overflow-auto rounded-lg border border-white/5">
            <table className="w-full">
              <thead className="sticky top-0 bg-navy-800">
                <tr className="text-left text-[11px] uppercase tracking-wider text-ink-300">
                  <th className="px-3 py-2">Driver</th>
                  <th className="px-3 py-2">CDL</th>
                  <th className="px-3 py-2">Company</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.drivers.slice(0, 100).map((d) => (
                  <tr key={d.driverId} className="border-t border-white/5">
                    <td className="table-cell">
                      <div className="font-medium text-white">{d.name}</div>
                      <div className="text-[11px] text-ink-400">{d.driverId}</div>
                    </td>
                    <td className="table-cell font-mono text-xs">{d.cdlNumber}</td>
                    <td className="table-cell">{d.company}</td>
                    <td className="table-cell">
                      <span
                        className={`chip ${
                          d.status === "active"
                            ? "border-status-ok/40 text-status-ok"
                            : "border-white/10 text-ink-400"
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.drivers.length > 100 && (
              <p className="p-2 text-center text-xs text-ink-400">
                … and {preview.drivers.length - 100} more
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
