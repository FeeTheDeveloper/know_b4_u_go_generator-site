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
| Data | Supabase Postgres (or `localStorage` when env vars are absent, for local dev) |

## Palette (extracted from the "Know Before You Go" logo)

- Navy base: `#0A1A3F` · panel `#122A54` · surface `#1A3568`
- Gold gradient (135°): `#B8860B → #D4AF37 → #F5D67E`
- Text: `#FFFFFF` primary · `#C9D2E3` muted
- Status: `#3FB77A` on-track · `#E1BE4A` behind · `#E5484D` non-compliant

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase URL + anon key (or leave empty)
npm run dev                  # http://localhost:3000
npm test                     # Vitest unit tests for selection math
npm run typecheck            # strict TypeScript check
npm run build                # production build
```

Without env vars set, the app runs in `local` backend mode (browser `localStorage`) —
ideal for a quick tour. With `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
set, it switches to Supabase automatically. The current backend is shown as a chip on
every page.

## Deploying to Vercel

### 1. Create the Supabase project (~60 seconds)

- Go to <https://supabase.com/dashboard> → **New project**.
- Name: `know-before-you-go` · Region: **East US (N. Virginia)** · pick a strong DB password.
- Wait for the project to finish provisioning (~1 min).

### 2. Apply the migration

Open **SQL Editor → New query** in the Supabase dashboard, paste the entire
contents of `supabase/migrations/20260706000000_init.sql`, and run it. It creates
three tables (`companies`, `drivers`, `draws`) with RLS enabled, triggers that
make the `draws` table immutable, and the v1 anon-access policies.

Prefer the CLI? `supabase link --project-ref YOUR-REF && supabase db push` also works.

### 3. Grab the two keys

Supabase → **Settings → API**:

- **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
- **Project API keys → `anon` `public`** → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Import the repo on Vercel

- Vercel → **New Project → Import Git Repository** → pick this repo.
- Framework Preset: **Next.js** (auto-detected).
- **Environment Variables** → add the two above for Production, Preview, and Development.

### 5. Deploy and verify

Vercel deploys automatically. On the live URL, confirm the header chip on the
dashboard reads `backend: supabase` (not `local`). Upload the roster template
from `samples/roster_template.csv` as a smoke test — the drivers should persist
across a page refresh.

Region pin: `iad1` (Vercel) ↔ `us-east-1` (Supabase) for minimum latency.

The included `vercel.json` sets basic security headers (`X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` disabling
camera/mic/geo) and pins the region.

## Security

This is scaffolded as an **internal, unauthenticated** tool for v1: the Supabase anon
key policies allow full CRUD from any client that has the key.

Before real DOT PII lands in this deployment:

- Add Supabase Auth (magic-link email) and require a signed-in session on every page.
- Replace the anon policies in the migration with per-user / per-org policies that
  check `auth.uid()` and a `memberships` table.
- Rotate the anon key and lock the Vercel URL behind Vercel Password Protection or
  your SSO.
- Consider moving the `service_role` key server-side and mediating mutations through
  Next.js Route Handlers.

The migration ships with the anon policies clearly labeled `SECURITY NOTE` and RLS
already enabled, so tightening is an edit-in-place operation, not a re-architecture.

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
