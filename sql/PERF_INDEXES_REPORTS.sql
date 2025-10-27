-- Performance indexes for report endpoints

-- Company scoping
CREATE INDEX IF NOT EXISTS idx_properties_company ON public.properties (company_id);
CREATE INDEX IF NOT EXISTS idx_customers_company ON public.customers (company_id);

-- Units -> Properties
CREATE INDEX IF NOT EXISTS idx_units_property ON public.units (property_id);

-- Services
CREATE INDEX IF NOT EXISTS idx_services_unit_date ON public.services (unit_id, service_date DESC);
CREATE INDEX IF NOT EXISTS idx_services_date ON public.services (service_date DESC);
CREATE INDEX IF NOT EXISTS idx_services_status_date ON public.services (status, service_date DESC);
CREATE INDEX IF NOT EXISTS idx_services_type_date ON public.services (service_type, service_date DESC);

-- Chemical additions
CREATE INDEX IF NOT EXISTS idx_chem_additions_service ON public.chemical_additions (service_id);

-- Equipment & logs
CREATE INDEX IF NOT EXISTS idx_equipment_property ON public.equipment (property_id);
CREATE INDEX IF NOT EXISTS idx_equip_logs_equip_date ON public.equipment_maintenance_logs (equipment_id, maintenance_date DESC);
CREATE INDEX IF NOT EXISTS idx_equip_logs_date ON public.equipment_maintenance_logs (maintenance_date DESC);

-- Jobs & pricing
CREATE INDEX IF NOT EXISTS idx_jobs_company_completed ON public.jobs (company_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_company_scheduled ON public.jobs (company_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_chem_prices_lookup ON public.company_chemical_prices (company_id, property_id, chemical_code, unit);
