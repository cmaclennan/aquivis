import { z } from 'zod'

// ============================================
// COMMON VALIDATION PATTERNS
// ============================================

// Email validation
const emailSchema = z.string()
  .email('Invalid email format')
  .max(255, 'Email too long')
  .optional()
  .or(z.literal(''))

// Phone validation (international format)
const phoneSchema = z.string()
  .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone format')
  .optional()
  .or(z.literal(''))

// Name validation (alphanumeric, spaces, hyphens, periods)
const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name too long')
  .regex(/^[a-zA-Z0-9\s\-\.]+$/, 'Name contains invalid characters')

// Address validation
const addressSchema = z.string()
  .max(200, 'Address too long')
  .optional()
  .or(z.literal(''))

// City/State validation
const cityStateSchema = z.string()
  .max(50, 'Too long')
  .optional()
  .or(z.literal(''))

// Postal code validation
const postalCodeSchema = z.string()
  .max(10, 'Postal code too long')
  .optional()
  .or(z.literal(''))

// Notes validation
const notesSchema = z.string()
  .max(1000, 'Notes too long')
  .optional()
  .or(z.literal(''))

// ============================================
// CUSTOMER VALIDATION SCHEMAS
// ============================================

export const customerSchema = z.object({
  name: nameSchema,
  customer_type: z.enum(['property_owner', 'body_corporate', 'hotel', 'property_manager', 'b2b_wholesale'], {
    errorMap: () => ({ message: 'Invalid customer type' })
  }),
  email: emailSchema,
  phone: phoneSchema,
  address: addressSchema,
  city: cityStateSchema,
  state: cityStateSchema,
  postal_code: postalCodeSchema,
  billing_email: emailSchema,
  payment_terms: z.string()
    .max(50, 'Payment terms too long')
    .optional()
    .or(z.literal('')),
  notes: notesSchema,
})

export const customerUpdateSchema = customerSchema.partial().extend({
  id: z.string().uuid('Invalid customer ID'),
})

// ============================================
// COMPANY VALIDATION SCHEMA
// ============================================

export const companyUpdateSchema = z.object({
  id: z.string().min(1, 'Company ID is required'),
  name: z.string().max(100, 'Name too long').optional().or(z.literal('')).nullable(),
  business_type: z.string().max(50, 'Business type too long').optional().or(z.literal('')).nullable(),
  email: emailSchema.nullable(),
  phone: phoneSchema.nullable(),
  address: addressSchema.nullable(),
  city: cityStateSchema.nullable(),
  state: cityStateSchema.nullable(),
  postal_code: postalCodeSchema.nullable(),
})

// ============================================
// PROPERTY VALIDATION SCHEMAS
// ============================================

export const propertySchema = z.object({
  name: nameSchema,
  property_type: z.enum(['residential', 'commercial', 'resort', 'body_corporate'], {
    errorMap: () => ({ message: 'Invalid property type' })
  }),
  address: z.string()
    .min(1, 'Address is required')
    .max(200, 'Address too long'),
  city: z.string()
    .min(1, 'City is required')
    .max(50, 'City too long'),
  state: z.string()
    .min(1, 'State is required')
    .max(50, 'State too long'),
  postal_code: z.string()
    .min(1, 'Postal code is required')
    .max(10, 'Postal code too long'),
  contact_name: z.string()
    .max(100, 'Contact name too long')
    .optional()
    .or(z.literal('')),
  contact_email: emailSchema,
  contact_phone: phoneSchema,
  total_volume_litres: z.number()
    .min(0, 'Volume must be positive')
    .max(100000000, 'Volume too large'),
  billing_type: z.enum(['property', 'unit_owner', 'hotel', 'body_corporate'], {
    errorMap: () => ({ message: 'Invalid billing type' })
  }),
  risk_category: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Invalid risk category' })
  }),
  timezone: z.string()
    .max(50, 'Timezone too long')
    .optional()
    .or(z.literal('')),
  is_active: z.boolean(),
  notes: notesSchema,
})

export const propertyUpdateSchema = propertySchema.partial().extend({
  id: z.string().uuid('Invalid property ID'),
})

// ============================================
// UNIT VALIDATION SCHEMAS
// ============================================

