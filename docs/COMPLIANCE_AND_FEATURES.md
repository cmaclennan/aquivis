# 📋 Compliance System & Additional Features

**Addendum to SETUP_PLAN.md**  
**Date:** 2025-01-10

This document details the compliance system, chemical cheat sheet, lab testing, and all additional features added during planning.

---

## 🌐 **Regional Settings**

### Company-Level Configuration

```sql
ALTER TABLE companies ADD COLUMN timezone TEXT DEFAULT 'Australia/Brisbane';
ALTER TABLE companies ADD COLUMN unit_system TEXT DEFAULT 'metric';
ALTER TABLE companies ADD COLUMN date_format TEXT DEFAULT 'DD/MM/YYYY';
ALTER TABLE companies ADD COLUMN currency TEXT DEFAULT 'AUD';
ALTER TABLE companies ADD COLUMN compliance_jurisdiction TEXT DEFAULT 'QLD';
```

**Settings UI:**
```
Company Settings > Regional Preferences
┌──────────────────────────────────────────────────────────────┐
│  Timezone: [Australia/Brisbane ▼]                            │
│  Unit System: ◉ Metric  ○ Imperial                           │
│  Date Format: ◉ DD/MM/YYYY  ○ MM/DD/YYYY                     │
│  Currency: [AUD ▼]                                            │
│  Compliance Jurisdiction: [Queensland, AU ▼]                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 📋 **QLD Health Compliance System**

### Philosophy: Helpful, Not Overwhelming

**Approach:**
- ✅ Subtle indicators (⚠️ tooltips, not big warnings)
- ✅ Optional compliance dashboard (click when needed)
- ✅ Automatic detection (works in background)
- ✅ Generate reports on demand
- ✅ Educational (cheat sheet, tooltips explain why)

### Water Chemistry Standards (QLD)

**Chlorine-based Pools (Table A2.1):**
```typescript
const QLD_CHLORINE_STANDARDS = {
  freeChlorine: {
    withoutStabilizer: { min: 1.0, max: null, unit: 'mg/L' },
    withStabilizer: { min: 2.0, max: null, unit: 'mg/L' },
    spa: { min: 3.0, max: null, unit: 'mg/L' }
  },
  combinedChlorine: { min: null, max: 1.0, ideal: 0.2, unit: 'mg/L' },
  totalChlorine: { min: null, max: 10.0, unit: 'mg/L' },
  ph: { min: 7.2, max: 7.8 },
  totalAlkalinity: { min: 80, max: 200, unit: 'mg/L' },
  cyanuricAcid: { min: null, max: 50, ideal: 30, unit: 'mg/L', outdoorOnly: true },
  turbidity: { min: null, max: 1.0, ideal: 0.5, unit: 'NTU' }
}
```

**Bromine-based Pools/Spas (Table A2.2):**
```typescript
const QLD_BROMINE_STANDARDS = {
  bromine: {
    pool: { min: 2.0, max: 8.0, unit: 'mg/L' },
    spa: { min: 6.0, max: 8.0, unit: 'mg/L' }
  },
  ph: { min: 7.2, max: 8.0 },
  totalAlkalinity: { min: 80, max: 200, unit: 'mg/L' },
  turbidity: { min: null, max: 1.0, ideal: 0.5, unit: 'NTU' }
}
```

**Microbiological Standards (Table A2.3):**
```typescript
const QLD_MICROBIOLOGICAL_STANDARDS = {
  eColi: { max: 1, unit: 'CFU/100mL' },
  pseudomonas: { max: 1, unit: 'CFU/100mL' },
  hcc: { max: 100, unit: 'CFU/mL' }
}
```

### Risk Categories (Table A2.4)

**System Auto-Assigns Risk Based on Pool Type:**

| Risk Level | Pool Types | Testing Frequency |
|------------|------------|-------------------|
| **Low** | Retirement village, residential apartment, diving pools | 1 daily |
| **Medium** | 25m/50m pools, hydrotherapy, school, gym, resort, holiday | 3 daily |
| **High** | **Spas, wading, learn-to-swim, program pools** | 5 daily |

**Your Properties:**
- Sheraton pools: **Medium Risk** (resort pools)
- Sheraton plant rooms: **Medium Risk** (equipment checks)
- Sea Temple rooftop spas: **HIGH RISK** (spas)
- Sea Temple plunge pools: **High Risk** (program/resort pools)

### Testing Frequencies (Auto-Applied)

**Operational Monitoring (QLD Table A2.5):**
```
Medium Risk (Sheraton):
- With automated monitoring: 1 manual verification daily
- Without automated: 3 tests per day
- Water balance: Weekly
- Turbidity: Daily
- Cyanuric acid: Weekly (if used)

