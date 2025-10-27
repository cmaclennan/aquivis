-- Dashboard summary RPC v2: fix enum comparison for service_status
-- Avoid invalid enum casts by comparing on text

create or replace function public.get_dashboard_summary(p_user_id uuid)
returns jsonb
language plpgsql
stable
as $$
declare
  v_company_id uuid;
  v_total_properties bigint := 0;
  v_total_units bigint := 0;
  v_total_services_this_month bigint := 0;
  v_total_services_last_month bigint := 0;
  v_upcoming_services_count bigint := 0;
  v_overdue_services_count bigint := 0;
  v_total_customers bigint := 0;
  v_active_equipment_count bigint := 0;
  v_month_start date := date_trunc('month', current_date)::date;
  v_prev_month_start date := (date_trunc('month', current_date) - interval '1 month')::date;
  v_prev_month_end date := (date_trunc('month', current_date) - interval '1 day')::date;
  v_upcoming_end date := (current_date + interval '14 days')::date;
begin
  select company_id into v_company_id from public.profiles where id = p_user_id;
  if v_company_id is null then
    return jsonb_build_object();
  end if;

  -- Properties
  select count(*) into v_total_properties from public.properties p where p.company_id = v_company_id;

  -- Units (scoped via property)
  select count(*) into v_total_units
  from public.units u
  join public.properties p on p.id = u.property_id
  where p.company_id = v_company_id;

  -- Customers
  select count(*) into v_total_customers from public.customers c where c.company_id = v_company_id;

  -- Services this month
  select count(*) into v_total_services_this_month
  from public.services s
  join public.units u on u.id = s.unit_id
  join public.properties p on p.id = u.property_id
  where p.company_id = v_company_id
    and s.service_date >= v_month_start
    and s.service_date < (v_month_start + interval '1 month');

  -- Services last month
  select count(*) into v_total_services_last_month
  from public.services s
  join public.units u on u.id = s.unit_id
  join public.properties p on p.id = u.property_id
  where p.company_id = v_company_id
    and s.service_date >= v_prev_month_start
    and s.service_date <= v_prev_month_end;

  -- Upcoming services (next 14 days)
  select count(*) into v_upcoming_services_count
  from public.services s
  join public.units u on u.id = s.unit_id
  join public.properties p on p.id = u.property_id
  where p.company_id = v_company_id
    and s.service_date >= current_date
    and s.service_date <= v_upcoming_end;

  -- Overdue services (scheduled in past and not completed); compare status as text
  select count(*) into v_overdue_services_count
  from public.services s
  join public.units u on u.id = s.unit_id
  join public.properties p on p.id = u.property_id
  where p.company_id = v_company_id
    and s.service_date < current_date
    and coalesce(s.status::text, '') <> 'completed';

  -- Active equipment
  select count(*) into v_active_equipment_count
  from public.equipment e
  join public.properties p on p.id = e.property_id
  where p.company_id = v_company_id
    and coalesce(e.is_active, true) = true;

  return jsonb_build_object(
    'total_properties', v_total_properties,
    'total_units', v_total_units,
    'total_services_this_month', v_total_services_this_month,
    'total_services_last_month', v_total_services_last_month,
    'upcoming_services_count', v_upcoming_services_count,
    'overdue_services_count', v_overdue_services_count,
    'total_customers', v_total_customers,
    'active_equipment_count', v_active_equipment_count
  );
end;
$$;
