# 📋 Database ENUM Reference

**Purpose:** Quick reference for all ENUM values when creating forms  
**Source:** `DATABASE_SCHEMA_COMPLETE.sql`  
**Rule:** Always reference this file when creating dropdown/select fields

---

## 🚨 IMPORTANT RULE

**When creating ANY form with dropdown/select fields that map to database ENUMs:**

1. ✅ **Check this file first**
2. ✅ **Use EXACT enum values** (case-sensitive)
3. ✅ **Update TypeScript types** to match
4. ❌ **NEVER guess** enum values
5. ❌ **NEVER use different naming** (e.g., 'pool' when database has 'residential_pool')

**This prevents:** `ERROR: invalid input value for enum`

---

## 📊 Business & User Types

### `business_type`
Used in: `companies` table
```typescript
type BusinessType = 'residential' | 'commercial' | 'both'
```
**Form Options:**
- `residential` - "Residential"
- `commercial` - "Commercial"
- `both` - "Both Residential & Commercial"

### `user_role`
Used in: `profiles` table
```typescript
type UserRole = 'owner' | 'technician'
```
**Form Options:**
- `owner` - "Owner"
- `technician` - "Technician"

---

## 🏢 Property & Unit Types

### `property_type`
Used in: `properties` table
```typescript
type PropertyType = 'residential' | 'commercial' | 'resort' | 'body_corporate'
```
**Form Options:**
- `residential` - "Residential"
- `commercial` - "Commercial"
- `resort` - "Resort"
- `body_corporate` - "Body Corporate / Strata"

### `unit_type`
Used in: `units` table
```typescript
type UnitType = 
  | 'residential_pool'  // Simple residential pool
  | 'main_pool'         // Resort main pool
  | 'kids_pool'         // Resort kids pool
  | 'main_spa'          // Resort main spa
  | 'rooftop_spa'       // Sea Temple rooftop spas
  | 'plunge_pool'       // Sea Temple/villa plunge pools
  | 'villa_pool'        // Villa pools
```
**Form Options:**
- `residential_pool` - "Residential Pool"
- `main_pool` - "Main Pool (Resort)"
- `kids_pool` - "Kids Pool (Resort)"
- `main_spa` - "Main Spa (Resort)"
- `rooftop_spa` - "Rooftop Spa"
- `plunge_pool` - "Plunge Pool (Villa)"
- `villa_pool` - "Villa Pool"

### `water_type`
Used in: `units` table
```typescript
type WaterType = 'saltwater' | 'freshwater' | 'bromine'
```
**Form Options:**
- `saltwater` - "Saltwater (Chlorinated)"
- `freshwater` - "Freshwater (Chlorinated)"
- `bromine` - "Bromine"

### `service_frequency`
Used in: `units` table
```typescript
type ServiceFrequency = 
  | 'daily_when_occupied'  // Sea Temple units (based on bookings)
  | 'daily'
  | 'twice_weekly'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'custom'
```
**Form Options:**
- `daily_when_occupied` - "Daily (When Occupied)"
- `daily` - "Daily"
- `twice_weekly` - "Twice Weekly"
- `weekly` - "Weekly"
- `biweekly` - "Bi-weekly"
- `monthly` - "Monthly"
- `custom` - "Custom Schedule"

### `billing_entity`
Used in: `units` table
```typescript
type BillingEntity = 
  | 'property'        // Bill to property owner
  | 'unit_owner'      // Bill to individual unit owner
  | 'hotel'           // Bill to hotel/letting pool
  | 'body_corporate'  // Bill to body corporate
```
**Form Options:**
- `property` - "Property Owner"
- `unit_owner` - "Individual Unit Owner"
- `hotel` - "Hotel / Letting Pool"
- `body_corporate` - "Body Corporate"

---

## 🧪 Service Types

### `service_type`
Used in: `services` table
```typescript
type ServiceType = 
  | 'test_only'           // Water test only
  | 'full_service'        // Test + chemicals + cleaning
  | 'equipment_check'     // Equipment status check
  | 'plant_room_check'    // Plant room monitoring
```
**Form Options:**
- `test_only` - "Test Only"
- `full_service` - "Full Service (Test + Chemicals + Cleaning)"
- `equipment_check` - "Equipment Check"
- `plant_room_check` - "Plant Room Check"

### `service_status`
Used in: `services` table
```typescript
type ServiceStatus = 'scheduled' | 'in_progress' | 'completed' | 'skipped'
```
**Form Options:**
- `scheduled` - "Scheduled"
- `in_progress` - "In Progress"
- `completed` - "Completed"
- `skipped` - "Skipped"

---

## 👥 Customer Types

### `customer_type`
Used in: `customers` table
```typescript
type CustomerType = 
  | 'property_owner'
  | 'body_corporate'
  | 'hotel'
  | 'property_manager'
  | 'b2b_wholesale'
```
**Form Options:**
- `property_owner` - "Property Owner"
- `body_corporate` - "Body Corporate"
- `hotel` - "Hotel"
- `property_manager` - "Property Manager"
- `b2b_wholesale` - "B2B Wholesale"

---

## 🏥 Compliance Types

### `risk_category`
Used in: `compliance_requirements` table
```typescript
type RiskCategory = 'low' | 'medium' | 'high'
```
**Form Options:**
- `low` - "Low Risk"
- `medium` - "Medium Risk"
- `high` - "High Risk"

---

## 📝 Usage Example

### ❌ Wrong Way:
```tsx
// DON'T DO THIS!
<select>
  <option value="hotel">Hotel</option>
  <option value="commercial_pool">Commercial Pool</option>
</select>
```

### ✅ Correct Way:
```tsx
// 1. Reference this file for exact enum values
// 2. Define TypeScript type
type PropertyType = 'residential' | 'commercial' | 'resort' | 'body_corporate'

// 3. Use in form
<select value={propertyType} onChange={(e) => setPropertyType(e.target.value as PropertyType)}>
  <option value="residential">Residential</option>
  <option value="commercial">Commercial</option>
  <option value="resort">Resort</option>
  <option value="body_corporate">Body Corporate / Strata</option>
</select>
```

---

## 🔄 Keeping This Updated

**When modifying database ENUMs:**

1. Update `DATABASE_SCHEMA_COMPLETE.sql`
2. Update this reference file
3. Find and update all forms using that enum
4. Test all affected forms

**Files to check:**
- Property forms: `app/(dashboard)/properties/`
- Unit forms: `app/(dashboard)/properties/[id]/units/`
- Service forms: `app/(dashboard)/services/` (future)
- Customer forms: `app/(dashboard)/customers/` (future)

---

## 📌 Quick Checklist

Before committing any form:
- [ ] Checked this reference file
- [ ] TypeScript type matches exactly
- [ ] All enum values are correct (case-sensitive)
- [ ] Tested form submission
- [ ] No enum errors in console

---

**Last Updated:** 2025-10-01  
**Source:** `DATABASE_SCHEMA_COMPLETE.sql` lines 18-68