export const unitSchema = z.object({
  unit_number: z.string()
    .min(1, 'Unit number is required')
    .max(50, 'Unit number too long'),
  name: z.string()
    .min(1, 'Unit name is required')
    .max(100, 'Unit name too long'),
  unit_type: z.enum([
    'residential_pool', 'main_pool', 'kids_pool', 'main_spa',
    'rooftop_spa', 'plunge_pool', 'villa_pool'
  ], {
    errorMap: () => ({ message: 'Invalid unit type' })
  }),
  water_type: z.enum(['saltwater', 'freshwater', 'bromine'], {
    errorMap: () => ({ message: 'Invalid water type' })
  }),
  volume_litres: z.number()
    .min(1, 'Volume must be at least 1 litre')
    .max(1000000, 'Volume too large'),
  depth_meters: z.number()
    .min(0.1, 'Depth must be at least 0.1m')
    .max(10, 'Depth too large')
    .optional(),
  service_frequency: z.enum([
    'daily', 'daily_when_occupied', 'weekly', 'bi_weekly', 'monthly'
  ], {
    errorMap: () => ({ message: 'Invalid service frequency' })
  }),
  last_service_warning_days: z.number()
    .min(1, 'Warning days must be at least 1')
    .max(30, 'Warning days too many')
    .optional(),
  billing_entity: z.enum(['property', 'unit_owner', 'hotel', 'body_corporate'], {
    errorMap: () => ({ message: 'Invalid billing entity' })
  }),
  customer_id: z.string().uuid('Invalid customer ID').optional(),
  risk_category: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Invalid risk category' })
  }),
  is_active: z.boolean(),
  notes: notesSchema,
})

export const unitUpdateSchema = unitSchema.partial().extend({
  id: z.string().uuid('Invalid unit ID'),
})

// ============================================
// SERVICE VALIDATION SCHEMAS
// ============================================

export const serviceSchema = z.object({
  service_type: z.enum(['routine', 'maintenance', 'repair', 'emergency'], {
    errorMap: () => ({ message: 'Invalid service type' })
  }),
  service_date: z.string()
    .datetime('Invalid date format'),
  technician_id: z.string().uuid('Invalid technician ID').optional(),
  notes: notesSchema,
})

export const waterTestSchema = z.object({
  ph: z.number()
    .min(0, 'pH must be positive')
    .max(14, 'pH cannot exceed 14')
    .optional(),
  chlorine: z.number()
    .min(0, 'Chlorine must be positive')
    .max(20, 'Chlorine level too high')
    .optional(),
  bromine: z.number()
    .min(0, 'Bromine must be positive')
    .max(20, 'Bromine level too high')
    .optional(),
  salt: z.number()
    .min(0, 'Salt must be positive')
    .max(50000, 'Salt level too high')
    .optional(),
  alkalinity: z.number()
    .min(0, 'Alkalinity must be positive')
    .max(500, 'Alkalinity too high')
    .optional(),
  calcium: z.number()
    .min(0, 'Calcium must be positive')
    .max(1000, 'Calcium too high')
    .optional(),
  cyanuric: z.number()
    .min(0, 'Cyanuric acid must be positive')
    .max(200, 'Cyanuric acid too high')
    .optional(),
})

export const chemicalAdditionSchema = z.object({
  chemical: z.string()
    .min(1, 'Chemical name is required')
    .max(100, 'Chemical name too long'),
  amount: z.number()
    .min(0.1, 'Amount must be at least 0.1')
    .max(10000, 'Amount too large'),
  unit: z.enum(['grams', 'ml', 'litres', 'kg', 'cups', 'scoops', 'ounces', 'pounds', 'fluid_ounces', 'pints', 'quarts', 'gallons', 'tablets', 'capsules', 'bags', 'bottles'], {
    errorMap: () => ({ message: 'Invalid unit' })
  }),
})

export const serviceWithWaterTestSchema = serviceSchema.extend({
  water_test_data: waterTestSchema.optional(),
  chemical_additions: z.array(chemicalAdditionSchema).optional(),
})

// ============================================
// API VALIDATION SCHEMAS
// ============================================

export const inviteSchema = z.object({
  to: z.string().email('Invalid email address'),
  inviteLink: z.string().url('Invalid invite link'),
  role: z.enum(['technician', 'manager']).optional(),
  firstName: z.string().max(50, 'First name too long').optional(),
  lastName: z.string().max(50, 'Last name too long').optional(),
})

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Safe parse with custom error handling
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: z.ZodError
} {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, errors: result.error }
  }
}

// Format validation errors for display
export function formatValidationErrors(error: z.ZodError): string[] {
  return error.errors.map(err => {
    const path = err.path.length > 0 ? `${err.path.join('.')}: ` : ''
    return `${path}${err.message}`
  })
}

// Type exports for use in components
export type CustomerFormData = z.infer<typeof customerSchema>
export type PropertyFormData = z.infer<typeof propertySchema>
export type UnitFormData = z.infer<typeof unitSchema>
export type ServiceFormData = z.infer<typeof serviceSchema>
export type WaterTestData = z.infer<typeof waterTestSchema>
export type ChemicalAdditionData = z.infer<typeof chemicalAdditionSchema>
export type InviteData = z.infer<typeof inviteSchema>
