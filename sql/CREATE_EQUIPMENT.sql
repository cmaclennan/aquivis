-- Create equipment and equipment maintenance logs
-- Apply this in Supabase SQL editor

create table if not exists equipment (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  unit_id uuid references units(id) on delete set null,
  plant_room_id uuid references plant_rooms(id) on delete set null,
  name text not null,
  category text, -- pump, filter, chlorinator, etc.
  maintenance_frequency text, -- daily, weekly, monthly, quarterly
  maintenance_times text[] default array['09:00']::text[],
  maintenance_scheduled boolean not null default false, -- only schedule tasks when true
  notes text,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Backfill columns in case table already existed without them
alter table equipment add column if not exists property_id uuid references properties(id) on delete cascade;
alter table equipment add column if not exists unit_id uuid references units(id) on delete set null;
alter table equipment add column if not exists plant_room_id uuid references plant_rooms(id) on delete set null;
alter table equipment add column if not exists category text;
alter table equipment add column if not exists maintenance_frequency text;
alter table equipment add column if not exists maintenance_times text[] default array['09:00']::text[];
alter table equipment add column if not exists maintenance_scheduled boolean default false;
alter table equipment add column if not exists notes text;
alter table equipment add column if not exists is_active boolean default true;

create table if not exists equipment_maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references equipment(id) on delete cascade,
  maintenance_date date not null default current_date,
  maintenance_time text not null default '09:00',
  actions jsonb, -- flexible actions performed
  notes text,
  performed_by uuid references profiles(id),
  created_at timestamptz default now()
);

do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'equipment' and column_name = 'property_id'
  ) then
    create index if not exists idx_equipment_property on equipment(property_id) where is_active = true;
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'equipment' and column_name = 'unit_id'
  ) then
    create index if not exists idx_equipment_unit on equipment(unit_id) where is_active = true;
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'equipment' and column_name = 'plant_room_id'
  ) then
    create index if not exists idx_equipment_plant_room on equipment(plant_room_id) where is_active = true;
  end if;
end $$;
create index if not exists idx_equipment_logs_equipment_date on equipment_maintenance_logs(equipment_id, maintenance_date);