High Risk (Sea Temple Spas):
- With automated monitoring: 1 manual verification daily
- Without automated: 5 tests per day
- Water balance: Weekly
- Turbidity: Daily
```

**Verification Monitoring (Lab Tests - QLD Tables A2.6, A2.7):**
```
Microbiological:
- High Risk: Monthly (E.coli, Pseudomonas, HCC)
- Medium Risk: Quarterly

Chemical:
- High Risk: Monthly (Chloramines, Ozone if used)
- Medium Risk: Quarterly
```

### Record Retention (QLD Chapter 7)

**Requirements:**
- Minimum **12 months** retention
- Must be available on-site for inspection
- Digital records acceptable

**App Automatically Maintains:**
- Water test results (all parameters)
- Chemical additions (with costs)
- Lab test certificates (PDF storage)
- Equipment maintenance logs
- Service records with photos
- Incident reports

**Archive Policy:**
- Keep 24 months online (active)
- Archive older data (downloadable)
- Never delete compliance records

### Critical Rules

**14-Day Exclusion Period:**
- Signage required at facility entrances
- App can generate printable signs
- Customer portal can display policy

**Multi-Barrier Treatment:**
- Filtration + Primary disinfection (minimum)
- Secondary disinfection recommended for high-risk
- UV/Ozone for Cryptosporidium protection

### Incident Response (QLD Chapter 9, Appendix 6)

**System Includes Response Protocols:**

**Diarrheal Incident:**
```
CT Value Required: 15,300 mg.min/L
Example: 20 mg/L free chlorine for 13 hours
         OR 10 mg/L for 26 hours

With Cyanuric Acid:
CT Value: 31,500 mg.min/L (double)
Must reduce cyanuric to <15 mg/L first

App provides:
- Step-by-step checklist
- Timer for CT contact time
- Documentation template
```

**Formed Stool/Vomit:**
```
Required: 2 mg/L for 25-30 minutes

