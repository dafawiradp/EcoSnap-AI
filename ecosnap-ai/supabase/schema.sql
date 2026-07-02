-- =============================================================================
-- EcoSnap AI — Complete Supabase Schema (v2)
-- =============================================================================
-- Run this entire file in the Supabase SQL Editor:
--   Dashboard → SQL Editor → New query → paste → Run
-- The script is idempotent: safe to run multiple times.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. REPORTS TABLE
-- ---------------------------------------------------------------------------
create table if not exists reports (
  id                  uuid          primary key default gen_random_uuid(),

  -- Core submission fields
  photo_url           text          not null,
  location            text          not null default '',
  description         text          not null default '',

  -- Classification
  pollution_category  text          not null,
  waste_type          text,                          -- nullable; only for waste_pollution

  -- Scoring
  urgency_level       text          not null,
  confidence          integer       not null default 0,

  -- Actions
  recommended_actions text[]        not null,

  -- GPS coordinates
  latitude            double precision,
  longitude           double precision,

  -- Reverse-geocoded location fields (nullable for backward compat)
  geo_address         text,
  geo_city            text,
  geo_province        text,
  geo_country         text,

  -- Timestamp
  created_at          timestamptz   not null default now()
);

create index if not exists reports_created_at_idx
  on reports (created_at desc);


-- ---------------------------------------------------------------------------
-- 2. MIGRATIONS (safe to run on an existing table)
-- ---------------------------------------------------------------------------
alter table reports add column if not exists confidence  integer       not null default 0;
alter table reports add column if not exists latitude    double precision;
alter table reports add column if not exists longitude   double precision;
alter table reports add column if not exists waste_type  text;
alter table reports add column if not exists geo_address  text;
alter table reports add column if not exists geo_city     text;
alter table reports add column if not exists geo_province text;
alter table reports add column if not exists geo_country  text;


-- ---------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
alter table reports enable row level security;

drop policy if exists "anon_insert_reports" on reports;
drop policy if exists "anon_select_reports" on reports;

-- Allow anonymous inserts (createReport via anon key)
create policy "anon_insert_reports"
  on reports for insert to anon
  with check (true);

-- Allow anonymous reads (dashboard, fetchReportById)
create policy "anon_select_reports"
  on reports for select to anon
  using (true);


-- ---------------------------------------------------------------------------
-- 4. STORAGE BUCKET (uncomment if creating via SQL)
-- ---------------------------------------------------------------------------
-- insert into storage.buckets (id, name, public)
-- values ('report-photos', 'report-photos', true)
-- on conflict (id) do nothing;
--
-- create policy "anon_upload_report_photos" on storage.objects
--   for insert to anon with check (bucket_id = 'report-photos');
--
-- create policy "public_read_report_photos" on storage.objects
--   for select to anon using (bucket_id = 'report-photos');
