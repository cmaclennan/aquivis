# 📋 Aquivis - Complete Setup & Build Plan

**Purpose:** Comprehensive blueprint for building Aquivis from scratch with visual mockups, database schema, and implementation roadmap.

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
│   │   │   ├── run-sheets/
│   │   │   ├── service/       # Service forms
│   │   │   ├── reports/
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
│   │   ├── layouts/           # Layout components
│   │   └── features/          # Feature-specific components
│   │
│   ├── lib/
│   │   ├── supabase/          # Supabase client & utilities
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

## 🗄️ Database Schema

### Core Tables Design

```sql
-- ============================================
-- MULTI-TENANCY & USERS
-- ============================================

CREATE TYPE business_type AS ENUM ('residential', 'commercial', 'both');
CREATE TYPE user_role AS ENUM ('owner', 'technician', 'view_only');

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
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Units (pools, spas, etc.)
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
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE, -- For plant rooms
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE, -- For individual units
  equipment_type TEXT NOT NULL, -- 'pump', 'filter', 'chlorinator', 'balance_tank'
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  install_date DATE,
  warranty_expiry DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (property_id IS NOT NULL OR unit_id IS NOT NULL) -- Must belong to one
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

-- Run sheet templates (for recurring schedules like Sheraton)
CREATE TABLE run_sheet_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Sheraton Morning Checks"
  time_of_day TEXT, -- 'morning', 'afternoon', 'evening'
  day_of_week INTEGER, -- 0-6 (Sunday-Saturday) or NULL for daily
  unit_ids UUID[] DEFAULT '{}', -- Array of unit IDs
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SERVICES & WATER TESTING
-- ============================================

CREATE TYPE service_type AS ENUM ('test_only', 'full_service', 'equipment_check');
CREATE TYPE service_status AS ENUM ('scheduled', 'in_progress', 'completed', 'skipped');

-- Service records
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  service_date TIMESTAMPTZ DEFAULT NOW(),
  service_type service_type DEFAULT 'full_service',
  status service_status DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Water test results
CREATE TABLE water_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  ph DECIMAL(3,1),
  chlorine DECIMAL(4,1),
  bromine DECIMAL(4,1),
  salt INTEGER,
  alkalinity INTEGER,
  calcium INTEGER,
  cyanuric INTEGER,
  all_parameters_ok BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chemical additions
CREATE TABLE chemical_additions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  chemical_type TEXT NOT NULL, -- 'chlorine', 'acid', 'buffer', 'salt', etc.
  quantity DECIMAL(6,2) NOT NULL,
  unit_of_measure TEXT DEFAULT 'cups', -- 'cups', 'tbsp', 'kg', 'L'
  cost DECIMAL(8,2) DEFAULT 0, -- For billing
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment checks (for plant rooms)
CREATE TABLE equipment_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  inlet_pressure INTEGER,
  outlet_pressure INTEGER,
  setpoint INTEGER, -- For pumps/chlorinators
  balance_tank_level TEXT, -- 'normal', 'low', 'high'
  status TEXT DEFAULT 'normal', -- 'normal', 'warning', 'fault'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance tasks
CREATE TABLE maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL, -- 'netting', 'vacuuming', 'skimmer_clean', 'filter_clean'
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
  generated_at TIMESTAMPTZ DEFAULT NOW()
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
CREATE INDEX idx_properties_company_id ON properties(company_id);
CREATE INDEX idx_units_property_id ON units(property_id);
CREATE INDEX idx_services_unit_id ON services(unit_id);
CREATE INDEX idx_services_technician_id ON services(technician_id);
CREATE INDEX idx_services_date ON services(service_date);
CREATE INDEX idx_bookings_unit_id ON bookings(unit_id);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
-- ... (enable for all tables)

-- Example RLS policies (company isolation)
CREATE POLICY "Users can view own company data" ON properties
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Full RLS policies will be added during implementation
```

---

## 🎨 Visual Mockups

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

### 1. Mobile - Daily Run Sheet

