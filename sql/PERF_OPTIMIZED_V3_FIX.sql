-- Fix for 42P16: cannot drop columns from view
-- Drop then create optimized views to allow column set changes safely

begin;

drop view if exists public.services_optimized;
create view public.services_optimized as
select
  s.id,
  s.service_date,
  s.service_type,
  s.status,
  s.unit_id,
  u.name as unit_name,
  u.unit_type,
  p.id as property_id,
  p.name as property_name,
  p.company_id
from public.services s
join public.units u on u.id = s.unit_id
join public.properties p on p.id = u.property_id;

drop view if exists public.equipment_logs_optimized;
create view public.equipment_logs_optimized as
select
  l.maintenance_date,
  l.maintenance_time,
  l.actions,
  l.notes,
  l.equipment_id,
  e.name as equipment_name,
  p.id as property_id,
  p.name as property_name,
  p.company_id
from public.equipment_maintenance_logs l
join public.equipment e on e.id = l.equipment_id
join public.properties p on p.id = e.property_id;

commit;
