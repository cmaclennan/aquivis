-- Composite indexes to speed up ordered lookups and common report filters
-- Do not modify previous migrations; add new versioned file per policy.

-- Lookups (company-scoped ordering by name)
CREATE INDEX IF NOT EXISTS idx_properties_company_name ON public.properties (company_id, name);
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON public.customers (company_id, name);

-- Templates (company-scoped ordering by template_name)
CREATE INDEX IF NOT EXISTS idx_schedule_templates_company_name ON public.schedule_templates (company_id, template_name);

-- Units list (filter by property -> order by name)
CREATE INDEX IF NOT EXISTS idx_units_property_name ON public.units (property_id, name);
