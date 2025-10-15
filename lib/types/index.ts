// ============================================
// AQUIVIS TYPE DEFINITIONS
// ============================================
// Purpose: Centralized type definitions for the Aquivis application
// Priority: HIGH - Critical for type safety and developer experience
// Date: 2025-01-14

import { Database } from '../supabase/types'

// ============================================
// SUPABASE DATABASE TYPES
// ============================================

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// ============================================
// CORE ENTITY TYPES
// ============================================

export type Company = Tables<'companies'>
export type Profile = Tables<'profiles'>
export type Property = Tables<'properties'>
export type Unit = Tables<'units'>
export type Service = Tables<'services'>
export type Customer = Tables<'customers'>
export type Booking = Tables<'bookings'>
export type Equipment = Tables<'equipment'>
export type WaterTest = Tables<'water_tests'>
export type ChemicalAddition = Tables<'chemical_additions'>
export type EquipmentCheck = Tables<'equipment_checks'>

// ============================================
// OPTIMIZED VIEW TYPES
// ============================================

// Note: These views are not in the generated types yet, so we'll define them manually
export type DashboardStats = {
  company_id: string
  company_name: string
  property_count: number
  unit_count: number
  today_services: number
  week_services: number
  total_services: number
  water_quality_issues: number
  today_bookings: number
  recent_services: number
}

export type ServiceOptimized = Service & {
  property_name: string
  unit_name: string
  customer_name?: string
}

export type PropertyOptimized = Property & {
  unit_count: number
  service_count: number
}

export type UnitOptimized = Unit & {
  property_name: string
  service_count: number
  latest_service_date?: string
}

export type CustomerOptimized = Customer & {
  booking_count: number
  property_count: number
}

// ============================================
// ENUM TYPES
// ============================================

export type ServiceType = Enums<'service_type'>
export type UnitType = Enums<'unit_type'>
// Note: These enums may not exist in the generated types yet
export type EquipmentType = 'pump' | 'filter' | 'heater' | 'chlorinator' | 'light' | 'other'
export type EquipmentStatus = 'active' | 'maintenance_required' | 'out_of_order' | 'retired'
export type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed'
export type UserRole = Enums<'user_role'>

// ============================================
// EXTENDED TYPES WITH RELATIONSHIPS
// ============================================

export interface ServiceWithRelations extends Service {
  unit?: UnitWithRelations
  water_test?: WaterTest
  chemical_additions?: ChemicalAddition[]
  equipment_checks?: EquipmentCheck[]
}

export interface UnitWithRelations extends Unit {
  property?: Property
  services?: Service[]
  equipment?: Equipment[]
  latest_service?: Service
}

export interface PropertyWithRelations extends Property {
  units?: UnitWithRelations[]
  bookings?: Booking[]
  customers?: Customer[]
}

export interface CustomerWithRelations extends Customer {
  bookings?: Booking[]
  properties?: Property[]
}

// ============================================
// FORM DATA TYPES
// ============================================

export interface ServiceFormData {
  unit_id: string
  service_type: ServiceType
  service_date: string
  notes?: string
  water_test?: {
    ph: number
    total_alkalinity: number
    calcium_hardness: number
    free_chlorine: number
    total_chlorine: number
    cyanuric_acid: number
    temperature: number
    all_parameters_ok: boolean
    notes?: string
  }
  chemical_additions?: {
    chemical_type: string
    amount: number
    unit: string
    notes?: string
  }[]
  equipment_checks?: {
    equipment_id: string
    status: EquipmentStatus
    notes?: string
  }[]
}

export interface PropertyFormData {
  name: string
  address: string
  city: string
  state: string
  postcode: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  individual_units: boolean
}

export interface UnitFormData {
  name: string
  unit_type: UnitType
  property_id: string
  max_occupancy?: number
  notes?: string
}

export interface CustomerFormData {
  name: string
  email: string
  phone?: string
  address?: string
  notes?: string
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================
// PERFORMANCE & MONITORING TYPES
// ============================================

export interface PerformanceMetrics {
  pageLoad: number
  queryTime: number
  renderTime: number
  timestamp: number
}

export interface ErrorReport {
  message: string
  stack?: string
  component?: string
  userId?: string
  timestamp: number
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// ============================================
// DASHBOARD & ANALYTICS TYPES
// ============================================

export interface DashboardMetrics {
  property_count: number
  unit_count: number
  today_services: number
  week_services: number
  total_services: number
  water_quality_issues: number
  today_bookings: number
  recent_services: number
}

export interface ServiceAnalytics {
  totalServices: number
  completedServices: number
  pendingServices: number
  averageServiceTime: number
  complianceRate: number
  waterQualityTrends: {
    date: string
    complianceRate: number
  }[]
}

// ============================================
// COMPLIANCE & ALERT TYPES
// ============================================

export interface ComplianceAlert {
  id: string
  type: 'water_quality' | 'equipment_failure' | 'service_overdue' | 'booking_conflict'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  unit_id?: string
  property_id?: string
  service_id?: string
  created_at: string
  resolved: boolean
  resolved_at?: string
}

// ============================================
// SCHEDULING TYPES
// ============================================

export interface ScheduleRule {
  property_id: string
  unit_type?: UnitType
  frequency_days: number
  preferred_days: number[]
  preferred_time: string
  enabled: boolean
}

export interface ScheduledService {
  id: string
  unit_id: string
  scheduled_date: string
  service_type: ServiceType
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  assigned_to?: string
  notes?: string
}

// ============================================
// EXPORT ALL TYPES
// ============================================

// Re-export all types for convenience
export type {
  Database,
  Tables,
  Enums
}