App provides:
- Immediate close facility protocol
- Cleanup checklist
- Reopening verification
```

---

## 🧪 **Chemical Cheat Sheet**

### Purpose
Quick reference for technicians - especially helpful for new staff

### Access
**Header Icon:** [🧪 Cheat Sheet] - Always visible, opens modal

### Content Structure

**Format:**
```
Problem → Cause → Solution → Dosage → Retest Time → QLD Target
```

**Examples (Metric - Australia):**

**PH Too High (>7.8):**
```
Cause: Alkaline disinfectant, hard water
Solution: Add hydrochloric acid or sodium bisulfate
Dosage: 100mL per 10,000L to lower by 0.2
Retest: After 30 minutes
QLD Target: 7.2 - 7.8
```

**Chlorine Too Low (<1.0 mg/L):**
```
Cause: High bather load, sunlight, insufficient dosing
Solution: Add liquid chlorine (sodium hypochlorite)
Dosage: 40mL per 10,000L to raise by 1.0 mg/L
Retest: After 15-30 minutes
QLD Target: Min 1.0 mg/L (2.0 with stabilizer)
```

**Bromine Too Low (Spa <6.0 mg/L):**
```
Cause: High usage, insufficient tablets
Solution: Add BCDMH bromine tablets
Dosage: 1 tablet per 500-1000L spa
Retest: After 30 minutes
QLD Target: 6.0 - 8.0 mg/L for spas
```

**Alkalinity Too Low (<80 mg/L):**
```
Cause: Low buffering capacity, acid additions
Solution: Add sodium bicarbonate (bicarb soda)
Dosage: 150g per 10,000L to raise by 10 mg/L
Note: Will also slightly raise PH
QLD Target: 80 - 200 mg/L
```

**Cloudy Water:**
```
Cause: Poor filtration, algae, high bather load
Solution: Backwash filter, check chemistry, shock dose
Steps: 1) Backwash filter  2) Test chlorine/PH  3) Shock if needed
QLD Target: <0.5 NTU turbidity (ideally)
```

**Common Dosages Table:**
```
Chemical            Purpose          Dosage (per 10,000L)
─────────────────────────────────────────────────────────
Soda Ash            Raise PH         50g
Hydrochloric Acid   Lower PH         100mL
Liquid Chlorine     Raise Chlorine   40mL per 1.0 mg/L
Bicarb Soda         Raise Alkalinity 150g
Salt                Raise Salt       3kg per 500 ppm
Calcium Chloride    Raise Calcium    100g per 10 mg/L
Bromine Tablets     Spa Bromine      1 per 500-1000L
```

**Safety Warnings:**
```
⚠️ Always add acid to water, never water to acid
⚠️ Wear PPE when handling chemicals
⚠️ Store chemicals separately (acid + chlorine = toxic gas)
⚠️ Keep SDS sheets accessible
⚠️ Never mix different chemicals together
```

### Imperial Conversion

**If company unit_system = 'imperial':**
```
Dosage: 3.4 oz per 2,641 gal to lower PH by 0.2
        (converts from metric automatically)
