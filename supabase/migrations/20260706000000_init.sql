-- Know Before You Go — DOT random-testing generator
-- v1 schema: companies, drivers, and immutable draw audit trail.

create extension if not exists "pgcrypto";

create table if not exists public.companies (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    created_at timestamptz not null default now(),
    constraint companies_name_unique unique (name)
);

create table if not exists public.drivers (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    driver_id text not null,
    name text not null,
    cdl_number text not null,
    status text not null default 'active' check (status in ('active', 'inactive')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint drivers_company_driver_id_unique unique (company_id, driver_id)
);

create index if not exists drivers_company_id_idx on public.drivers (company_id);
create index if not exists drivers_status_idx on public.drivers (status);

create table if not exists public.draws (
    id uuid primary key default gen_random_uuid(),
    company_id uuid references public.companies(id) on delete set null,
    company_name text not null,
    operator text not null,
    cycle text not null check (cycle in ('Q1', 'Q2', 'Q3', 'Q4')),
    year integer not null,
    test_type text not null check (test_type in ('drug', 'alcohol', 'both')),
    pool_size integer not null check (pool_size >= 0),
    required_drug integer not null check (required_drug >= 0),
    required_alcohol integer not null check (required_alcohol >= 0),
    seed_hex text not null,
    pool_hash text not null,
    algorithm_version text not null,
    rate_drug numeric(4, 3) not null,
    rate_alcohol numeric(4, 3) not null,
    rate_citation text not null,
    primary_selections jsonb not null,
    alternate_selections jsonb not null,
    created_at timestamptz not null default now()
);

create index if not exists draws_company_id_idx on public.draws (company_id);
create index if not exists draws_year_cycle_idx on public.draws (year, cycle);
create index if not exists draws_created_at_idx on public.draws (created_at desc);

-- Enforce immutability: audit records cannot be edited or deleted once written.
create or replace function public.reject_draw_mutation() returns trigger as $$
begin
    raise exception 'draws is an immutable audit table';
end;
$$ language plpgsql;

drop trigger if exists draws_no_update on public.draws;
create trigger draws_no_update
before update on public.draws
for each row execute function public.reject_draw_mutation();

drop trigger if exists draws_no_delete on public.draws;
create trigger draws_no_delete
before delete on public.draws
for each row execute function public.reject_draw_mutation();

-- updated_at trigger on drivers
create or replace function public.touch_updated_at() returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists drivers_touch_updated_at on public.drivers;
create trigger drivers_touch_updated_at
before update on public.drivers
for each row execute function public.touch_updated_at();

-- Row Level Security
alter table public.companies enable row level security;
alter table public.drivers enable row level security;
alter table public.draws enable row level security;

-- v1 policy: allow the anon key full CRUD on companies/drivers and insert-only on draws.
-- SECURITY NOTE: This ships the app without user authentication. Protect the deployed
-- URL and rotate to Supabase Auth (magic link) with per-user policies before real
-- production PII lands here. See README "Security" section.
drop policy if exists companies_anon_all on public.companies;
create policy companies_anon_all on public.companies
    for all to anon using (true) with check (true);

drop policy if exists drivers_anon_all on public.drivers;
create policy drivers_anon_all on public.drivers
    for all to anon using (true) with check (true);

drop policy if exists draws_anon_insert on public.draws;
create policy draws_anon_insert on public.draws
    for insert to anon with check (true);

drop policy if exists draws_anon_select on public.draws;
create policy draws_anon_select on public.draws
    for select to anon using (true);
