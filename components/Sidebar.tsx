"use client";

import { CONSORTIUM_KEY } from "@/lib/constants";
import type { Company } from "@/lib/types";

interface Props {
  companies: readonly Company[];
  selectedId: string;
  onSelect(id: string): void;
  onAddCompany(): void;
}

export function Sidebar({ companies, selectedId, onSelect, onAddCompany }: Props) {
  return (
    <aside className="panel h-fit p-0">
      <div className="panel-header flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-300">
          Companies
        </h2>
        <button
          onClick={onAddCompany}
          className="rounded-md border border-gold-800/40 px-2 py-1 text-xs font-semibold text-gold-300 transition hover:bg-gold-600/10"
        >
          + Add
        </button>
      </div>
      <div className="p-2">
        <SidebarItem
          active={selectedId === CONSORTIUM_KEY}
          onClick={() => onSelect(CONSORTIUM_KEY)}
          title="Consortium (all)"
          subtitle={`${companies.reduce((s, c) => s + c.drivers.length, 0)} drivers`}
        />
        <div className="my-2 h-px bg-white/5" />
        {companies.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-ink-400">
            No companies yet.
            <br />
            Add one to upload a roster.
          </p>
        )}
        {companies.map((c) => (
          <SidebarItem
            key={c.id}
            active={selectedId === c.id}
            onClick={() => onSelect(c.id)}
            title={c.name}
            subtitle={`${c.drivers.length} drivers`}
          />
        ))}
      </div>
    </aside>
  );
}

function SidebarItem({
  title,
  subtitle,
  active,
  onClick,
}: {
  title: string;
  subtitle: string;
  active: boolean;
  onClick(): void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${
        active
          ? "bg-gold-gradient-soft ring-1 ring-gold-600/40"
          : "hover:bg-white/[0.04]"
      }`}
    >
      <span
        className={`font-medium ${active ? "text-white" : "text-ink-200"}`}
      >
        {title}
      </span>
      <span className="text-xs text-ink-400">{subtitle}</span>
    </button>
  );
}
