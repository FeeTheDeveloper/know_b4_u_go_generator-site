import type { Quarter, TestType } from "./constants";

export interface Driver {
  driverId: string;
  name: string;
  cdlNumber: string;
  company: string;
  status: "active" | "inactive";
}

export interface Company {
  id: string;
  name: string;
  createdAt: string;
  drivers: Driver[];
}

export interface DrawRecord {
  id: string;
  timestamp: string;
  operator: string;
  companyId: string;
  companyName: string;
  testType: TestType;
  cycle: Quarter;
  year: number;
  poolSize: number;
  requiredDrug: number;
  requiredAlcohol: number;
  selectedPrimary: Driver[];
  selectedAlternates: Driver[];
  seedHex: string;
  poolHash: string;
  algorithmVersion: string;
  rateBasis: {
    drug: number;
    alcohol: number;
    citation: string;
  };
}

export interface AuditStore {
  companies: Company[];
  draws: DrawRecord[];
}
