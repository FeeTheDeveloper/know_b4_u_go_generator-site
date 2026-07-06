import { jsPDF } from "jspdf";
import { FMCSA_RATES, TEST_TYPE_LABEL } from "./constants";
import type { DrawRecord } from "./types";

const NAVY = "#0A1A3F";
const GOLD = "#D4AF37";
const INK = "#111111";
const MUTED = "#4B5563";

export function buildDrawPdf(record: DrawRecord): Blob {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  let y = 48;

  doc.setFillColor(NAVY);
  doc.rect(0, 0, W, 90, "F");
  doc.setTextColor(GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("KNOW BEFORE YOU GO", 40, 45);
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("DOT Random Testing — Selection Report", 40, 68);

  y = 130;
  doc.setTextColor(INK);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(record.companyName, 40, y);
  y += 20;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(MUTED);
  const meta = [
    `Draw ID: ${record.id}`,
    `Timestamp (UTC): ${record.timestamp}`,
    `Operator: ${record.operator}`,
    `Cycle: ${record.cycle} ${record.year}   Test type: ${TEST_TYPE_LABEL[record.testType]}`,
    `Pool size (active): ${record.poolSize}`,
    `Rate basis: ${(record.rateBasis.drug * 100).toFixed(0)}% drug / ${(record.rateBasis.alcohol * 100).toFixed(0)}% alcohol (${record.rateBasis.citation})`,
    `Algorithm: ${record.algorithmVersion}`,
  ];
  for (const m of meta) {
    doc.text(m, 40, y);
    y += 14;
  }

  y += 8;
  doc.setDrawColor(GOLD);
  doc.setLineWidth(1);
  doc.line(40, y, W - 40, y);
  y += 18;

  doc.setTextColor(INK);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Primary selections (${record.selectedPrimary.length})`, 40, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const d of record.selectedPrimary) {
    if (y > 720) {
      doc.addPage();
      y = 50;
    }
    doc.text(`• ${d.name} — CDL ${d.cdlNumber} (${d.driverId})`, 48, y);
    y += 13;
  }

  y += 10;
  if (y > 700) {
    doc.addPage();
    y = 50;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Alternates (${record.selectedAlternates.length})`, 40, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const d of record.selectedAlternates) {
    if (y > 720) {
      doc.addPage();
      y = 50;
    }
    doc.text(`• ${d.name} — CDL ${d.cdlNumber} (${d.driverId})`, 48, y);
    y += 13;
  }

  y += 18;
  if (y > 680) {
    doc.addPage();
    y = 60;
  }
  doc.setDrawColor(GOLD);
  doc.line(40, y, W - 40, y);
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(INK);
  doc.text("Reproducibility record", 40, y);
  y += 14;
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(MUTED);
  doc.text(`seed:      ${record.seedHex}`, 40, y);
  y += 12;
  doc.text(`pool_hash: ${record.poolHash}`, 40, y);
  y += 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(INK);
  doc.text("Operator signature: ______________________________", 40, y);
  y += 18;
  doc.text("Date: ____________________", 40, y);

  y += 30;
  doc.setFontSize(8);
  doc.setTextColor(MUTED);
  const disclaimer = doc.splitTextToSize(
    `This report documents a random selection made by the Know Before You Go generator using a cryptographically seeded Fisher–Yates shuffle. Rates cited above are the FMCSA minimums for calendar year ${FMCSA_RATES.effectiveYear}. This tool assists in selection and does not replace a certified C/TPA or MRO.`,
    W - 80,
  );
  doc.text(disclaimer, 40, y);

  return doc.output("blob");
}

export function drawToCsv(record: DrawRecord): string {
  const rows: string[] = [];
  rows.push("category,driver_id,name,cdl_number,company");
  for (const d of record.selectedPrimary) {
    rows.push(
      `primary,${csv(d.driverId)},${csv(d.name)},${csv(d.cdlNumber)},${csv(d.company)}`,
    );
  }
  for (const d of record.selectedAlternates) {
    rows.push(
      `alternate,${csv(d.driverId)},${csv(d.name)},${csv(d.cdlNumber)},${csv(d.company)}`,
    );
  }
  return rows.join("\n") + "\n";
}

function csv(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
