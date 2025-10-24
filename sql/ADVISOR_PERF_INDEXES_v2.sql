-- Version: v2
-- Date: 2025-10-24
-- Purpose: Add schedule-related indexes (bookings, custom_schedules, property_scheduling_rules, plant_rooms)
-- and consolidate/report indexes for services, equipment logs, chemicals, jobs, prices, customers.
-- Safe to run repeatedly (IF NOT EXISTS)

-- Services (filters: service_date, service_type, status; joins via unit_id)
CREATE INDEX IF NOT EXISTS idx_services_service_date ON public.services (service_date);
CREATE INDEX IF NOT EXISTS idx_services_unit_id ON public.services (unit_id);
CREATE INDEX IF NOT EXISTS idx_services_service_type ON public.services (service_type);
CREATE INDEX IF NOT EXISTS idx_services_status ON public.services (status);

-- Units (joins/filters: property_id, unit_type)
CREATE INDEX IF NOT EXISTS idx_units_property_id ON public.units (property_id);
CREATE INDEX IF NOT EXISTS idx_units_unit_type ON public.units (unit_type);

-- Properties (company scoping)
CREATE INDEX IF NOT EXISTS idx_properties_company_id ON public.properties (company_id);

-- Equipment maintenance logs (filters: maintenance_date; join via equipment_id)
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_date ON public.equipment_maintenance_logs (maintenance_date);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_logs_equipment_id ON public.equipment_maintenance_logs (equipment_id);

-- Equipment (joins: property_id)
CREATE INDEX IF NOT EXISTS idx_equipment_property_id ON public.equipment (property_id);

-- Chemical additions (join via service_id)
CREATE INDEX IF NOT EXISTS idx_chemical_additions_service_id ON public.chemical_additions (service_id);

-- Jobs (billing report: by company and completed/scheduled date)
CREATE INDEX IF NOT EXISTS idx_jobs_company_completed_at ON public.jobs (company_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_jobs_company_scheduled_at ON public.jobs (company_id, scheduled_at);

-- Company chemical prices (lookup by company, property override, code+unit)
CREATE INDEX IF NOT EXISTS idx_company_chemical_prices_company_property_code_unit 
  ON public.company_chemical_prices (company_id, property_id, chemical_code, unit);

-- Customers (lookups by company)
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON public.customers (company_id);

-- Bookings (schedule/occupancy windows)
CREATE INDEX IF NOT EXISTS idx_bookings_unit_id ON public.bookings (unit_id);
CREATE INDEX IF NOT EXISTS idx_bookings_checkin ON public.bookings (check_in_date);
CREATE INDEX IF NOT EXISTS idx_bookings_checkout ON public.bookings (check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_unit_checkin_checkout
  ON public.bookings (unit_id, check_in_date, check_out_date);

-- Custom schedules (active schedule retrieval)
CREATE INDEX IF NOT EXISTS idx_custom_schedules_unit_active
  ON public.custom_schedules (unit_id, is_active);

-- Property scheduling rules (active rules by property)
CREATE INDEX IF NOT EXISTS idx_property_rules_property_active
  ON public.property_scheduling_rules (property_id, is_active);

-- Plant rooms (active plant-rooms by property)
CREATE INDEX IF NOT EXISTS idx_plant_rooms_property_active
  ON public.plant_rooms (property_id, is_active);
