# 📋 Aquivis - Complete Setup & Build Plan (Updated)

**Purpose:** Comprehensive blueprint for building Aquivis from scratch with visual mockups, database schema, and implementation roadmap.

**Last Updated:** 2025-01-10 - Incorporated navigation decisions, plant room builder, role-based access

---

## 📊 Table of Contents

1. [Project Structure](#project-structure)
2. [Database Schema](#database-schema)
3. [Visual Mockups](#visual-mockups)
4. [Feature Breakdown](#feature-breakdown)
5. [Implementation Timeline](#implementation-timeline)
6. [Dependencies](#dependencies)
7. [Environment Setup](#environment-setup)

---

## 🏗️ Project Structure

```
aquivis/
├── public/
│   ├── logo.svg
│   ├── favicon.ico
│   └── manifest.json          # PWA manifest
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes group
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   │   ├── layout.tsx     # Shared dashboard layout
│   │   │   ├── page.tsx       # Main dashboard
│   │   │   ├── properties/
│   │   │   ├── service/       # Service forms
│   │   │   ├── reports/       # Admin only
│   │   │   ├── billing/       # Admin only
│   │   │   ├── team/          # Admin only
│   │   │   └── settings/
│   │   ├── (customer)/        # Customer portal routes
│   │   │   └── portal/
│   │   ├── api/               # API routes
│   │   │   ├── auth/
│   │   │   ├── services/
│   │   │   └── reports/
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   │
│   ├── components/
│   │   ├── ui/                # Shadcn components
│   │   ├── forms/             # Form components
│   │   │   ├── PoolServiceForm.tsx
│   │   │   ├── SpaServiceForm.tsx  # Simple single-page
│   │   │   └── PlantRoomCheckForm.tsx
│   │   ├── layouts/           # Layout components
│   │   ├── features/          # Feature-specific components
│   │   └── admin/             # Admin-only components
│   │
│   ├── lib/
│   │   ├── supabase/          # Supabase client & utilities
│   │   ├── rbac.ts            # Role-based access control
│   │   ├── utils.ts           # Helper functions
│   │   ├── constants.ts       # App constants
│   │   └── validations.ts     # Form validations
│   │
│   ├── types/
│   │   ├── database.ts        # Generated from Supabase
│   │   └── app.ts             # App-specific types
│   │
│   └── styles/
│       └── globals.css        # Global styles (Tailwind)
│
├── supabase/
│   └── migrations/            # Database migrations
│
├── .env.local                 # Environment variables (not committed)
├── .env.local.example         # Template
├── next.config.js             # Next.js config (minimal)
├── tailwind.config.ts         # Tailwind + brand colors
├── tsconfig.json              # TypeScript config
└── package.json               # Dependencies
```

---

## 🗄️ Database Schema (Updated)

### Core Tables Design

```sql
-- ============================================
-- MULTI-TENANCY & USERS
-- ============================================

CREATE TYPE business_type AS ENUM ('residential', 'commercial', 'both');
CREATE TYPE user_role AS ENUM ('owner', 'technician');

-- Companies (tenant isolation)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  business_type business_type NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  subscription_tier TEXT DEFAULT 'starter',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (links to Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role user_role DEFAULT 'technician',
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROPERTIES & UNITS
-- ============================================

CREATE TYPE property_type AS ENUM ('residential', 'commercial', 'resort', 'body_corporate');
CREATE TYPE unit_type AS ENUM (
  'residential_pool', 'main_pool', 'kids_pool', 'main_spa',
  'rooftop_spa', 'plunge_pool', 'villa_pool'
);
CREATE TYPE water_type AS ENUM ('saltwater', 'freshwater', 'bromine');
CREATE TYPE service_frequency AS ENUM (
  'daily_when_occupied', 'daily', 'twice_weekly', 
  'weekly', 'biweekly', 'monthly', 'custom'
);
CREATE TYPE billing_entity AS ENUM ('property', 'unit_owner', 'hotel', 'body_corporate');

-- Properties (Sheraton, Sea Temple, residential homes)
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  property_type property_type NOT NULL,
  address TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  billing_type TEXT DEFAULT 'per_service',
  total_volume_gallons INTEGER, -- For large resorts (e.g., 25 million litres)
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plant Rooms (NEW - for commercial/resort properties)
CREATE TABLE plant_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Saltwater Plant", "Freshwater Plant"
  
  -- Flexible check frequency
  check_frequency TEXT DEFAULT 'daily', -- 'daily', '2x_daily', '3x_daily', 'every_other_day', 'weekly', 'custom'
  check_times TEXT[] DEFAULT '{"07:00", "15:00"}', -- Array of time strings for custom schedules
  check_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}', -- 0=Sunday to 6=Saturday, empty array = all days
  
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Units (pools, spas, villas)
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  unit_number TEXT, -- e.g., "203", "Villa 105"
  name TEXT NOT NULL,
  unit_type unit_type NOT NULL,
  water_type water_type DEFAULT 'saltwater',
  volume_gallons INTEGER,
  service_frequency service_frequency DEFAULT 'weekly',
  billing_entity billing_entity DEFAULT 'property',
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL, -- For individual unit billing
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment (pumps, filters, chlorinators)
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_room_id UUID REFERENCES plant_rooms(id) ON DELETE CASCADE, -- For plant rooms
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE, -- For individual units/residential
  equipment_type TEXT NOT NULL, -- 'pump', 'filter', 'chlorinator', 'balance_tank', 'other'
  measurement_type TEXT, -- 'rpm', 'hz', 'litres', 'percent', 'psi', etc.
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  install_date DATE,
  warranty_expiry DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (plant_room_id IS NOT NULL OR unit_id IS NOT NULL) -- Must belong to one
);

-- ============================================
-- SCHEDULING & BOOKINGS
-- ============================================

-- Bookings (for Sea Temple occupancy-based scheduling)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  booking_source TEXT DEFAULT 'hotel', -- 'hotel', 'owner', 'property_manager'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SERVICES & WATER TESTING
-- ============================================

CREATE TYPE service_type AS ENUM ('test_only', 'full_service', 'equipment_check', 'plant_room_check');
CREATE TYPE service_status AS ENUM ('scheduled', 'in_progress', 'completed', 'skipped');

-- Service records
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  plant_room_id UUID REFERENCES plant_rooms(id) ON DELETE CASCADE, -- For plant room checks
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  service_date TIMESTAMPTZ DEFAULT NOW(),
  service_type service_type DEFAULT 'full_service',
  status service_status DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CHECK (unit_id IS NOT NULL OR plant_room_id IS NOT NULL) -- Must be for unit or plant room
);

-- Water test results
CREATE TABLE water_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  test_time TIMESTAMPTZ DEFAULT NOW(),
  
  -- Pool tests (saltwater/freshwater)
  ph DECIMAL(3,1),
  chlorine DECIMAL(4,1),
  salt INTEGER,
  alkalinity INTEGER,
  calcium INTEGER,
  cyanuric INTEGER,
  
  -- Spa tests (bromine)
  bromine DECIMAL(4,1),
  is_pump_running BOOLEAN,
  is_water_warm BOOLEAN,
  is_filter_cleaned BOOLEAN,
  
  all_parameters_ok BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chemical additions
CREATE TABLE chemical_additions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  chemical_type TEXT NOT NULL, -- 'chlorine', 'acid', 'buffer', 'salt', 'bromine_tablet', etc.
  quantity DECIMAL(6,2) NOT NULL,
  unit_of_measure TEXT DEFAULT 'cups', -- 'cups', 'tbsp', 'kg', 'L', 'tablets'
  cost DECIMAL(8,2) DEFAULT 0, -- For billing
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment checks (for plant rooms)
CREATE TABLE equipment_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  inlet_pressure INTEGER, -- For filters
  outlet_pressure INTEGER, -- For filters
  setpoint DECIMAL(8,2), -- For pumps/chlorinators (RPM, Hz, %)
  balance_tank_level DECIMAL(10,2), -- Numerical value (litres or %)
  status TEXT DEFAULT 'normal', -- 'normal', 'warning', 'fault'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance tasks
CREATE TABLE maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL, -- 'netting', 'vacuuming', 'skimmer_clean', 'filter_clean', 'brush_walls'
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service photos
CREATE TABLE service_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL, -- Supabase Storage URL
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CUSTOMERS & BILLING
-- ============================================

CREATE TYPE customer_type AS ENUM (
  'property_owner', 'body_corporate', 'hotel', 
  'property_manager', 'b2b_wholesale'
);

-- Customers (who get billed)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  customer_type customer_type NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  billing_email TEXT,
  payment_terms TEXT DEFAULT 'Net 30',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer portal access
CREATE TABLE customer_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  access_code TEXT NOT NULL UNIQUE, -- Simple 4-6 digit code
  can_add_bookings BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billing reports (generated)
CREATE TABLE billing_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_services INTEGER DEFAULT 0,
  total_tests INTEGER DEFAULT 0,
  total_chemicals_cost DECIMAL(10,2) DEFAULT 0,
  report_data JSONB, -- Flexible structure for different report types
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES profiles(id) -- Admin who generated it
);

-- ============================================
-- TIME TRACKING
-- ============================================

-- Simple time entries
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  total_hours DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- B2B WHOLESALE (Simple tracking)
-- ============================================

-- Wholesale pickups
CREATE TABLE wholesale_pickups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  pickup_date TIMESTAMPTZ DEFAULT NOW(),
  chemical_type TEXT NOT NULL,
  quantity DECIMAL(8,2) NOT NULL,
  unit_of_measure TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_profiles_company_id ON profiles(company_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_properties_company_id ON properties(company_id);
CREATE INDEX idx_plant_rooms_property_id ON plant_rooms(property_id);
CREATE INDEX idx_units_property_id ON units(property_id);
CREATE INDEX idx_equipment_plant_room_id ON equipment(plant_room_id);
CREATE INDEX idx_equipment_unit_id ON equipment(unit_id);
CREATE INDEX idx_services_unit_id ON services(unit_id);
CREATE INDEX idx_services_plant_room_id ON services(plant_room_id);
CREATE INDEX idx_services_technician_id ON services(technician_id);
CREATE INDEX idx_services_date ON services(service_date);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_bookings_unit_id ON bookings(unit_id);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chemical_additions ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesale_pickups ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Companies: Users see own company only
CREATE POLICY "users_own_company" ON companies
  FOR ALL USING (
    id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Profiles: Users see own company members
CREATE POLICY "company_members_visible" ON profiles
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Properties: Company isolation
CREATE POLICY "company_properties" ON properties
  FOR ALL USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Services: Technicians see own services, owners see all
CREATE POLICY "service_access" ON services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.company_id = services.property_id::text::uuid -- Join via property
      AND (p.role = 'owner' OR services.technician_id = auth.uid())
    )
  );

-- Billing Reports: OWNER ONLY
CREATE POLICY "billing_owner_only" ON billing_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'owner'
      AND company_id = billing_reports.company_id
    )
  );

-- Similar policies for other tables (all company-isolated)
```

---

## 🎨 Visual Mockups (Updated)

### Color Palette
```css
:root {
  --primary: #2090c3;      /* Aquivis Blue */
  --accent: #bac2c3;       /* Subtle Gray */
  --success: #10b981;      /* Green */
  --warning: #f59e0b;      /* Amber */
  --error: #ef4444;        /* Red */
  --background: #ffffff;   /* White */
  --foreground: #1f2937;   /* Dark Gray */
  --muted: #f3f4f6;        /* Light Gray */
}
```

### 1. Mobile - Daily Schedule (Hybrid View)

```
┌─────────────────────────────────────┐
│ ☰  [View: Today ▼]      🔔 👤     │ <- Top bar (#2090c3)
├─────────────────────────────────────┤
│                                     │
│ Filter: [All Properties ▼]         │
│                                     │
│ Sheraton Grand Mirage              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│ ☀️ Morning Checks (7:00 AM) - 3    │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ☐ Freshwater Pool Test      │   │
│ │   [Start Service →]          │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ☐ Saltwater Pool #3 Test    │   │
│ │   [Start Service →]          │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ☐ Plant Room - Saltwater    │   │
│ │   Equipment Check            │   │
│ │   [Start Check →]            │   │
│ └─────────────────────────────┘   │
│                                     │
│ 🌙 Afternoon Checks (3:00 PM) - 2  │
│ (Collapsed - tap to expand)         │
│                                     │
├─────────────────────────────────────┤
│ Sea Temple - Port Douglas          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│ 🏊 Main Pools (3) - All services   │
│ 🛁 Occupied Units (12)             │
│ ⚠️ Weekly Check Required (3)       │
│                                     │
│ [View All Tasks →]                  │
│                                     │
├─────────────────────────────────────┤
│ Smith Residence                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ☐ Weekly Service            │   │
│ │   [Start Service →]          │   │
│ └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  📋      🏢      📷      👤        │ <- Bottom nav
│ Today  Properties Camera Profile   │
└─────────────────────────────────────┘

** Switch to "Property View": **
┌─────────────────────────────────────┐
│ ☰  [View: Properties ▼]  🔔 👤    │
├─────────────────────────────────────┤
│                                     │
│ My Properties (8)                  │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 🏢 Sheraton Grand Mirage    │   │
│ │    Commercial • 9 pools     │   │
│ │    5 tasks today            │   │
│ │    [View →]                  │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 🏨 Pullman Sea Temple       │   │
│ │    Body Corp • 85 units     │   │
│ │    15 tasks today           │   │
│ │    [View →]                  │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 🏡 Smith Residence          │   │
│ │    Residential • 1 pool     │   │
│ │    1 task today             │   │
│ │    [View →]                  │   │
│ └─────────────────────────────┘   │
│                                     │
│         [+ Add Property]            │
│                                     │
└─────────────────────────────────────┘
```

### 2. Mobile - Spa Service Form (SIMPLIFIED - Single Page)

```
┌─────────────────────────────────────┐
│ ← Unit 203 - Rooftop Spa           │
├─────────────────────────────────────┤
│                                     │
│ Quick Spa Service                  │
│ 🛁 500 gallon bromine spa          │
│                                     │
│ Service Type:                       │
│ ◉ Service    ○ Test Only            │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│ Bromine Level                       │
│ ┌─────────────────────────────┐   │
│ │      [35]                   │   │
│ │   Ideal range: 30-50        │   │
│ └─────────────────────────────┘   │
│ ✓ Good (auto: <30 = add tablet)    │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│ Equipment Check                     │
│ Is pump running?    ◉ Yes  ○ No    │
│ Is water warm?      ◉ Yes  ○ No    │
│ Filter cleaned?     ◉ Yes  ○ No    │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│ Chemicals Added                     │
│ ☑ 1 Bromine Tablet                 │
│   (auto-checked if bromine <30)    │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│ Notes (optional)                    │
│ ┌─────────────────────────────┐   │
│ │                             │   │
│ └─────────────────────────────┘   │
│                                     │
│ 📷 [Add Photo (optional)]           │
│                                     │
│        [✓ Complete Service]         │
│                                     │
└─────────────────────────────────────┘
```

### 3. Mobile - Pool Service Form (Guided 6-Step)

*(Kept as originally designed - more complex for pools with multiple parameters)*

### 4. Mobile - Plant Room Check

```
┌─────────────────────────────────────┐
│ ← Sheraton - Saltwater Plant       │
├─────────────────────────────────────┤
│                                     │
│ Plant Room Check                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│ Time:  ◉ Morning    ○ Afternoon    │
│                                     │
│ 🔧 Filters (5)                     │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ Filter 1                    │   │
│ │ Inlet  [25] Outlet [15] psi │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ Filter 2                    │   │
│ │ Inlet  [26] Outlet [16] psi │   │
│ └─────────────────────────────┘   │
│                                     │
│         [Expand 3 more...]          │
│                                     │
│ 💨 Pumps (2)                       │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ Pump 1                      │   │
│ │ Setpoint [2800] ▼[RPM]      │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ Pump 2                      │   │
│ │ Setpoint [50] ▼[Hz]         │   │
│ └─────────────────────────────┘   │
│                                     │
│ ⚗️ Chlorinators (6)                │
│ ┌─────────────────────────────┐   │
│ │ Chlor 1-6: [50][50][50]...  │   │
│ │ All at 50%                  │   │
│ └─────────────────────────────┘   │
│                                     │
│ 💧 Balance Tank                    │
│ ┌─────────────────────────────┐   │
│ │ Level: [1250] litres        │   │
│ └─────────────────────────────┘   │
│                                     │
│ Notes:                             │
│ ┌─────────────────────────────┐   │
│ │                             │   │
│ └─────────────────────────────┘   │
│                                     │
│          [✓ Save Check]             │
│                                     │
└─────────────────────────────────────┘
```

### 5. Desktop - Plant Room Builder (Admin Only)

```
┌────────────────────────────────────────────────────────────────────┐
│  ← Back to Sheraton Grand Mirage                                  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Build Plant Room                                                  │
│                                                                    │
│  Plant Room Name: [Saltwater Plant___________________________]    │
│                                                                    │
│  Check Schedule:                                                   │
│  ☑ Morning  ☑ Afternoon  ☐ Evening                                │
│  Days: ☑ Mon ☑ Tue ☑ Wed ☑ Thu ☑ Fri ☑ Sat ☑ Sun                │
│                                                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                    │
│  Equipment                                                         │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Equipment Type: ▼ Filter                                  │   │
│  │  Brand:          [Pentair_______________]                  │   │
│  │  Model:          [TR140C_________________]                 │   │
│  │  Serial:         [SN12345_______________]                  │   │
│  │  Measurement:    Pressure (psi) - inlet/outlet            │   │
│  │  [Add Equipment]                                           │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  Added Equipment:                                                  │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  1. Filter 1 (Pentair TR140C) - Pressure tracking         │   │
│  │  2. Filter 2 (Pentair TR140C) - Pressure tracking         │   │
│  │  3. Filter 3 (Pentair TR140C) - Pressure tracking         │   │
│  │  4. Filter 4 (Pentair TR140C) - Pressure tracking         │   │
│  │  5. Filter 5 (Pentair TR140C) - Pressure tracking         │   │
│  │  6. Pump 1 (Pentair SuperFlo) - RPM setpoint              │   │
│  │  7. Pump 2 (Pentair SuperFlo) - Hz setpoint               │   │
│  │  8. Chlorinator 1 (Zodiac LM3) - % setpoint               │   │
│  │  ... (3 more chlorinators)                                 │   │
│  │  12. Balance Tank - Litres (numerical)                     │   │
│  │                                                            │   │
│  │  [Edit] [Remove]                                           │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  [Save Plant Room]  [Cancel]                                       │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 6. Desktop - Property View (All Users)

```
┌────────────────────────────────────────────────────────────────────┐
│  ← Back to Properties                                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Sheraton Grand Mirage                                             │
│  Commercial Property • Total Volume: 25,000,000L                   │
│                                                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                    │
│  📋 Today's Schedule (8 tasks)                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  ☀️ Morning Checks (7:00 AM)                               │   │
│  │  ☐ Freshwater Pool Test                                    │   │
│  │  ☐ Saltwater Pool #3 Test                                  │   │
│  │  ☐ Saltwater Pool #7 Test                                  │   │
│  │  ☐ Plant Room - Saltwater Check                            │   │
│  │  ☐ Plant Room - Freshwater Check                           │   │
│  │                                                            │   │
│  │  🌙 Afternoon Checks (3:00 PM)                             │   │
│  │  ☐ Freshwater Pool Test                                    │   │
│  │  ☐ Saltwater Pool #1 Test                                  │   │
│  │  ☐ Saltwater Pool #5 Test                                  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  🔧 Plant Rooms (2)                                                │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Saltwater Plant                                           │   │
│  │  • 5 Filters, 2 Pumps, 6 Chlorinators, 1 Balance Tank     │   │
│  │  • Checks: Morning + Afternoon (daily)                     │   │
│  │  [View] [Edit Equipment] [Check History]                   │   │
│  ├────────────────────────────────────────────────────────────┤   │
│  │  Freshwater Plant                                          │   │
│  │  • 4 Filters, 1 Pump, 1 Chlorinator                        │   │
│  │  • Checks: Morning + Afternoon (daily)                     │   │
│  │  [View] [Edit Equipment] [Check History]                   │   │
│  └────────────────────────────────────────────────────────────┘   │
│  [+ Add Plant Room] (admin only)                                   │
│                                                                    │
│  🏊 Pools (9)                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  1. Freshwater Pool (450,000L)                             │   │
│  │  2. Saltwater Pool #1 (2,800,000L)                         │   │
│  │  3. Saltwater Pool #2 (2,800,000L)                         │   │
│  │  ... (6 more pools)                                        │   │
│  │  [View All]                                                │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  📊 Recent Activity                                                │
│  • Plant room check completed by John (2 hrs ago)                 │
│  • Freshwater pool tested by Sarah (3 hrs ago)                    │
│  • Morning checks completed (5 hrs ago)                           │
│                                                                    │
│  [View Full History] [Generate Report] (admin only)                │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 7. Desktop - Operations Dashboard (Admin/Manager - Real-time Monitoring)

```
┌────────────────────────────────────────────────────────────────────┐
│  🌊 Aquivis - Operations Dashboard          🔄 Auto-refresh  👤    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Live Pool Status - All Properties                Today, 3:45 PM  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  🔴 ATTENTION REQUIRED (2)                                   │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  • Sea Temple Unit 207 - Bromine LOW (15) - 2 hrs ago       │ │
│  │  • Sheraton Pool #3 - PH HIGH (8.2) - 45 min ago           │ │
│  │  [View Details] [Alert Technician]                           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                    │
│  Sheraton Grand Mirage                                             │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Plant Room - Saltwater          Last check: 3:15 PM        │   │
│  │  ✓ All equipment normal                                     │   │
│  │  • Filters: 5/5 normal pressure (22-26 / 14-17 psi)        │   │
│  │  • Pumps: 2/2 running (2800 RPM, 50 Hz)                    │   │
│  │  • Chlorinators: 6/6 at 50%                                 │   │
│  │  • Balance Tank: 1,250L (normal)                            │   │
│  │  [View Details] [View Check History]                        │   │
│  ├────────────────────────────────────────────────────────────┤   │
│  │  Freshwater Pool                 Last test: 3:30 PM         │   │
│  │  ✓ All parameters OK                                        │   │
│  │  PH: 7.4  Chlorine: 2.5 ppm  Alk: 120 ppm                  │   │
│  │  Tested by: John                                            │   │
│  │  [View Details]                                             │   │
│  ├────────────────────────────────────────────────────────────┤   │
│  │  Saltwater Pool #3               Last test: 2:45 PM         │   │
│  │  ⚠️ PH HIGH (8.2) - Acid needed                            │   │
│  │  PH: 8.2 ⚠️  Chlorine: 3.0 ppm ✓  Salt: 3500 ppm ✓       │   │
│  │  Tested by: Sarah                                           │   │
│  │  [View Details] [Mark Resolved] [Assign Technician]         │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                    │
│  Pullman Sea Temple                                                │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Main Pool                       Last service: 2:15 PM      │   │
│  │  ✓ All parameters OK                                        │   │
│  │  PH: 7.6  Chlorine: 3.5 ppm  Salt: 3200 ppm                │   │
│  │  Serviced by: John                                          │   │
│  │  [View Details]                                             │   │
│  ├────────────────────────────────────────────────────────────┤   │
│  │  Unit 207 (Rooftop Spa)          Last service: 1:30 PM      │   │
│  │  🔴 Bromine LOW (15) - Tablet added but still low           │   │
│  │  Bromine: 15 ⚠️ (target: 30-50)                            │   │
│  │  Serviced by: Sarah - 1 tablet added                        │   │
│  │  [View Details] [Alert Manager] [Schedule Recheck]          │   │
│  ├────────────────────────────────────────────────────────────┤   │
│  │  📊 Today's Summary (Sea Temple)                            │   │
│  │  • Services completed: 12/15                                │   │
│  │  • All tests OK: 10/12                                      │   │
│  │  • Issues flagged: 2 (1 low bromine, 1 pending)            │   │
│  │  [View All Units]                                           │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                    │
│  Residential Properties (6)                                        │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  ✓ All residential pools OK (last 24 hours)                 │   │
│  │  • 4 serviced today (all parameters normal)                 │   │
│  │  • 2 scheduled tomorrow                                     │   │
│  │  [View All]                                                 │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                    │
│  📈 Today's Activity Summary                                       │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Total services: 28 completed, 6 pending                    │   │
│  │  Total tests: 42                                            │   │
│  │  Issues flagged: 2 (action required)                        │   │
│  │  Active technicians: 3 (John, Sarah, Mike)                  │   │
│  │  Chemicals used today: $145                                 │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  [View Yesterday] [View Last Week] [View History] [Export Report]  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Features:**
- 🔴 **Alert System** - Automatically highlights out-of-range parameters
- ⏱️ **Real-time Updates** - Auto-refresh shows latest test results
- 📊 **Status Overview** - At-a-glance health of all pools/spas
- 🔍 **Drill-down** - Click any item for full service history
- 📅 **Historical View** - See yesterday, last week, custom date range
- 🔔 **Action Items** - Assign technicians, schedule rechecks
- 📱 **Responsive** - Works on desktop and tablet

### 8. Desktop - Billing Report (Admin Only)

*(Same as before, no changes needed)*

---

## 🔧 Feature Breakdown

### Phase 1: Foundation (Weeks 1-4)

**Week 1: Project Setup & Authentication**
- ✅ Next.js 15 project setup
- ✅ Supabase integration
- ✅ Authentication (email/password)
- ✅ Role-based access (owner vs technician)
- ✅ Basic UI components (Shadcn)
- ✅ Theme setup (brand colors)

**Week 2: Company & User Management**
- ✅ Company onboarding (business type selection)
- ✅ User profile management
- ✅ Team invitations
- ✅ Role assignment
- ✅ Dashboard layout (navigation)

**Week 3: Property Management**
- ✅ Add/edit properties
- ✅ Property types (residential, commercial, resort, body corporate)
- ✅ Plant room builder (admin only)
- ✅ Equipment management (flexible types)
- ✅ Unit management (pools, spas, villas)

**Week 4: Basic Service Logging**
- ✅ Spa service form (simple single-page)
- ✅ Pool service form (guided 6-step)
- ✅ Water test recording
- ✅ Chemical addition tracking
- ✅ Photo upload (Supabase storage)

### Phase 2: Advanced Features (Weeks 5-8)

**Week 5: Scheduling & Bookings**
- ✅ Booking system (Sea Temple occupancy)
- ✅ Today's schedule generation
- ✅ Hybrid navigation (Today vs Properties view)
- ✅ Task filtering and grouping
- ✅ Occupancy-based task generation

**Week 6: Plant Room & Equipment**
- ✅ Plant room check forms (dynamic based on equipment)
- ✅ Equipment status tracking
- ✅ Maintenance task logging
- ✅ Equipment check history
- ✅ Multiple plant rooms per property

**Week 7: Billing & Reports (Admin Only)**
- ✅ Billing report generator
- ✅ Multi-entity billing (Sea Temple complexity)
- ✅ Service/test/chemical cost tracking
- ✅ PDF/Excel export
- ✅ Email reports
- ✅ **Operations Dashboard (Real-time monitoring)**
  - Live pool status across all properties
  - Alert system for out-of-range parameters
  - Today's activity summary
  - Historical view (yesterday, last week)

**Week 8: Customer Portal**
- ✅ Customer access codes
- ✅ View water test results
- ✅ Service history
- ✅ Trend graphs
- ✅ Optional booking submission

### Phase 3: Polish & Deploy (Weeks 9-12)

**Week 9: Mobile PWA**
- ✅ PWA configuration
- ✅ Offline capability (IndexedDB)
- ✅ Install prompts
- ✅ Camera integration
- ✅ Touch optimization

**Week 10: Additional Features**
- ✅ Time tracking (clock in/out)
- ✅ B2B wholesale tracking (simple form)
- ✅ Notifications
- ✅ Search & filters

**Week 11: Testing & Refinement**
- ✅ Field testing with your team
- ✅ Bug fixes
- ✅ Performance optimization
- ✅ UI/UX refinements
- ✅ Feedback implementation

**Week 12: Launch Preparation**
- ✅ Production deployment (Vercel)
- ✅ Monitoring setup (Sentry)
- ✅ Documentation
- ✅ Sales materials
- ✅ Customer onboarding flow

---

## 📦 Dependencies

### Core Dependencies
```json
{
  "dependencies": {
    "next": "^15.1.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "typescript": "^5.8.0",
    
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.2",
    
    "tailwindcss": "^3.4.17",
    "@tailwindcss/forms": "^0.5.9",
    "@tailwindcss/typography": "^0.5.16",
    
    "lucide-react": "^0.462.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    
    "react-hook-form": "^7.61.1",
    "@hookform/resolvers": "^3.10.0",
    "zod": "^3.25.76",
    
    "date-fns": "^3.6.0",
    "recharts": "^2.15.4",
    
    "zustand": "^5.0.2",
    "@tanstack/react-query": "^5.83.0",
    
    "jspdf": "^2.5.2",
    "jspdf-autotable": "^3.8.2",
    "exceljs": "^4.4.0"
  },
  "devDependencies": {
    "@types/node": "^22.16.5",
    "@types/react": "^18.3.23",
    "@types/react-dom": "^18.3.7",
    "eslint": "^9.32.0",
    "eslint-config-next": "^15.1.0",
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.6",
    
    "vitest": "^3.2.4",
    "@vitest/ui": "^3.2.4",
    "playwright": "^1.55.1",
    
    "@sentry/nextjs": "^10.15.0"
  }
}
```

### Shadcn UI Components (to install)
```bash
npx shadcn@latest init
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add form
npx shadcn@latest add select
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add tabs
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add calendar
npx shadcn@latest add checkbox
npx shadcn@latest add switch
npx shadcn@latest add toast
npx shadcn@latest add sheet
npx shadcn@latest add table
```

---

## 🔧 Environment Setup

### Step 1: Create Next.js Project

```bash
cd C:\aquivis
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

When prompted:
- ✅ TypeScript: Yes
- ✅ ESLint: Yes
- ✅ Tailwind CSS: Yes
- ✅ `src/` directory: No (we'll use app router directly)
- ✅ App Router: Yes
- ✅ Import alias: Yes (@/*)

### Step 2: Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install react-hook-form @hookform/resolvers zod
npm install date-fns recharts zustand @tanstack/react-query
npm install jspdf jspdf-autotable exceljs
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install -D @types/node @vitest/ui playwright @sentry/nextjs
```

### Step 3: Install Shadcn UI

```bash
npx shadcn@latest init
```

Configuration:
- Style: Default
- Base color: Slate
- CSS variables: Yes

### Step 4: Configure Tailwind (Brand Colors)

**tailwind.config.ts:**
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2090c3',
          50: '#e6f4fa',
          100: '#cce9f5',
          200: '#99d3eb',
          300: '#66bde1',
          400: '#33a7d7',
          500: '#2090c3', // Main
          600: '#1a739c',
          700: '#135675',
          800: '#0d394e',
          900: '#061c27',
        },
        accent: {
          DEFAULT: '#bac2c3',
          50: '#f5f6f6',
          100: '#ebeded',
          200: '#d7dbdb',
          300: '#c3c9c9',
          400: '#afb7b7',
          500: '#bac2c3', // Main
          600: '#959b9c',
          700: '#707475',
          800: '#4a4d4e',
          900: '#252627',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
export default config
```

### Step 5: Environment Variables

**Create `.env.local`:**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://krxabrdizqbpitpsvgiv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGFicmRpenFicGl0cHN2Z2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyODM1MTIsImV4cCI6MjA3NDg1OTUxMn0.Og1vlRLR4dEMRvYF4POSifY-oxuCEIqifBlWh4q5Kng
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
```

**Create `.env.local.example`:**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=
```

### Step 6: Supabase Client Setup

**lib/supabase/client.ts:**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**lib/supabase/server.ts:**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component - ignore
          }
        },
      },
    }
  )
}
```

### Step 7: Database Migration

**Run in Supabase SQL Editor:**
```sql
-- Copy entire schema from Database Schema section above
-- Execute in order:
-- 1. Create ENUMs
-- 2. Create tables
-- 3. Create indexes
-- 4. Enable RLS
-- 5. Create policies
```

### Step 8: Run Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

---

## 🚀 Implementation Order

### Priority 1: Critical Path (MVP)
1. Authentication & role-based access
2. Company & property setup
3. Service forms (spa + pool)
4. Today's schedule view
5. Basic reporting

### Priority 2: Essential Features
6. Plant room builder
7. Booking system (Sea Temple)
8. Equipment tracking
9. Customer portal

### Priority 3: Nice-to-Have
10. Time tracking
11. B2B wholesale
12. Advanced analytics
13. Notifications

---

## ✅ Success Criteria

**Phase 1 Complete When:**
- ✅ Can add properties (Sheraton, Sea Temple, residential)
- ✅ Can log spa services (simple form)
- ✅ Can log pool services (guided form)
- ✅ Today's schedule shows tasks
- ✅ Mobile responsive

**Phase 2 Complete When:**
- ✅ Sea Temple bookings generate daily tasks
- ✅ Plant room checks capture all equipment data
- ✅ Billing reports work for complex scenarios
- ✅ Customer portal functional

**Phase 3 Complete When:**
- ✅ PWA installable on mobile
- ✅ Works offline (critical features)
- ✅ Field tested by your team
- ✅ Ready for paying customers

---

## 🎯 Next Steps

1. **Review this updated plan** - Confirm all changes are correct
2. **Approve to proceed** - Give go-ahead to start building
3. **Create Next.js project** - Run initial setup commands
4. **Implement Phase 1** - Start with authentication

---

*Plan ready for implementation. Awaiting approval to begin development.*

