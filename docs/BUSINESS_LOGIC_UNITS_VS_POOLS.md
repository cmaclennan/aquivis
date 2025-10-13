# 🏊‍♂️ Business Logic: Units vs Pools/Spas

**Purpose:** Document the correct business logic for handling properties with shared facilities vs individual units.

---

## 📋 **Core Business Rules**

### **Every Property Has Shared Facilities**
- **All properties** have at least one shared pool/spa (main pool, kids pool, spa, etc.)
- These are **always shown** in the "Property Pools & Spas" section
- These are the primary facilities that everyone uses

### **Some Properties Have Individual Units**
- **Only some properties** have individual units (villas, condos, hotel rooms with private pools/spas)
- These are shown in the "Individual Units" section
- Only shown when `has_individual_units = true`

---

## 🏨 **Real-World Examples**

### **Ramada Resort** (`has_individual_units = false`)
- ✅ **Property Pools & Spas**: Main pool, spa (shared facilities)
- ❌ **Individual Units**: None (rooms have no pools/spas)
- **Service Focus**: Shared facilities only

### **Sea Temple** (`has_individual_units = true`)
- ✅ **Property Pools & Spas**: Main pool, kids pool, spa (shared facilities)
- ✅ **Individual Units**: Rooftop spas, plunge pools in rooms (private facilities)
- **Service Focus**: Both shared and individual facilities

---

## 🎯 **UI Display Logic**

```typescript
// ALWAYS show shared facilities (every property has these)
{hasSharedFacilities && (
  <div>Property Pools & Spas Section</div>
)}

// ONLY show individual units if property has them
{hasIndividualUnits && hasIndividualUnitsList && (
  <div>Individual Units Section</div>
)}
```

### **Display Rules:**
1. **Always show**: "Property Pools & Spas" section (shared facilities)
2. **Conditionally show**: "Individual Units" section (only when `has_individual_units = true`)
3. **Never hide**: Shared facilities (they always exist)

---

## 🗄️ **Database Schema**

### **Properties Table**
```sql
has_individual_units BOOLEAN DEFAULT false
```

### **Unit Types Classification**

**Shared Facilities** (always shown):
- `residential_pool` - Simple residential pool
- `main_pool` - Main resort pool
- `kids_pool` - Children's pool
- `main_spa` - Main spa

**Individual Units** (only when `has_individual_units = true`):
- `rooftop_spa` - Sea Temple rooftop spas (private)
- `plunge_pool` - Sea Temple/villa plunge pools (private)
- `villa_pool` - Villa pools (private)

---

## 🔧 **Implementation Details**

### **Property Detail Page Logic**
```typescript
// Separate shared facilities from individual units
const sharedFacilities = units.filter(u => 
  u.unit_type === 'residential_pool' || 
  u.unit_type === 'main_pool' || 
  u.unit_type === 'kids_pool' || 
  u.unit_type === 'main_spa'
)

const individualUnits = units.filter(u => 
  u.unit_type === 'rooftop_spa' || 
  u.unit_type === 'plunge_pool' || 
  u.unit_type === 'villa_pool'
)

// Display logic
const hasSharedFacilities = sharedFacilities.length > 0
const hasIndividualUnits = property.has_individual_units || false
const hasIndividualUnitsList = individualUnits.length > 0
```

### **Service Creation Flow**
- **Shared Facilities**: Service the main pools/spas
- **Individual Units**: Service private pools/spas in rooms/villas
- **Filtering**: Show appropriate units based on property type

---

## 📊 **Property Type Examples**

| Property Type | has_individual_units | Shared Facilities | Individual Units |
|---------------|---------------------|-------------------|------------------|
| **Resort** | `false` | ✅ Main pool, spa | ❌ None |
| **Commercial** | `false` | ✅ Main pool | ❌ None |
| **Residential** | `false` | ✅ Main pool | ❌ None |
| **Body Corporate** | `true` | ✅ Main pool, spa | ✅ Villa pools, spas |
| **Hotel** | `true` | ✅ Main pool, spa | ✅ Room spas, plunge pools |

---

## 🚨 **Common Misunderstandings**

### **❌ Wrong Understanding:**
- "Show either shared OR individual units"
- "has_individual_units = false means no pools"
- "Properties without individual units don't need service"

### **✅ Correct Understanding:**
- "Always show shared facilities"
- "Sometimes also show individual units"
- "Every property needs service (at minimum, shared facilities)"

---

## 🔄 **Migration Notes**

### **Existing Properties**
```sql
-- Set safe defaults based on property type
UPDATE properties
SET has_individual_units = true
WHERE property_type = 'body_corporate';

UPDATE properties
SET has_individual_units = false
WHERE property_type IN ('resort', 'commercial', 'residential');
```

### **New Properties**
- **Resort/Commercial/Residential**: `has_individual_units = false` (shared facilities only)
- **Body Corporate**: `has_individual_units = true` (shared + individual units)

---

## 📝 **Implementation Checklist**

- [x] Property detail page shows shared facilities always
- [x] Property detail page shows individual units only when `has_individual_units = true`
- [x] Service creation flow filters units appropriately
- [x] Database schema supports the logic
- [x] Documentation explains the business rules clearly

---

**Last Updated:** 2025-01-10  
**Maintained by:** Craig + AI Assistant  
**Status:** ✅ Implemented and Documented
