import type { AuditStore, Company, DrawRecord } from "./types";

const STORAGE_KEY = "kbug.auditStore.v1";

export interface DataLayer {
  load(): AuditStore;
  save(store: AuditStore): void;
  addCompany(name: string): Company;
  updateCompanyDrivers(companyId: string, drivers: Company["drivers"]): Company;
  removeCompany(companyId: string): void;
  addDraw(record: DrawRecord): void;
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

export const dataLayer: DataLayer = {
  load(): AuditStore {
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

  save(store: AuditStore): void {
    memoryStore = store;
    if (!localStorageAvailable()) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  },

  addCompany(name: string): Company {
    const store = this.load();
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
    this.save(store);
    return company;
  },

  updateCompanyDrivers(companyId: string, drivers: Company["drivers"]): Company {
    const store = this.load();
    const idx = store.companies.findIndex((c) => c.id === companyId);
    if (idx === -1) throw new Error(`Unknown company ${companyId}`);
    store.companies[idx] = { ...store.companies[idx], drivers };
    this.save(store);
    return store.companies[idx];
  },

  removeCompany(companyId: string): void {
    const store = this.load();
    store.companies = store.companies.filter((c) => c.id !== companyId);
    this.save(store);
  },

  addDraw(record: DrawRecord): void {
    const store = this.load();
    store.draws.unshift(record);
    this.save(store);
  },
};

export { STORAGE_KEY };
