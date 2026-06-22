-- EcoSnap AI — Supabase schema
-- Run this in the Supabase SQL Editor: https://app.supabase.com/project/_/sql
-- Navigate to your project → SQL Editor → New Query → paste and run.

create table if not exists reports (
  id                  uuid primary key default gen_random_uuid(),
  photo_url           text not null,
  location            text not null,
  description         text not null default '',
  pollution_category  text not null,
  urgency_level       text not null,
  recommended_actions text[] not null,
  created_at          timestamptz not null default now()
);

-- Optional: index for dashboard sort order (most recent first)
create index if not exists reports_created_at_idx on reports (created_at desc);
