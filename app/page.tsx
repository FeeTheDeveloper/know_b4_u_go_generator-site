"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { CsvUpload } from "@/components/CsvUpload";
import { DriverTable } from "@/components/DriverTable";
import { DrawForm, type DrawFormValue } from "@/components/DrawForm";
import { DrawResult } from "@/components/DrawResult";
import { QuarterlyTracker } from "@/components/QuarterlyTracker";
import { CONSORTIUM_KEY, FMCSA_RATES } from "@/lib/constants";
import { dataLayer } from "@/lib/storage";
import { performDraw } from "@/lib/selection";
import { computeYtdProgress } from "@/lib/tracker";
import type { AuditStore, Company, Driver, DrawRecord } from "@/lib/types";

function idFor(prefix: string): string {
  const g = globalThis as unknown as { crypto?: Crypto };
  if (g.crypto && "randomUUID" in g.crypto) {
    return `${prefix}_${g.crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 12)}`;
}

export default function DashboardPage() {
  const [store, setStore] = useState<AuditStore>({ companies: [], draws: [] });
  const [selectedId, setSelectedId] = useState<string>(CONSORTIUM_KEY);
  const [lastDraw, setLastDraw] = useState<DrawRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      const next = await dataLayer.loadStore();
      setStore(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    (async () => {
      await refresh();
      setHydrated(true);
    })();
  }, []);

  const activeCompany: Company | null = useMemo(() => {
    if (selectedId === CONSORTIUM_KEY) return null;
    return store.companies.find((c) => c.id === selectedId) ?? null;
  }, [selectedId, store.companies]);

  const pool: Driver[] = useMemo(() => {
    if (selectedId === CONSORTIUM_KEY) {
      return store.companies.flatMap((c) => c.drivers);
    }
    return activeCompany?.drivers ?? [];
  }, [selectedId, activeCompany, store.companies]);

  const activePoolSize = pool.filter((d) => d.status === "active").length;

  const progress = useMemo(() => {
    const companyIdForProgress =
      selectedId === CONSORTIUM_KEY ? CONSORTIUM_KEY : selectedId;
    const now = new Date();
    const draws =
      selectedId === CONSORTIUM_KEY
        ? store.draws.map((d) => ({ ...d, companyId: CONSORTIUM_KEY }))
        : store.draws;
    return computeYtdProgress(
      companyIdForProgress,
      activePoolSize,
      now.getUTCFullYear() < 2026 ? 2026 : now.getUTCFullYear(),
      draws,
      now,
    );
  }, [selectedId, activePoolSize, store.draws]);

  const addCompany = async () => {
    const name = window.prompt("New company name:");
    if (!name || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await dataLayer.addCompany(name);
      await refresh();
      setSelectedId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const importDrivers = async (drivers: Driver[]) => {
    setBusy(true);
    setError(null);
    try {
      let company = activeCompany;
      if (!company) {
        const inferred = drivers[0]?.company || "Imported Roster";
        company = await dataLayer.addCompany(inferred);
        setSelectedId(company.id);
      }
      const existing = new Map(company.drivers.map((d) => [d.driverId, d]));
      for (const d of drivers)
        existing.set(d.driverId, { ...d, company: company.name });
      const merged = Array.from(existing.values());
      await dataLayer.setCompanyDrivers(company.id, merged);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const removeDriver = async (driverId: string) => {
    if (!activeCompany) return;
    setBusy(true);
    setError(null);
    try {
      const next = activeCompany.drivers.filter((d) => d.driverId !== driverId);
      await dataLayer.setCompanyDrivers(activeCompany.id, next);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const onDraw = async (v: DrawFormValue) => {
    setBusy(true);
    setError(null);
    try {
      if (pool.filter((d) => d.status === "active").length === 0) {
        throw new Error("No active drivers in the pool.");
      }
      const result = await performDraw({ pool, testType: v.testType });
      const record: DrawRecord = {
        id: idFor("draw"),
        timestamp: new Date().toISOString(),
        operator: v.operator,
        companyId: selectedId,
        companyName:
          selectedId === CONSORTIUM_KEY
            ? "Consortium (all companies)"
            : activeCompany?.name ?? "Unknown",
        testType: v.testType,
        cycle: v.cycle,
        year: v.year,
        poolSize: pool.filter((d) => d.status === "active").length,
        requiredDrug: result.requiredDrug,
        requiredAlcohol: result.requiredAlcohol,
        selectedPrimary: result.primary,
        selectedAlternates: result.alternates,
        seedHex: result.seedHex,
        poolHash: result.poolHash,
        algorithmVersion: result.algorithmVersion,
        rateBasis: {
          drug: FMCSA_RATES.controlledSubstances,
          alcohol: FMCSA_RATES.alcohol,
          citation: FMCSA_RATES.citation,
        },
      };
      await dataLayer.addDraw(record);
      await refresh();
      setLastDraw(record);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl">
              <span className="text-white">Random selection </span>
              <span className="gold-text italic">generator</span>
            </h1>
            <p className="mt-1 text-sm text-ink-300">{FMCSA_RATES.notes}</p>
          </div>
          <span className="chip">
            backend: <span className="ml-1 font-mono text-ink-200">{dataLayer.backendLabel}</span>
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <Sidebar
            companies={store.companies}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAddCompany={addCompany}
          />

          <div className="grid gap-6">
            {hydrated && store.companies.length === 0 && (
              <div className="panel p-6">
                <h2 className="font-semibold text-white">Start here</h2>
                <p className="mt-1 text-sm text-ink-300">
                  Add a company, then upload its driver roster CSV to build the
                  random-selection pool.
                </p>
              </div>
            )}

            <div className="panel">
              <div className="panel-header flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-white">
                    {selectedId === CONSORTIUM_KEY
                      ? "Consortium pool"
                      : activeCompany?.name ?? "—"}
                  </h2>
                  <p className="text-xs text-ink-300">
                    {pool.length} drivers on file · {activePoolSize} active
                  </p>
                </div>
              </div>
              <div className="space-y-4 p-6">
                <CsvUpload
                  fallbackCompany={activeCompany?.name}
                  onImport={importDrivers}
                />
                <DriverTable
                  drivers={pool}
                  onRemove={activeCompany ? removeDriver : undefined}
                />
              </div>
            </div>

            <QuarterlyTracker progress={progress} />

            <DrawForm
              companies={store.companies}
              activeCompanyId={selectedId}
              poolSize={activePoolSize}
              disabled={activePoolSize === 0 || busy}
              onSubmit={onDraw}
            />

            {error && (
              <div className="rounded-lg border border-status-bad/40 bg-status-bad/10 p-4 text-sm text-status-bad">
                {error}
              </div>
            )}

            {lastDraw && <DrawResult record={lastDraw} />}
          </div>
        </div>

        <footer className="mt-10 border-t border-white/5 pt-4 text-center text-[11px] text-ink-400">
          Know Before You Go — Testing · Training · Compliance ·{" "}
          {FMCSA_RATES.citation} · Assists selection; does not replace a certified
          C/TPA or MRO.
        </footer>
      </main>
    </div>
  );
}
