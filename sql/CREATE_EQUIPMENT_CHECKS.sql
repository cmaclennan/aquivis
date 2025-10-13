-- Create equipment_checks anchored to plant_room_checks

-- Ensure table exists (create minimal skeleton)
create table if not exists equipment_checks (
  id uuid primary key default gen_random_uuid()
);

-- Add required columns defensively
alter table equipment_checks add column if not exists plant_room_check_id uuid;
alter table equipment_checks add column if not exists equipment_id uuid;
alter table equipment_checks add column if not exists status text;
alter table equipment_checks add column if not exists notes text;
alter table equipment_checks add column if not exists readings jsonb;
alter table equipment_checks add column if not exists created_at timestamptz default now();

-- Defaults and checks
alter table equipment_checks alter column status set default 'normal';
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'equipment_checks_status_check'
  ) then
    alter table equipment_checks add constraint equipment_checks_status_check check (status in ('normal','warning','fault'));
  end if;
end $$;

-- Foreign keys (if not present)
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'equipment_checks_prc_fkey'
  ) then
    alter table equipment_checks
      add constraint equipment_checks_prc_fkey
      foreign key (plant_room_check_id)
      references plant_room_checks(id)
      on delete cascade;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'equipment_checks_equipment_fkey'
  ) then
    alter table equipment_checks
      add constraint equipment_checks_equipment_fkey
      foreign key (equipment_id)
      references equipment(id)
      on delete cascade;
  end if;
end $$;

-- Indexes
create index if not exists idx_equipment_checks_plant_room_check on equipment_checks(plant_room_check_id);
create index if not exists idx_equipment_checks_equipment on equipment_checks(equipment_id);


