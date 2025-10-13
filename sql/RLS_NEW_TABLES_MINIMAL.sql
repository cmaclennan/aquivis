-- Minimal RLS for new operations tables
-- Assumes profiles(id, company_id), properties(company_id), equipment(property_id), plant_rooms(property_id)

-- Enable RLS
alter table if exists plant_rooms enable row level security;
alter table if exists plant_room_checks enable row level security;
alter table if exists equipment enable row level security;
alter table if exists equipment_maintenance_logs enable row level security;
alter table if exists equipment_checks enable row level security;
alter table if exists jobs enable row level security;

-- Helper: get current user's company id (create in public schema, not auth)
create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from profiles where id = auth.uid();
$$;

grant execute on function public.current_company_id() to authenticated, service_role, anon;

-- plant_rooms: same company as property's company
drop policy if exists select_plant_rooms on plant_rooms;
create policy select_plant_rooms on plant_rooms for select using (
  exists (
    select 1 from properties p
    where p.id = plant_rooms.property_id
      and p.company_id = public.current_company_id()
  )
);

drop policy if exists modify_plant_rooms on plant_rooms;
create policy modify_plant_rooms on plant_rooms for all using (
  exists (
    select 1 from properties p
    where p.id = plant_rooms.property_id
      and p.company_id = public.current_company_id()
  )
) with check (
  exists (
    select 1 from properties p
    where p.id = plant_rooms.property_id
      and p.company_id = public.current_company_id()
  )
);

-- plant_room_checks: join through plant_rooms -> properties
drop policy if exists select_plant_room_checks on plant_room_checks;
create policy select_plant_room_checks on plant_room_checks for select using (
  exists (
    select 1 from plant_rooms pr join properties p on p.id = pr.property_id
    where pr.id = plant_room_checks.plant_room_id and p.company_id = public.current_company_id()
  )
);

drop policy if exists modify_plant_room_checks on plant_room_checks;
create policy modify_plant_room_checks on plant_room_checks for all using (
  exists (
    select 1 from plant_rooms pr join properties p on p.id = pr.property_id
    where pr.id = plant_room_checks.plant_room_id and p.company_id = public.current_company_id()
  )
) with check (
  exists (
    select 1 from plant_rooms pr join properties p on p.id = pr.property_id
    where pr.id = plant_room_checks.plant_room_id and p.company_id = public.current_company_id()
  )
);

-- equipment
drop policy if exists select_equipment on equipment;
create policy select_equipment on equipment for select using (
  exists (
    select 1 from properties p where p.id = equipment.property_id and p.company_id = public.current_company_id()
  )
);

drop policy if exists modify_equipment on equipment;
create policy modify_equipment on equipment for all using (
  exists (
    select 1 from properties p where p.id = equipment.property_id and p.company_id = public.current_company_id()
  )
) with check (
  exists (
    select 1 from properties p where p.id = equipment.property_id and p.company_id = public.current_company_id()
  )
);

-- equipment_maintenance_logs via equipment -> properties
drop policy if exists select_equipment_logs on equipment_maintenance_logs;
create policy select_equipment_logs on equipment_maintenance_logs for select using (
  exists (
    select 1 from equipment e join properties p on p.id = e.property_id
    where e.id = equipment_maintenance_logs.equipment_id and p.company_id = public.current_company_id()
  )
);

drop policy if exists modify_equipment_logs on equipment_maintenance_logs;
create policy modify_equipment_logs on equipment_maintenance_logs for all using (
  exists (
    select 1 from equipment e join properties p on p.id = e.property_id
    where e.id = equipment_maintenance_logs.equipment_id and p.company_id = public.current_company_id()
  )
) with check (
  exists (
    select 1 from equipment e join properties p on p.id = e.property_id
    where e.id = equipment_maintenance_logs.equipment_id and p.company_id = public.current_company_id()
  )
);

-- equipment_checks via equipment -> properties
drop policy if exists select_equipment_checks on equipment_checks;
create policy select_equipment_checks on equipment_checks for select using (
  exists (
    select 1 from equipment e join properties p on p.id = e.property_id
    where e.id = equipment_checks.equipment_id and p.company_id = public.current_company_id()
  )
);

drop policy if exists modify_equipment_checks on equipment_checks;
create policy modify_equipment_checks on equipment_checks for all using (
  exists (
    select 1 from equipment e join properties p on p.id = e.property_id
    where e.id = equipment_checks.equipment_id and p.company_id = public.current_company_id()
  )
) with check (
  exists (
    select 1 from equipment e join properties p on p.id = e.property_id
    where e.id = equipment_checks.equipment_id and p.company_id = public.current_company_id()
  )
);

-- jobs scoped by company_id
drop policy if exists select_jobs on jobs;
create policy select_jobs on jobs for select using (
  jobs.company_id = public.current_company_id()
);

drop policy if exists modify_jobs on jobs;
create policy modify_jobs on jobs for all using (
  jobs.company_id = public.current_company_id()
) with check (
  jobs.company_id = public.current_company_id()
);


