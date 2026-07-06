import type { AuditStore, Company, Driver, DrawRecord } from "./types";
import { getSupabase, supabaseEnabled } from "./supabase";

const STORAGE_KEY = "kbug.auditStore.v1";

export interface DataLayer {
  backendLabel: string;
  loadStore(): Promise<AuditStore>;
  addCompany(name: string): Promise<Company>;
  setCompanyDrivers(companyId: string, drivers: Driver[]): Promise<Company>;
  removeCompany(companyId: string): Promise<void>;
  addDraw(record: DrawRecord): Promise<void>;
}

function emptyStore(): AuditStore {
  return { companies: [], draws: [] };
}

function localStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined") return false;
    const t = "__kbug__probe__";
    window.localStorage.setItem(t, t);
    window.localStorage.removeItem(t);
    return true;
  } catch {
    return false;
  }
}

let memoryStore: AuditStore = emptyStore();

function idFor(prefix: string): string {
  const g = globalThis as unknown as { crypto?: Crypto };
  if (g.crypto && "randomUUID" in g.crypto) {
    return `${prefix}_${g.crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 12)}`;
}

const localLayer: DataLayer = {
  backendLabel: "local",

  async loadStore(): Promise<AuditStore> {
    if (!localStorageAvailable()) return memoryStore;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    try {
      const parsed = JSON.parse(raw) as AuditStore;
      if (!parsed.companies || !parsed.draws) return emptyStore();
      return parsed;
    } catch {
      return emptyStore();
    }
  },

  async addCompany(name: string): Promise<Company> {
    const store = await this.loadStore();
    const existing = store.companies.find(
      (c) => c.name.toLowerCase() === name.trim().toLowerCase(),
    );
    if (existing) return existing;
    const company: Company = {
      id: idFor("co"),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      drivers: [],
    };
    store.companies.push(company);
    saveLocal(store);
    return company;
  },

  async setCompanyDrivers(companyId: string, drivers: Driver[]): Promise<Company> {
    const store = await this.loadStore();
    const idx = store.companies.findIndex((c) => c.id === companyId);
    if (idx === -1) throw new Error(`Unknown company ${companyId}`);
    store.companies[idx] = { ...store.companies[idx], drivers };
    saveLocal(store);
    return store.companies[idx];
  },

  async removeCompany(companyId: string): Promise<void> {
    const store = await this.loadStore();
    store.companies = store.companies.filter((c) => c.id !== companyId);
    saveLocal(store);
  },

  async addDraw(record: DrawRecord): Promise<void> {
    const store = await this.loadStore();
    store.draws.unshift(record);
    saveLocal(store);
  },
};

function saveLocal(store: AuditStore) {
  memoryStore = store;
  if (!localStorageAvailable()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

const remoteLayer: DataLayer = {
  backendLabel: "supabase",

  async loadStore(): Promise<AuditStore> {
    const sb = getSupabase();
    if (!sb) return emptyStore();
    const [companiesRes, driversRes, drawsRes] = await Promise.all([
      sb.from("companies").select("*").order("created_at", { ascending: true }),
      sb.from("drivers").select("*"),
      sb.from("draws").select("*").order("created_at", { ascending: false }),
    ]);

    if (companiesRes.error) throw companiesRes.error;
    if (driversRes.error) throw driversRes.error;
    if (drawsRes.error) throw drawsRes.error;

    const driversByCompany = new Map<string, Driver[]>();
    for (const row of driversRes.data ?? []) {
      const list = driversByCompany.get(row.company_id) ?? [];
      list.push({
        driverId: row.driver_id,
        name: row.name,
        cdlNumber: row.cdl_number,
        company: "",
        status: row.status,
      });
      driversByCompany.set(row.company_id, list);
    }

    const companies: Company[] = (companiesRes.data ?? []).map((c) => {
      const drivers = (driversByCompany.get(c.id) ?? []).map((d) => ({
        ...d,
        company: c.name,
      }));
      return {
        id: c.id,
        name: c.name,
        createdAt: c.created_at,
        drivers,
      };
    });

    const draws: DrawRecord[] = (drawsRes.data ?? []).map((r) => ({
      id: r.id,
      timestamp: r.created_at,
      operator: r.operator,
      companyId: r.company_id ?? "__consortium__",
      companyName: r.company_name,
      testType: r.test_type,
      cycle: r.cycle,
      year: r.year,
      poolSize: r.pool_size,
      requiredDrug: r.required_drug,
      requiredAlcohol: r.required_alcohol,
      selectedPrimary: (r.primary_selections as Driver[]) ?? [],
      selectedAlternates: (r.alternate_selections as Driver[]) ?? [],
      seedHex: r.seed_hex,
      poolHash: r.pool_hash,
      algorithmVersion: r.algorithm_version,
      rateBasis: {
        drug: Number(r.rate_drug),
        alcohol: Number(r.rate_alcohol),
        citation: r.rate_citation,
      },
    }));

    return { companies, draws };
  },

  async addCompany(name: string): Promise<Company> {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase not configured");
    const trimmed = name.trim();
    const existing = await sb
      .from("companies")
      .select("*")
      .ilike("name", trimmed)
      .maybeSingle();
    if (existing.data) {
      return {
        id: existing.data.id,
        name: existing.data.name,
        createdAt: existing.data.created_at,
        drivers: [],
      };
    }
    const { data, error } = await sb
      .from("companies")
      .insert({ name: trimmed })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      createdAt: data.created_at,
      drivers: [],
    };
  },

  async setCompanyDrivers(companyId: string, drivers: Driver[]): Promise<Company> {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase not configured");

    const { data: company, error: companyErr } = await sb
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();
    if (companyErr) throw companyErr;

    const { error: delErr } = await sb
      .from("drivers")
      .delete()
      .eq("company_id", companyId);
    if (delErr) throw delErr;

    if (drivers.length > 0) {
      const rows = drivers.map((d) => ({
        company_id: companyId,
        driver_id: d.driverId,
        name: d.name,
        cdl_number: d.cdlNumber,
        status: d.status,
      }));
      const { error: insErr } = await sb.from("drivers").insert(rows);
      if (insErr) throw insErr;
    }

    return {
      id: company.id,
      name: company.name,
      createdAt: company.created_at,
      drivers: drivers.map((d) => ({ ...d, company: company.name })),
    };
  },

  async removeCompany(companyId: string): Promise<void> {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase not configured");
    const { error } = await sb.from("companies").delete().eq("id", companyId);
    if (error) throw error;
  },

  async addDraw(record: DrawRecord): Promise<void> {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase not configured");
    const { error } = await sb.from("draws").insert({
      company_id:
        record.companyId === "__consortium__" ? null : record.companyId,
      company_name: record.companyName,
      operator: record.operator,
      cycle: record.cycle,
      year: record.year,
      test_type: record.testType,
      pool_size: record.poolSize,
      required_drug: record.requiredDrug,
      required_alcohol: record.requiredAlcohol,
      seed_hex: record.seedHex,
      pool_hash: record.poolHash,
      algorithm_version: record.algorithmVersion,
      rate_drug: record.rateBasis.drug,
      rate_alcohol: record.rateBasis.alcohol,
      rate_citation: record.rateBasis.citation,
      primary_selections: record.selectedPrimary,
      alternate_selections: record.selectedAlternates,
    });
    if (error) throw error;
  },
};

export const dataLayer: DataLayer = supabaseEnabled() ? remoteLayer : localLayer;

export { STORAGE_KEY };
