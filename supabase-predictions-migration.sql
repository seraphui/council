-- ============================================================
-- Predictions Table Migration: Yes/No Markets -> Entity Forecasts
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor)
-- ============================================================

-- Drop the old predictions table and recreate with new schema
drop table if exists predictions;

create table predictions (
  id uuid primary key default gen_random_uuid(),
  entity text not null check (entity in ('ARES', 'ATHENA', 'HERMES', 'PSYCHE')),
  category text not null check (category in ('Military & Security', 'Geopolitics & Diplomacy', 'Economics & Markets', 'Society & Human Behavior')),
  prediction text not null,
  target_date date not null,
  confidence int not null check (confidence >= 0 and confidence <= 100),
  reasoning text not null,
  status text default 'PENDING' check (status in ('PENDING', 'CONFIRMED', 'FAILED')),
  issued_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Enable RLS
alter table predictions enable row level security;

-- Policies
create policy "Public read predictions" on predictions for select using (true);
create policy "Insert predictions" on predictions for insert with check (true);
create policy "Update predictions" on predictions for update using (true);

-- Index for efficient queries
create index idx_predictions_status on predictions(status);
create index idx_predictions_entity on predictions(entity);
create index idx_predictions_issued_at on predictions(issued_at desc);