```
┌─────────────────────────────────────┐
│ ☰  Today's Schedule      🔔 👤    │ <- Top bar (#2090c3)
├─────────────────────────────────────┤
│                                     │
│ Sheraton Grand Mirage              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│ ☀️ Morning Checks (7:00 AM)        │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ☐ Freshwater Pool           │   │
│ │   Test Required             │   │
│ │   📍 Plant Room #2          │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ☐ Saltwater Pool #3         │   │
│ │   Test Required             │   │
│ │   📍 Main Area              │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ☐ Plant Room - Saltwater    │   │
│ │   Equipment Check           │   │
│ │   🔧 5 filters, 2 pumps     │   │
│ └─────────────────────────────┘   │
│                                     │
│ 🌙 Afternoon Checks (3:00 PM)      │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ☐ Saltwater Pool #1         │   │
│ │   Test Required             │   │
│ └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│ Sea Temple - Port Douglas          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│ 🏊 Main Pools (3)                  │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ☐ Main Pool                 │   │
│ │   Full Service              │   │
│ │   💧 30,000 gal saltwater   │   │
│ └─────────────────────────────┘   │
│                                     │
│ 🛁 Occupied Units (12)             │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ☐ Unit 203                  │   │
│ │   Rooftop Spa • Service     │   │
│ │   Check-out: Tomorrow       │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ☐ Unit 207                  │   │
│ │   Rooftop Spa • Service     │   │
│ │   Check-out: Jan 15         │   │
│ └─────────────────────────────┘   │
│                                     │
│ ⚠️ Weekly Check Required (3)       │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 🔴 Unit 301                 │   │
│ │   Rooftop Spa               │   │
│ │   ⚠️ 6 days since service   │   │
│ └─────────────────────────────┘   │
│                                     │
│           [Load More Units]         │
│                                     │
├─────────────────────────────────────┤
│  📋      📷      ⏰      👤        │ <- Bottom nav
│ Run Sheet Camera  Time  Profile    │
└─────────────────────────────────────┘
```

### 2. Mobile - Service Form (Guided Flow)

```
┌─────────────────────────────────────┐
│ ← Unit 203 - Rooftop Spa           │
├─────────────────────────────────────┤
│                                     │
│ Step 1 of 6                        │
│ ▓▓▓▓░░░░░░░░░░░░░░░░░░░░           │
│                                     │
│ Service Type                       │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ◉ Full Service              │   │
│ │   Test + Chemicals + Clean  │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ○ Test Only                 │   │
│ │   Quick water check         │   │
│ └─────────────────────────────┘   │
│                                     │
│                                     │
│              [Next →]               │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ← Unit 203 - Rooftop Spa           │
├─────────────────────────────────────┤
│                                     │
│ Step 2 of 6                        │
│ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░             │
│                                     │
│ Water Test Results                 │
│ 🛁 Bromine Spa (500 gal)           │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ PH          [7.4]           │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━   │   │
│ │ Target: 7.2 - 7.6          │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ Bromine     [3.0] ppm      │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━   │   │
│ │ Target: 2.0 - 4.0 ppm      │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ Alkalinity  [120] ppm      │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━   │   │
│ │ Target: 80 - 120 ppm       │   │
│ └─────────────────────────────┘   │
│                                     │
│ ✓ All parameters OK                │
│                                     │
│              [Next →]               │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ← Unit 203 - Rooftop Spa           │
├─────────────────────────────────────┤
│                                     │
│ Step 3 of 6                        │
│ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░             │
│                                     │
│ Chemical Suggestions               │
│                                     │
│ 💡 Based on results:               │
│                                     │
│ ⚠️ PH Low (6.8)                    │
│ → Add 0.5 cups Buffer              │
│                                     │
│ ⚠️ Bromine Low (1.0 ppm)           │
│ → Add 2 tbsp Bromine               │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ☑ Chemicals Added           │   │
│ │                             │   │
│ │ • Buffer: 0.5 cups          │   │
│ │ • Bromine: 2 tbsp           │   │
│ │                             │   │
│ │ Cost: $4.50                 │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ☐ No chemicals needed       │   │
│ └─────────────────────────────┘   │
│                                     │
│              [Next →]               │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ← Unit 203 - Rooftop Spa           │
├─────────────────────────────────────┤
│                                     │
│ Step 4 of 6                        │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░             │
│                                     │
│ Maintenance Tasks                  │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ☑ Cleaned skimmers          │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ☑ Cleaned filter            │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ☑ Vacuumed                  │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ☑ Brushed walls             │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ☐ Netted debris             │   │
│ └─────────────────────────────┘   │
│                                     │
│              [Next →]               │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ← Unit 203 - Rooftop Spa           │
├─────────────────────────────────────┤
│                                     │
│ Step 5 of 6                        │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░             │
│                                     │
│ Equipment Check                    │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ◉ All working as expected   │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ○ Warning/Issue             │   │
│ │   (explain below)           │   │
│ └─────────────────────────────┘   │
│                                     │
│ Notes (optional):                  │
│ ┌─────────────────────────────┐   │
│ │                             │   │
│ │                             │   │
│ └─────────────────────────────┘   │
│                                     │
│              [Next →]               │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ← Unit 203 - Rooftop Spa           │
├─────────────────────────────────────┤
│                                     │
│ Step 6 of 6                        │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓           │
│                                     │
│ Service Photos                     │
│                                     │
│ ┌───────┐ ┌───────┐               │
│ │ 📷    │ │       │               │
│ │       │ │       │               │
│ │ Photo │ │ Add   │               │
│ │  #1   │ │ Photo │               │
│ └───────┘ └───────┘               │
│                                     │
│ 💡 Tip: Capture before/after       │
│                                     │
│                                     │
│        [✓ Complete Service]         │
│                                     │
└─────────────────────────────────────┘
```