```

---

## 🧫 **Laboratory Test System**

### Database Schema

```sql
CREATE TABLE lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Test details
  test_date DATE NOT NULL,
  sample_collection_date DATE,
  test_type TEXT DEFAULT 'microbiological', -- 'microbiological', 'chemical'
  
  -- Laboratory
  lab_name TEXT NOT NULL,
  lab_reference TEXT,
  nata_accredited BOOLEAN DEFAULT false,
  
  -- Microbiological results
  ecoli_result DECIMAL(6,2),
  ecoli_unit TEXT DEFAULT 'CFU/100mL',
  ecoli_pass BOOLEAN,
  
  pseudomonas_result DECIMAL(6,2),
  pseudomonas_unit TEXT DEFAULT 'CFU/100mL',
  pseudomonas_pass BOOLEAN,
  
  hcc_result DECIMAL(6,2),
  hcc_unit TEXT DEFAULT 'CFU/mL',
  hcc_pass BOOLEAN,
  
  -- Chemical results (if applicable)
  chloramines_result DECIMAL(4,2),
  chloramines_unit TEXT DEFAULT 'mg/L',
  chloramines_pass BOOLEAN,
  
  -- Overall
  overall_pass BOOLEAN,
  
  -- Documentation
  certificate_url TEXT, -- Supabase Storage (PDF)
  notes TEXT,
  
  -- Scheduling
  next_test_due DATE, -- Auto-calculated based on risk category
  alert_sent BOOLEAN DEFAULT false,
  
  -- Audit
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lab_tests_unit_id ON lab_tests(unit_id);
CREATE INDEX idx_lab_tests_next_due ON lab_tests(next_test_due);
CREATE INDEX idx_lab_tests_overall_pass ON lab_tests(overall_pass);
```

### Workflow

**1. Sample Collection:**
- Tech collects water sample (proper procedure per QLD guidelines)
- Sends to council lab or NATA-accredited lab

**2. Lab Analysis:**
- Lab tests for E.coli, Pseudomonas, HCC
- Issues certificate with results

**3. Log Results:**
- Owner/admin logs results in app
- Enters values for each parameter
- Uploads certificate PDF
- System auto-calculates next due date

**4. Automated Alerts:**
- 7 days before due: Email/notification reminder
- Day before due: Urgent reminder
- Day after due: Compliance violation alert

**5. Compliance Tracking:**
- All tests shown in compliance dashboard
- Pass/fail history
- Certificate archive
- Next test due dates

### Features

**Certificate Storage:**
- Upload PDF certificates from lab
- Store in Supabase Storage
- Link to property/unit
- Downloadable for inspections
- 12+ month retention automatic

**Next Test Calculation:**
```typescript
// Automatic next test date
if (riskCategory === 'high') {
  nextDue = testDate + 30 days (monthly)
} else if (riskCategory === 'medium' || riskCategory === 'low') {
  nextDue = testDate + 90 days (quarterly)
}
```

**Compliance Integration:**
- Failed lab test → Compliance violation
- Overdue test → Compliance violation
- All tests passing → Green on compliance dashboard

---

## 🧪 **Chemical Cheat Sheet Modal**

### Database Schema

```sql
CREATE TABLE chemical_reference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_code TEXT DEFAULT 'QLD',
  
  -- Problem identification
  problem_type TEXT NOT NULL, -- 'ph_high', 'ph_low', 'chlorine_low', etc.
  problem_title TEXT NOT NULL,
  pool_type TEXT, -- 'pool', 'spa', 'all'
  
  -- Solution
  cause TEXT,
  solution TEXT,
  chemical_name TEXT,
  
  -- Dosage (metric)
  dosage_amount_metric DECIMAL(8,2),
  dosage_unit_metric TEXT, -- 'mL', 'g', 'kg'
  dosage_per_volume_metric INTEGER DEFAULT 10000, -- Per 10,000L
  
  -- Dosage (imperial)
  dosage_amount_imperial DECIMAL(8,2),
  dosage_unit_imperial TEXT, -- 'oz', 'cups', 'lbs'
  dosage_per_volume_imperial INTEGER DEFAULT 2641, -- Per 2,641 gal (10,000L)
  
  -- Additional info
  retest_time_minutes INTEGER,
  notes TEXT,
  safety_warning TEXT,
  
  -- Target ranges
  target_min DECIMAL(6,2),
  target_max DECIMAL(6,2),
  target_unit TEXT,
  
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-populate with QLD guidelines data
```

### Pre-populated Data (QLD)

**Common Problems:**
1. PH Too High (>7.8)
2. PH Too Low (<7.2)
3. Chlorine Too Low (<1.0 mg/L)
4. Chlorine Too High (>10 mg/L)
5. Alkalinity Too Low (<80 mg/L)
6. Alkalinity Too High (>200 mg/L)
7. Combined Chlorine High (>1.0 mg/L)
8. Cloudy Water (turbidity >1.0 NTU)
9. Green Water (algae)
10. Bromine Too Low (spa <6.0 mg/L)
11. Salt Too Low (<2500 ppm)
12. Calcium Too Low/High

### Access & Usage

**Always Available:**
- Header icon [🧪] in all screens
- Mobile + Desktop
- Searchable
- Printable
- Offline accessible (PWA cached)

**Use Cases:**
- New tech unsure what chemical to add
- Experienced tech double-checking dosage
- Training reference
- Field quick-lookup
- Customer questions

---

## 📊 **Compliance Dashboard (Optional View)**

### Access

**Header:** `[📊 Compliance]` ← Click to open

**Permissions:** Owner/Admin only

### Layout

```
┌────────────────────────────────────────────────────────────────────┐
│  📋 QLD Health Compliance Dashboard                                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  🔴 VIOLATIONS (2) - Requires Action                               │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  ⚠️ Sheraton Pool #3 - Free Chlorine: 0.8 mg/L              │ │
│  │  Required: Min 1.0 mg/L (QLD Table A2.1)                     │ │
│  │  Tested: Today 2:45 PM by Sarah                              │ │
│  │  [Resolve] [Assign Tech] [View Details]                      │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  ⚠️ Sea Temple Unit 207 - Bacteria test overdue              │ │
│  │  Due: Jan 5, 2025 (5 days overdue)                           │ │
│  │  [Schedule Lab Test] [Mark Exception]                        │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  📅 UPCOMING REQUIREMENTS (3)                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  • Sheraton Main Pool - Lab test due in 5 days               │ │
│  │  • Sea Temple Kids Pool - Lab test due in 12 days            │ │
│  │  • Corporate Plaza - Weekly water balance check due          │ │
│  │  [Schedule] [View Calendar]                                  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ✅ COMPLIANCE SUMMARY (Last 30 Days)                              │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Water Chemistry: 442/450 tests (98.2%) ✓                    │ │
│  │  Testing Frequency: 100% (all required tests completed)      │ │
│  │  Microbiological: 12/12 passed (100%) ✓                      │ │
│  │  Record Retention: ✓ 12+ months maintained                   │ │
│  │                                                               │ │
│  │  Overall Compliance Score: 98.5% ✓                           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  [Generate Compliance Certificate] [Export Audit Report] [Print]   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Compliance Certificate (Auto-Generated)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUEENSLAND HEALTH COMPLIANCE CERTIFICATE

