-- Extend equipment with optional measurement metadata and thresholds
-- Safe to run multiple times

alter table if exists equipment
  add column if not exists measurement_type text default 'none' check (measurement_type in ('pressure','rpm','hz','percent','litres','none'));

alter table if exists equipment
  add column if not exists equipment_type text default 'other';

alter table if exists equipment
  add column if not exists measurement_thresholds jsonb;

-- Flexible measurement configuration describing what to capture on checks
alter table if exists equipment
  add column if not exists measurement_config jsonb;

-- Ensure name column exists for UI inserts (nullable for backwards compatibility)
alter table if exists equipment
  add column if not exists name text;