### 3. Mobile - Plant Room Check

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
│ ┌─────────────────────────────┐   │
│ │ Filter 3                    │   │
│ │ Inlet  [24] Outlet [14] psi │   │
│ └─────────────────────────────┘   │
│                                     │
│         [+ Add Filter 4 & 5]        │
│                                     │
│ 💨 Pumps (2)                       │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ Pump 1 Setpoint [2800] RPM  │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ Pump 2 Setpoint [2800] RPM  │   │
│ └─────────────────────────────┘   │
│                                     │
│ ⚗️ Chlorinators (6)                │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ Chlor 1  [50]%              │   │
│ │ Chlor 2  [50]%              │   │
│ │ Chlor 3  [50]%              │   │
│ │ ... (show all 6)            │   │
│ └─────────────────────────────┘   │
│                                     │
│ 💧 Balance Tank                    │
│ ┌─────────────────────────────┐   │
│ │ Level: ▼ Normal             │   │
│ │        (Low/Normal/High)    │   │
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

### 4. Desktop - Main Dashboard

```
┌────────────────────────────────────────────────────────────────────┐
│  🌊 Aquivis                                    🔔  Settings  👤 Craig│
├─────────┬──────────────────────────────────────────────────────────┤
│         │                                                          │
│  Home   │  Dashboard Overview                      Jan 10, 2025   │
│         │                                                          │
│  Prop.  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│         │  │  Services   │ │    Tests    │ │ Technicians │      │
│  Run    │  │  Completed  │ │  Completed  │ │   Active    │      │
│  Sheets │  │             │ │             │ │             │      │
│         │  │     18      │ │     12      │ │      3      │      │
│  Reports│  │   of  24    │ │   of  18    │ │             │      │
│         │  └─────────────┘ └─────────────┘ └─────────────┘      │
│  Time   │                                                          │
│         │  Recent Activity                                         │
│  Cust.  │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  Portal │  ┃ • Unit 203 serviced by John       10 min ago    ┃  │
│         │  ┃ • Main Pool tested by Sarah       25 min ago    ┃  │
│  ─────  │  ┃ • Sheraton AM checks complete     2 hrs ago     ┃  │
│         │  ┃ • Villa 105 serviced by Mike      3 hrs ago     ┃  │
│  Settings│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│         │                                                          │
│         │  Properties Overview                                     │
│         │  ┌───────────────────────────────────────────────┐      │
│         │  │ 🏢 Sheraton Grand Mirage        Commercial    │      │
│         │  │    9 pools • 15 equipment items               │      │
│         │  │    Last service: Today 3:15 PM                │      │
│         │  │    [View Details] [Run Sheet]                 │      │
│         │  └───────────────────────────────────────────────┘      │
│         │                                                          │
│         │  ┌───────────────────────────────────────────────┐      │
│         │  │ 🏨 Pullman Sea Temple      Body Corporate     │      │
│         │  │    85 units • 3 main pools                    │      │
│         │  │    12 services today • 3 pending              │      │
│         │  │    [View Details] [Bookings] [Billing]        │      │
│         │  └───────────────────────────────────────────────┘      │
│         │                                                          │
│         │  ┌───────────────────────────────────────────────┐      │
│         │  │ 🏡 Smith Residence          Residential       │      │
│         │  │    1 pool                                     │      │
│         │  │    Next service: Tomorrow                     │      │
│         │  │    [View Details]                             │      │
│         │  └───────────────────────────────────────────────┘      │
│         │                                                          │
└─────────┴──────────────────────────────────────────────────────────┘
```

### 5. Desktop - Billing Report Generator

