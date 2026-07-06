"use client";

import type { Driver } from "@/lib/types";

interface Props {
  drivers: readonly Driver[];
  onRemove?(driverId: string): void;
}

export function DriverTable({ drivers, onRemove }: Props) {
  return (
    <div className="max-h-96 overflow-auto rounded-lg border border-white/5">
      <table className="w-full">
        <thead className="sticky top-0 bg-navy-800">
          <tr className="text-left text-[11px] uppercase tracking-wider text-ink-300">
            <th className="px-3 py-2">Driver</th>
            <th className="px-3 py-2">CDL</th>
            <th className="px-3 py-2">Company</th>
            <th className="px-3 py-2">Status</th>
            {onRemove && <th className="px-3 py-2" />}
          </tr>
        </thead>
        <tbody>
          {drivers.length === 0 && (
            <tr>
              <td colSpan={5} className="p-6 text-center text-xs text-ink-400">
                No drivers yet — upload a CSV to seed the pool.
              </td>
            </tr>
          )}
          {drivers.map((d) => (
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
              {onRemove && (
                <td className="table-cell text-right">
                  <button
                    onClick={() => onRemove(d.driverId)}
                    className="text-xs text-ink-400 hover:text-status-bad"
                  >
                    Remove
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