Property: Sheraton Grand Mirage
Pool: Freshwater Pool (450,000L)
Period: January 2025
Status: ✓ COMPLIANT

Water Quality Standards (QLD Table A2.1):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Free Chlorine:   98.4% within range (1.0-3.0 mg/L)
PH:              100% within range (7.2-7.8)
Total Alkalinity: 100% within range (80-200 mg/L)
Turbidity:       100% within target (<0.5 NTU)

Testing Compliance (QLD Table A2.5):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Required: 3 tests daily (Medium Risk)
Completed: 93/93 tests (100%)

Microbiological Testing (QLD Table A2.6):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
E.coli: <1 CFU/100mL ✓ (Jan 10, 2025)
Pseudomonas: <1 CFU/100mL ✓ (Jan 10, 2025)
HCC: 45 CFU/mL ✓ (Jan 10, 2025)
Next due: April 10, 2025

Record Keeping:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Records maintained: 15 months ✓
Digital backup: ✓
Available for inspection: ✓

Minor Violations (Corrected Same Day):
• Jan 15: Chlorine 0.9 mg/L → Corrected within 1 hour
• Jan 22: PH 8.1 → Corrected within 30 minutes

Facility meets Queensland Health standards for
public aquatic facilities (December 2019)

Generated: January 31, 2025
Manager: Craig Smith
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎯 **Subtle Compliance Indicators (Not Overwhelming)**

### In Service Forms

**Visual Indicators:**
```
PH: [7.4] ✓     ← Green checkmark (within QLD range)
Chlorine: [0.8] ⚠️  ← Yellow warning (hover for tooltip)
Bromine: [15] 🔴   ← Red (critical - requires immediate action)
```

**Tooltip on Hover:**
```
┌─────────────────────────────────────┐
│ Below QLD guideline                 │
│ Required: Min 1.0 mg/L              │
│ Current: 0.8 mg/L                   │
│                                     │
│ Suggested: Add 40mL liquid chlorine │
│ Retest in 30 minutes                │
│                                     │
│ [View Cheat Sheet] [View Guidelines]│
└─────────────────────────────────────┘
```

### On Dashboard

**Clean Summary (Not Scary):**
```
┌────────────────────────────────────────┐
│ Today's Overview                       │
│                                        │
│ Services: 18/24                        │
│ ✓ 98% within QLD guidelines            │
│ Issues: 2 minor ⚠️  [View]            │
│                                        │
│ Compliance: 📊 [View Details]          │
└────────────────────────────────────────┘
```

**NOT like this (overwhelming):**
```
❌ 🚨 CRITICAL COMPLIANCE VIOLATIONS! 🚨
❌ You are in violation of QLD Health regulations!
❌ Immediate action required or facility may be closed!
```

### Smart Alert Logic