```
┌────────────────────────────────────────────────────────────────────┐
│  ← Back to Reports                                                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Generate Billing Report                                           │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Customer:     ▼ Sea Temple Body Corporate                 │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌────────────────────────┐  ┌────────────────────────────────┐   │
│  │  From: Jan 1, 2025     │  │  To: Jan 31, 2025              │   │
│  └────────────────────────┘  └────────────────────────────────┘   │
│                                                                    │
│  Include:  ☑ Services   ☑ Chemicals   ☑ Equipment Checks          │
│                                                                    │
│  [Generate Report]                                                 │
│                                                                    │
│  ─────────────────────────────────────────────────────────────   │
│                                                                    │
│  Sea Temple Billing Report - January 2025                         │
│                                                                    │
│  📊 Summary                                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                    │
│  Main Pools (Body Corporate)                                       │
│  • Main Pool:  8 services @ $30      $240                         │
│  • Kids Pool:  8 services @ $30      $240                         │
│  • Main Spa:   8 services @ $30      $240                         │
│  • Chemicals used:                   $450                         │
│  ─────────────────────────────────────────                        │
│  Subtotal:                         $1,170                         │
│                                                                    │
│  Hotel Letting Pool (52 units)                                     │
│  • Rooftop Spas:   156 services, 78 tests                         │
│  • Golf Villas:     32 services, 16 tests                         │
│  • Premium Villas:  13 services, 6 tests                          │
│  • Chemicals used:                 $2,340                         │
│  ─────────────────────────────────────────                        │
│  Subtotal:                         $8,890                         │
│                                                                    │
│  Private Owners (by Property Manager)                              │
│  • ABC Property Mgmt (6 units):    $1,240                         │
│  • XYZ Realty (4 units):             $820                         │
│  • Individual owners (8 units):    $2,180                         │
│  ─────────────────────────────────────────                        │
│  Subtotal:                         $4,240                         │
│                                                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  TOTAL:                           $14,300                         │
│                                                                    │
│  📄 Detailed Breakdown                                             │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Date       Unit      Type        Chem.   Tech.   Total   │    │
│  ├──────────────────────────────────────────────────────────┤    │
│  │ Jan 1   Main Pool   Service      $15    John      $45    │    │
│  │ Jan 1   Unit 203    Service      $8     Sarah     $28    │    │
│  │ Jan 1   Unit 207    Test Only    $0     Sarah     $15    │    │
│  │ ...     ...         ...          ...    ...       ...    │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  [Export PDF]  [Export Excel]  [Email Report]                     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 6. Desktop/Tablet - Customer Portal

```
┌────────────────────────────────────────────────────────────────────┐
│  🌊 Aquivis Customer Portal                            🔓 Logout   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Welcome, Sea Temple Unit 203 Owner                                │
│                                                                    │
│  Your Units                                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                    │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐    │
│  │  📍 Unit 203            │  │  📍 Unit 207                │    │
│  │  Rooftop Spa            │  │  Rooftop Spa                │    │
│  │  Last Service:          │  │  Last Service:              │    │
│  │  Today 9:15 AM          │  │  Yesterday 10:30 AM         │    │
│  │  Status: ✓ Excellent    │  │  Status: ✓ Good             │    │
│  │  [View Details]         │  │  [View Details]             │    │
│  └─────────────────────────┘  └─────────────────────────────┘    │
│                                                                    │
│  Recent Service - Unit 203                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Today 9:15 AM - Full Service by John Smith               │   │
│  │                                                            │   │
│  │  Water Test Results:                                       │   │
│  │  • PH:         7.4 ✓                                       │   │
│  │  • Bromine:    3.2 ppm ✓                                   │   │
│  │  • Alkalinity: 125 ppm ✓                                   │   │
│  │                                                            │   │
│  │  Chemicals Added:                                          │   │
│  │  • None required (all parameters perfect)                  │   │
│  │                                                            │   │
│  │  Maintenance:                                              │   │
│  │  ✓ Cleaned skimmers                                        │   │
│  │  ✓ Vacuumed                                                │   │
│  │  ✓ Brushed walls                                           │   │
│  │  ✓ Filter cleaned                                          │   │
│  │                                                            │   │
│  │  Equipment: All working as expected ✓                      │   │
│  │                                                            │   │
│  │  [View Photos (2)]                                         │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  Water Quality Trend (Last 30 Days)                                │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  PH Level                                                  │   │
│  │  8.0 │                                                     │   │
│  │  7.8 │     ╱──╲                                            │   │
│  │  7.6 │  ╱─╯    ╲─╲                                         │   │
│  │  7.4 │─╯          ╲─╲──                                    │   │
│  │  7.2 │                 ╲─╲──                               │   │
│  │  7.0 │______________________________________               │   │
│  │       Jan 1      Jan 15        Jan 30                      │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  [View All History]  [Download Reports]                            │
│                                                                    │
│  ─────────────────────────────────────────────────────────────   │
│  (Optional feature if enabled)                                     │
│                                                                    │
│  📅 Add Booking                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Unit:      ▼ Unit 203                                     │   │
│  │  Check-in:  [Select Date]                                  │   │
│  │  Check-out: [Select Date]                                  │   │
│  │  [Submit Booking Request]                                  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Feature Breakdown

*(See next section of SETUP_PLAN.md - will continue in next message if approved)*

---

*This is Part 1 of the SETUP_PLAN.md - Ready to continue with Feature Breakdown, Timeline, and Dependencies?*

