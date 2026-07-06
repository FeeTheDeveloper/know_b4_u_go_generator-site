# Know Before You Go — DOT Random Testing Generator

FMCSA-compliant random selection tool for CDL drug & alcohol testing across multiple
trucking companies. Built for a veteran-owned enterprise. Next.js 14 (App Router) +
TypeScript + Tailwind. Deploys to Vercel with zero configuration.

> **Testing · Training · Compliance**

## Compliance basis

- **Regulatory citation:** 49 CFR § 382.305 (FMCSA drug & alcohol testing).
- **2026 minimum annual random rates** used by this tool:
  - **50%** for controlled substances
  - **10%** for alcohol
- Rates live in `lib/constants.ts::FMCSA_RATES` and are configurable so they can be
  updated when the DOT re-publishes each January.
- Selections are made with a **cryptographically seeded** Fisher–Yates shuffle
  (`crypto.getRandomValues`, `crypto.subtle.digest`). `Math.random` is never used.
- Every draw persists an ISO-8601 timestamp, a canonical **SHA-256 pool hash**, the
  seed, operator, algorithm version, and the exact selection roster — reproducible
  and auditable end-to-end.

### Compliance notes

This tool assists in selection and documentation. It **does not** replace a certified
Consortium/Third-Party Administrator (C/TPA) or Medical Review Officer (MRO). Rates and
citations should be reviewed each January when FMCSA publishes the annual notice.

## Features

- Multi-company roster management + a **consortium (combined) pool** draw.
- CSV upload per company with header auto-mapping — accepts the roster template
  (`driver_id, name, cdl_number, company, status`) and also legacy exports with
  `First Name / Last Name / CDL Number / State`. Data stays in the browser.
- Random draw with test-type (drug / alcohol / both), quarter, and year.
- Selection with replacement across cycles, without replacement within a single draw.
- Named primary selections + labeled alternates.
- YTD tracker per company: pool size, tests completed vs required, on-track / behind.
- **Selection report export** as PDF and CSV — includes operator, seed, pool hash,
  algorithm version, and a signature line, formatted for a DOT auditor or C/TPA.
- Immutable audit trail persisted in `localStorage`.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3.4 |
| Validation | Zod |
| CSV | PapaParse |
| PDF | jsPDF |
| Tests | Vitest |
| Data | Browser `localStorage` behind a `DataLayer` interface — drop in Supabase later |

## Palette (extracted from the "Know Before You Go" logo)

- Navy base: `#0A1A3F` · panel `#122A54` · surface `#1A3568`
- Gold gradient (135°): `#B8860B → #D4AF37 → #F5D67E`
- Text: `#FFFFFF` primary · `#C9D2E3` muted
- Status: `#3FB77A` on-track · `#E1BE4A` behind · `#E5484D` non-compliant

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # Vitest unit tests for selection math
npm run typecheck    # strict TypeScript check
npm run build        # production build
```

Deploy with `vercel deploy` — no environment variables required for v1.

## Repository layout

```
app/                  Next.js App Router pages (dashboard, audit trail)
components/           React UI (Sidebar, CsvUpload, DrawForm, DrawResult, ...)
lib/                  Pure logic (selection, rng, hash, csv, tracker, pdf, storage)
lib/__tests__/        Vitest tests proving FMCSA math + reproducibility
samples/              Roster template + the extracted_drivers_list.csv sample
public/               Static assets (SVG logo)
```

## The selection algorithm, briefly

`lib/selection.ts::performDraw` does the work and is 100% pure (no UI coupling):

1. Filter the pool to `status === "active"`.
2. Generate a 256-bit random seed via `crypto.getRandomValues` (or use a passed
   `seedHex` for reproduction).
3. Shuffle the pool with **Fisher–Yates** driven by a mulberry32 PRNG re-keyed
   from the seed.
4. Compute per-cycle required counts (`Math.ceil(annual / 4)`).
5. Pull `primary` off the top of the shuffle; pull `alternates` (25% of primary,
   min 1) off the next slice — no repeats within the draw.
6. Compute a SHA-256 hash of the sorted `driverId|cdlNumber` pool as the audit
   pool hash.

Unit tests in `lib/__tests__/selection.test.ts` verify: exact FMCSA rate math, correct
quarterly split, uniform distribution across 20 000 trials, and reproducibility from
a fixed seed.

## Roadmap (v2)

- Supabase backend (drop-in, `DataLayer` interface already isolates persistence).
- Auth + role separation (operator vs. auditor).
- Email delivery of selection reports.
- Push a signed audit ledger to R2/S3 for tamper evidence.
- Consortium view: per-carrier rollups in one PDF.

## License

Proprietary — Vet Gang. All rights reserved.