```typescript
// Only alert what matters, when it matters

function shouldShowDashboardAlert(service) {
  // Spas: Only equipment issues (bromine handled immediately)
  if (service.unit_type === 'spa') {
    return service.has_equipment_issue
  }
  
  // Pools: Water quality + equipment issues
  if (service.unit_type === 'pool') {
    return service.parameters_out_of_range || service.has_equipment_issue
  }
  
  // Plant rooms: Equipment issues only
  if (service.type === 'plant_room_check') {
    return service.equipment_status !== 'normal'
  }
}
```

---

## 🔄 **Quality Control Review System**

### Database Updates

```sql
ALTER TABLE services 
  ADD COLUMN reviewed_by UUID REFERENCES profiles(id),
  ADD COLUMN reviewed_at TIMESTAMPTZ,
  ADD COLUMN review_notes TEXT,
  ADD COLUMN flagged_for_training BOOLEAN DEFAULT false;

CREATE TABLE training_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id),
  technician_id UUID REFERENCES profiles(id),
  flagged_by UUID REFERENCES profiles(id),
  flag_reason TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Manager Dashboard Section

```
📋 FOR REVIEW - Chemical Adjustments (4 unreviewed)
┌──────────────────────────────────────────────────────────────┐
│  Sheraton Pool #3        2:45 PM  by Sarah     ☐ Review      │
│  PH HIGH (8.2 → 7.4) - Added 100mL acid                      │
│  ✓ Correct dosage for 450,000L pool                          │
│  [✓ Mark Reviewed] [🚩 Flag for Training] [📝 Add Note]      │
├──────────────────────────────────────────────────────────────┤
│  Jones Residence         11:30 AM by Mike      ☐ Review      │
│  Alkalinity LOW (60 → 120) - Added 300g buffer               │
│  ⚠️ May need double-check (large adjustment)                 │
│  [✓ Mark Reviewed] [🚩 Flag for Training] [📝 Add Note]      │
└──────────────────────────────────────────────────────────────┘
```

**Actions:**
- **Mark Reviewed ✓:** Records timestamp, manager name, optional note
- **Flag for Training 🚩:** Creates training task, links to tech, tracks resolution
- **Add Note 📝:** Manager comments for records

### Training Insights

```
📊 Training Insights (Last 30 Days)
┌──────────────────────────────────────────────────────────────┐
│  Tech Performance:                                            │
│  • Sarah: 28/28 correct (100%) ⭐ Excellent                  │
│  • John: 25/26 correct (96%) ✓ Good                          │
│  • Mike: 22/25 correct (88%) ⚠️ Review salt calculations     │
│                                                               │
│  Training Flags:                                              │
│  • Mike: 2 flags (salt dosing) - Training scheduled          │
│                                                               │
│  [View Detailed Performance] [Schedule Training]              │
└──────────────────────────────────────────────────────────────┘
```

---

## 📦 **Complete Database Schema Additions**

```sql
-- ============================================
-- COMPLIANCE & REGULATORY
-- ============================================

-- Jurisdictions
CREATE TABLE compliance_jurisdictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'QLD', 'NSW', 'VIC'
  name TEXT NOT NULL,
  regulatory_body TEXT,
  guidelines_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Requirements per jurisdiction
CREATE TABLE compliance_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID REFERENCES compliance_jurisdictions(id),
  pool_type TEXT NOT NULL, -- 'chlorine', 'bromine'
  risk_category TEXT NOT NULL, -- 'low', 'medium', 'high'
  
  -- Water chemistry limits
  free_chlorine_min DECIMAL(4,1),
  free_chlorine_max DECIMAL(4,1),
  bromine_min DECIMAL(4,1),
  bromine_max DECIMAL(4,1),
  combined_chlorine_max DECIMAL(4,1),
  ph_min DECIMAL(3,1),
  ph_max DECIMAL(3,1),
  alkalinity_min INTEGER,
  alkalinity_max INTEGER,
  turbidity_max DECIMAL(3,1),
  cyanuric_acid_max INTEGER,
  
  -- Microbiological limits
  ecoli_max INTEGER DEFAULT 1,
  pseudomonas_max INTEGER DEFAULT 1,
  hcc_max INTEGER DEFAULT 100,
  
  -- Testing frequencies
  operational_tests_per_day INTEGER, -- 1, 3, or 5
  verification_microbiological_days INTEGER, -- 30 (monthly) or 90 (quarterly)
  verification_chemical_days INTEGER,
  
  -- Record keeping
  record_retention_days INTEGER DEFAULT 365,
  exclusion_period_days INTEGER DEFAULT 14,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-detected violations
