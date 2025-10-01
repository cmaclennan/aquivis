# 🗄️ Database Deployment Guide

**File to Deploy:** `DATABASE_SCHEMA_COMPLETE.sql`  
**Target:** Supabase Remote Instance  
**Time Required:** 2-3 minutes

---

## 📋 Step-by-Step Instructions

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Log in with your account
3. Select project: **krxabrdizqbpitpsvgiv**

### Step 2: Open SQL Editor
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New Query"** button (top right)

### Step 3: Copy Database Schema
1. Open file: `C:\aquivis\DATABASE_SCHEMA_COMPLETE.sql` (in your editor)
2. Select ALL (Ctrl+A)
3. Copy (Ctrl+C)

### Step 4: Execute Schema
1. Paste into Supabase SQL Editor (Ctrl+V)
2. Click **"Run"** button (bottom right corner)
3. Wait for execution (should take 30-60 seconds)

### Step 5: Verify Success
You should see output like:
```
Success. No rows returned
```

If you see errors, STOP and share them with me.

### Step 6: Verify Tables Created
1. Click **"Table Editor"** in left sidebar
2. You should see **24 tables:**
   - bookings
   - billing_reports
   - chemical_additions
   - chemical_reference
   - companies
   - compliance_jurisdictions
   - compliance_requirements
   - compliance_violations
   - customer_access
   - customers
   - equipment
   - equipment_checks
   - lab_tests
   - maintenance_tasks
   - plant_rooms
   - profiles
   - properties
   - service_photos
   - services
   - time_entries
   - training_flags
   - units
   - water_tests
   - wholesale_pickups

### Step 7: Verify Data Pre-populated
1. Click on **"compliance_jurisdictions"** table
2. Should see 1 row: Queensland, Australia
3. Click on **"compliance_requirements"** table
4. Should see 4 rows (QLD requirements for different risk levels)
5. Click on **"chemical_reference"** table
6. Should see 6+ rows (cheat sheet data)

---

## ✅ Success Criteria

**All of these should be true:**
- ✅ 24 tables exist
- ✅ No SQL errors
- ✅ QLD compliance data present (1 jurisdiction, 4 requirements)
- ✅ Chemical reference data present (6+ entries)
- ✅ All tables have RLS enabled (check Table Editor - should see 🔒 icons)

---

## ⚠️ If You See Errors

**Common Issues:**

**1. "syntax error near..."**
- Copy the ENTIRE file (check you didn't miss the beginning or end)
- Make sure you're pasting into a NEW query, not an existing one

**2. "relation already exists"**
- Tables already created (someone ran it before)
- Either:
  - Drop all tables first (risky)
  - Or skip this step (schema already deployed)

**3. "permission denied"**
- Make sure you're logged in as owner
- Check project permissions

**4. "function auth.uid() does not exist"**
- Supabase auth not enabled
- Go to Authentication → Enable

---

## 📸 Screenshot Checklist

After deployment, you can verify by:
1. Table Editor shows 24 tables
2. Any table shows 🔒 icon (RLS enabled)
3. compliance_jurisdictions has data
4. No error messages in SQL editor

---

**Ready to deploy?** Follow the steps above, then let me know if you encounter any issues!

