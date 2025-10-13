-- Create plant rooms and plant room checks tables
-- Apply this in Supabase SQL editor

create table if not exists plant_rooms (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  name text not null,
  check_frequency text not null default 'daily', -- 'daily','2x_daily','3x_daily','every_other_day','weekly'
  check_times text[] default array['09:00']::text[],
  -- Optional specific day selection (0=Sunday..6=Saturday)
  check_days integer[] default null,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists plant_room_checks (
  id uuid primary key default gen_random_uuid(),
  plant_room_id uuid not null references plant_rooms(id) on delete cascade,
  check_date date not null default current_date,
  check_time text not null default '09:00',
  readings jsonb, -- flexible payload for readings and observations
  notes text,
  performed_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Helpful indexes
create index if not exists idx_plant_rooms_property on plant_rooms(property_id) where is_active = true;
create index if not exists idx_plant_room_checks_room_date on plant_room_checks(plant_room_id, check_date);

-- Backfill column for environments that already created the table without check_days
alter table if exists plant_rooms
  add column if not exists check_days integer[];