CREATE TABLE compliance_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id),
  water_test_id UUID REFERENCES water_tests(id),
  lab_test_id UUID REFERENCES lab_tests(id),
  requirement_id UUID REFERENCES compliance_requirements(id),
  
  violation_type TEXT NOT NULL, -- 'chemistry', 'microbiological', 'frequency', 'overdue_lab_test'
  parameter_name TEXT,
  actual_value DECIMAL(10,2),
  required_min DECIMAL(10,2),
  required_max DECIMAL(10,2),
  
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lab tests (bacteria testing)
CREATE TABLE lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  
  test_date DATE NOT NULL,
  sample_collection_date DATE,
  test_type TEXT DEFAULT 'microbiological',
  
  lab_name TEXT NOT NULL,
  lab_reference TEXT,
  nata_accredited BOOLEAN DEFAULT false,
  
  -- Results
  ecoli_result DECIMAL(6,2),
  ecoli_pass BOOLEAN,
  pseudomonas_result DECIMAL(6,2),
  pseudomonas_pass BOOLEAN,
  hcc_result DECIMAL(6,2),
  hcc_pass BOOLEAN,
  
  overall_pass BOOLEAN,
  certificate_url TEXT,
  notes TEXT,
  next_test_due DATE,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chemical reference (cheat sheet data)
CREATE TABLE chemical_reference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_code TEXT DEFAULT 'QLD',
  problem_type TEXT NOT NULL,
  problem_title TEXT NOT NULL,
  cause TEXT,
  solution TEXT,
  chemical_name TEXT,
  dosage_amount_metric DECIMAL(8,2),
  dosage_unit_metric TEXT,
  retest_time_minutes INTEGER,
  target_min DECIMAL(6,2),
  target_max DECIMAL(6,2),
  safety_warning TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training flags
CREATE TABLE training_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id),
  technician_id UUID REFERENCES profiles(id),
  flagged_by UUID REFERENCES profiles(id),
  flag_reason TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎯 **Updated Feature Priority**

### Must-Have (MVP - Phase 1)
1. ✅ Auth & companies (with timezone, unit system)
2. ✅ Properties & units
3. ✅ Service forms (spa simple, pool guided)
4. ✅ Water testing with QLD ranges
5. ✅ Chemical cheat sheet modal
6. ✅ Basic dashboard

### Important (Phase 2)
7. ✅ Plant room builder (flexible scheduling)
8. ✅ Operations dashboard (real-time)
9. ✅ Review system (quality control)
10. ✅ Booking system (Sea Temple)
11. ✅ Lab test logging

### Nice-to-Have (Phase 3)
12. ✅ Compliance dashboard
13. ✅ Compliance certificates
14. ✅ Time tracking
15. ✅ B2B wholesale
16. ✅ Customer portal

---

## 🎓 **Key Differentiators**

**vs Traditional Pool Software:**
1. 🏆 Built-in QLD Health compliance (automatic)
2. 🏆 Chemical cheat sheet (educational)
3. 🏆 Real-time operations dashboard
4. 🏆 Quality control review system
5. 🏆 Lab test integration
6. 🏆 Flexible scheduling (simple + complex properties)
7. 🏆 Mobile-first with offline capability
8. 🏆 Multi-jurisdiction ready

**Selling Points:**
- "QLD Health compliant by design"
- "Train techs faster with built-in reference"
- "See all pools in real-time"
- "Never miss a bacteria test"
- "Generate compliance certificates automatically"
- "Works in Australia + USA (metric + imperial)"

---

**Ready for final review and approval!** 🚀

