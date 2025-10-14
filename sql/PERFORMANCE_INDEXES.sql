-- Performance Optimization Indexes
-- These indexes will significantly improve query performance for frequently accessed data

-- Properties table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_company_id 
ON properties(company_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_created_at 
ON properties(created_at);

-- Units table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_units_property_id 
ON units(property_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_units_company_id 
ON units(property_id) 
WHERE property_id IN (SELECT id FROM properties);

-- Services table indexes (most critical for dashboard performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_created_at 
ON services(created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_unit_id 
ON services(unit_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_technician_id 
ON services(technician_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_status 
ON services(status);

-- Composite index for dashboard queries (company_id + created_at)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_company_created 
ON services(unit_id, created_at) 
WHERE unit_id IN (
  SELECT u.id FROM units u 
  JOIN properties p ON u.property_id = p.id
);

-- Bookings table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_check_in_date 
ON bookings(check_in_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_unit_id 
ON bookings(unit_id);

-- Water tests indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_water_tests_service_id 
ON water_tests(service_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_water_tests_all_parameters_ok 
ON water_tests(all_parameters_ok);

-- Profiles table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_company_id 
ON profiles(company_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role 
ON profiles(role);

-- Customers table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_company_id 
ON customers(company_id);

-- Equipment logs indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_logs_unit_id 
ON equipment_logs(unit_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_logs_created_at 
ON equipment_logs(created_at);

-- Analyze tables after creating indexes for optimal query planning
ANALYZE properties;
ANALYZE units;
ANALYZE services;
ANALYZE bookings;
ANALYZE water_tests;
ANALYZE profiles;
ANALYZE customers;
ANALYZE equipment_logs;
