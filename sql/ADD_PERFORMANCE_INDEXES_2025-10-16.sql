-- Performance Indexes for Aquivis (safe to re-run)
-- Date: 2025-10-16

-- Properties / Customers scoping
CREATE INDEX IF NOT EXISTS idx_properties_company ON public.properties(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_company  ON public.customers(company_id);

-- Units relationships
CREATE INDEX IF NOT EXISTS idx_units_property ON public.units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_customer ON public.units(customer_id);

-- Services filters
CREATE INDEX IF NOT EXISTS idx_services_property_date ON public.services(property_id, service_date DESC);
CREATE INDEX IF NOT EXISTS idx_services_unit          ON public.services(unit_id);

-- Bookings occupancy/date filters
CREATE INDEX IF NOT EXISTS idx_bookings_unit_dates ON public.bookings(unit_id, check_in_date, check_out_date);

-- Profiles scoping
CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company_id);

ANALYZE;

-- Verification (run to confirm index presence)
-- NOTE: Run these selects after executing the above statements.
-- They will list the indexes if present.
SELECT indexname FROM pg_indexes WHERE schemaname='public' AND indexname IN (
  'idx_properties_company',
  'idx_customers_company',
  'idx_units_property',
  'idx_units_customer',
  'idx_services_property_date',
  'idx_services_unit',
  'idx_bookings_unit_dates',
  'idx_profiles_company'
)
ORDER BY indexname;


