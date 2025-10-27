-- SQL aggregation for chemicals summary via RPC
-- New versioned migration; do not modify previous files.

create or replace function public.chemicals_summary_agg(
  p_company_id uuid,
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  chemical_type text,
  unit_of_measure text,
  total numeric
)
language sql
stable
as $$
  select
    ca.chemical_type,
    ca.unit_of_measure,
    sum(coalesce(ca.quantity, 0))::numeric as total
  from public.chemical_additions ca
  join public.services s on s.id = ca.service_id
  join public.units u on u.id = s.unit_id
  join public.properties p on p.id = u.property_id
  where p.company_id = p_company_id
    and s.service_date >= p_start
    and s.service_date <= p_end
  group by ca.chemical_type, ca.unit_of_measure
$$;
