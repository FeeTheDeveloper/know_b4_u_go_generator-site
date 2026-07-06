#!/usr/bin/env node
// Applies supabase/migrations/*.sql against a Supabase project using the
// service_role key. Intended for one-shot bootstrapping before Vercel deploy.
//
// Usage:
//   SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/apply-migration.mjs

import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "supabase", "migrations");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment.",
  );
  console.error(
    "Get them from Supabase → Settings → API. Never commit the service role key.",
  );
  process.exit(1);
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.error(`No .sql migrations found in ${migrationsDir}`);
  process.exit(1);
}

console.log(`Applying ${files.length} migration(s) to ${url}`);

for (const file of files) {
  const sql = readFileSync(join(migrationsDir, file), "utf8");
  const endpoint = `${url}/rest/v1/rpc/exec_sql`;
  console.log(`  → ${file}`);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`\nMigration ${file} failed with HTTP ${res.status}:`);
    console.error(text);
    console.error(
      "\nIf the error is that exec_sql does not exist, paste the SQL directly into",
    );
    console.error(
      "Supabase → SQL Editor → New query. It runs in a single transaction.",
    );
    process.exit(1);
  }
}

console.log("Migrations applied successfully.");
