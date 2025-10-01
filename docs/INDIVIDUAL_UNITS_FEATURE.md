# Individual Units Feature Implementation

## Overview
Added support for distinguishing between properties with **shared facilities** vs. **individual units** to provide clearer organization and labeling.

## Use Cases Solved

### Scenario 1: Sheraton Grand Mirage
- **Type:** Resort with only shared facilities
- **Setup:** `has_individual_units = FALSE`
- **Display:** "Property Pools & Spas" (9 shared facilities shown together)
- **Billing:** All managed by property/hotel

### Scenario 2: Sea Temple Port Douglas
- **Type:** Body corporate with mixed facilities
- **Setup:** `has_individual_units = TRUE`
- **Display:** Separate "Pools" and "Spas" sections
  - 3 shared body corporate pools
  - 90 individual unit pools (private plunge pools per villa)
- **Billing:** Each unit can be assigned to different customers

### Scenario 3: Ramada Hotel
- **Type:** Commercial with single shared pool
- **Setup:** `has_individual_units = FALSE`
- **Display:** "Property Pools & Spas" (1 shared facility)
- **Billing:** Managed by property

## Database Changes

### New Column: `has_individual_units`
```sql
ALTER TABLE properties
ADD COLUMN has_individual_units BOOLEAN DEFAULT false;
```

**Purpose:** Flag to control how units are displayed and organized on the property detail page.

**Defaults:**
- `false` for most properties (shared facilities only)
- `true` for body corporate/strata (typically have individual units)

## UI Changes

### 1. Property Forms (New & Edit)
Added checkbox with clear explanation:
```
☐ Property has individual units
  Check this if the property has privately owned units 
  (e.g., condos, villas, hotel rooms) with their own pools/spas.
  Leave unchecked for properties with only shared facilities.
```

### 2. Property Detail Page
**Conditional Rendering:**

#### When `has_individual_units = FALSE` (Shared Facilities)
- Shows **one section**: "Property Pools & Spas"
- All pools and spas displayed together
- Button: "Add Pool/Spa"
- Clear indication these are shared facilities

#### When `has_individual_units = TRUE` (Individual Units)
- Shows **two sections**: "Pools" and "Spas"
- Pools and spas separated for clarity
- Buttons: "Add Pool" and "Add Spa"
- Supports customer assignment and individual billing

## Benefits

1. **Clearer Labeling:** "Property Pools & Spas" makes it obvious these are shared facilities
2. **Flexible Structure:** Single flag supports various property configurations
3. **Customer Integration:** Individual units can be assigned to customers for billing/ownership
4. **Scalability:** Works for properties of any size (1 pool to 90+ units)
5. **Backward Compatible:** Existing properties default to `false` (shared facilities)

## Migration Instructions

**See:** `sql/APPLY_THIS_MIGRATION.md`

1. Run SQL in Supabase SQL Editor
2. Test by creating new properties with/without individual units
3. Edit existing properties to update flag if needed

## Files Modified

1. `sql/MIGRATION_ADD_INDIVIDUAL_UNITS_FLAG.sql` - Database migration
2. `app/(dashboard)/properties/new/page.tsx` - Add checkbox to create form
3. `app/(dashboard)/properties/[id]/edit/page.tsx` - Add checkbox to edit form
4. `app/(dashboard)/properties/[id]/page.tsx` - Conditional rendering logic

## Testing Checklist

- [ ] Apply SQL migration successfully
- [ ] Create property with `has_individual_units = FALSE`
  - [ ] Verify "Property Pools & Spas" section appears
  - [ ] Add multiple pools and spas
  - [ ] Verify all appear in single section
- [ ] Create property with `has_individual_units = TRUE`
  - [ ] Verify separate "Pools" and "Spas" sections
  - [ ] Add pools and spas
  - [ ] Verify proper separation
- [ ] Edit existing property to toggle flag
  - [ ] Verify display updates accordingly
- [ ] Test customer assignment to units
  - [ ] Verify owner displays on unit cards

## Next Steps

1. Apply database migration (see `sql/APPLY_THIS_MIGRATION.md`)
2. Test in development environment
3. Update existing properties if needed
4. Consider adding auto-detection logic based on property type (optional)

---

**Implementation Date:** October 1, 2025  
**Status:** Ready for testing

