import Papa from "papaparse";
import type { Driver } from "./types";

export interface CsvParseResult {
  drivers: Driver[];
  warnings: string[];
  errors: string[];
}

const HEADER_MAP: Record<string, keyof RawRow> = {
  driver_id: "driverId",
  driverid: "driverId",
  id: "driverId",
  row: "row",
  name: "name",
  full_name: "name",
  first_name: "firstName",
  firstname: "firstName",
  first: "firstName",
  last_name: "lastName",
  lastname: "lastName",
  last: "lastName",
  cdl_number: "cdlNumber",
  cdl: "cdlNumber",
  cdl_no: "cdlNumber",
  license_number: "cdlNumber",
  state: "state",
  company: "company",
  carrier: "company",
  status: "status",
};

interface RawRow {
  driverId?: string;
  row?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  cdlNumber?: string;
  state?: string;
  company?: string;
  status?: string;
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

function normalizeStatus(v: string | undefined): "active" | "inactive" {
  if (!v) return "active";
  const s = v.trim().toLowerCase();
  if (["inactive", "terminated", "off", "no", "false", "0"].includes(s))
    return "inactive";
  return "active";
}

export function parseDriversCsv(
  text: string,
  fallbackCompany?: string,
): CsvParseResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => normalizeHeader(h),
  });

  if (parsed.errors && parsed.errors.length > 0) {
    for (const e of parsed.errors) {
      errors.push(`Row ${e.row ?? "?"}: ${e.message}`);
    }
  }

  const drivers: Driver[] = [];
  const seenIds = new Set<string>();
  const seenCdl = new Set<string>();

  parsed.data.forEach((row, idx) => {
    const raw: RawRow = {};
    for (const [k, v] of Object.entries(row)) {
      const mapped = HEADER_MAP[k];
      if (mapped) (raw as Record<string, string | undefined>)[mapped] = v?.trim();
    }

    const combinedName =
      raw.name && raw.name.length > 0
        ? raw.name
        : [raw.firstName, raw.lastName].filter(Boolean).join(" ").trim();

    const cdl = (raw.cdlNumber ?? "").trim();
    if (!combinedName && !cdl) {
      return;
    }

    if (!combinedName) {
      warnings.push(`Row ${idx + 2}: missing name (kept for CDL ${cdl || "?"})`);
    }
    if (!cdl) {
      warnings.push(`Row ${idx + 2}: missing CDL number for "${combinedName}"`);
    }

    let driverId = raw.driverId?.trim();
    if (!driverId) {
      driverId = cdl || `ROW-${idx + 2}`;
    }
    if (seenIds.has(driverId)) {
      warnings.push(`Row ${idx + 2}: duplicate driver_id "${driverId}" skipped`);
      return;
    }
    seenIds.add(driverId);
    if (cdl && seenCdl.has(cdl)) {
      warnings.push(`Row ${idx + 2}: duplicate CDL "${cdl}" skipped`);
      return;
    }
    if (cdl) seenCdl.add(cdl);

    const company =
      raw.company?.trim() ||
      raw.state?.trim() ||
      fallbackCompany?.trim() ||
      "Unassigned";

    drivers.push({
      driverId,
      name: combinedName || "(unknown)",
      cdlNumber: cdl || "(pending)",
      company,
      status: normalizeStatus(raw.status),
    });
  });

  return { drivers, warnings, errors };
}

export function driversToCsv(drivers: readonly Driver[]): string {
  return Papa.unparse(
    drivers.map((d) => ({
      driver_id: d.driverId,
      name: d.name,
      cdl_number: d.cdlNumber,
      company: d.company,
      status: d.status,
    })),
  );
}
