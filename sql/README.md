# 🗄️ SQL Scripts & Database Schema

This directory contains all database schema files, migrations, and SQL scripts.

---

## 📋 Main Schema

### **`DATABASE_SCHEMA_COMPLETE.sql`** ⭐
**THE SINGLE SOURCE OF TRUTH for database structure**

- Complete production-ready schema
- All 24 tables, 11 ENUMs, 32 indexes
- RLS policies, triggers, functions
- Pre-populated reference data
- Use this for fresh database setup

**To deploy:**
1. Open Supabase SQL Editor
2. Copy entire file contents
3. Run in one transaction
4. Verify no errors

### Incremental Feature Scripts (apply as needed)
- `ADD_UNIT_TYPE_SPLASH_PARK.sql` — adds `splash_park` to `unit_type` enum
- `CREATE_CUSTOMER_USER_LINKS.sql` — links users to customers; adds `customer_id` to invites
- `CREATE_TEAM_INVITATIONS_TABLE.sql` — team invitations table
- `CREATE_SERVICE_CHEMICALS_AND_PRICEBOOK.sql` — pricebook (`company_chemical_prices`)
- `CREATE_PLANT_ROOMS.sql` — `plant_rooms` and `plant_room_checks`
- `CREATE_EQUIPMENT.sql` — `equipment` and `equipment_maintenance_logs`
  - Ensure columns:
    - `maintenance_scheduled boolean default false`
    - `maintenance_frequency text` (no default)

Notes:
- Apply only once per environment. If an index creation fails due to a missing column, re-run after table alteration; scripts include guards where possible.

---

## 🔧 RLS Policies (Row Level Security)

### **Active/Correct Policies:**
- **`RLS_SIMPLE_AND_CORRECT.sql`** - Correct RLS policies for auth flow
- **`HOTFIX_AUTO_CREATE_PROFILE.sql`** - Auto-profile creation trigger (ACTIVE)

### **Diagnostic Scripts:**
- **`CHECK_CURRENT_POLICIES.sql`** - Check active policies
- **`RLS_DIAGNOSTIC_QUERIES.sql`** - RLS diagnostic queries

### **Archive (Historical Hotfixes):**
These were applied during development but are now superseded by the main schema:
- `FIX_RLS_COMPANIES_FINAL.sql`
- `HOTFIX_COMPANIES_SELECT_FINAL.sql`
- `HOTFIX_RLS_ALL_TABLES.sql`
- `HOTFIX_RLS_COMPANIES.sql`
- `HOTFIX_RLS_DEVELOPMENT_MODE.sql` (NEVER USE - was rejected)
- `HOTFIX_RLS_PROFILES.sql`
- `HOTFIX_RLS_PROFILES_COMPLETE.sql`
- `RLS_POLICIES_CORRECT.sql`

---

## 🚨 Important Notes

### **Fresh Database Setup:**
Use only: `DATABASE_SCHEMA_COMPLETE.sql`

### **Existing Database Updates:**
1. Check `ISSUE_LOG.md` first
2. Use specific hotfix scripts if needed
3. Always test in development first
4. Update `ISSUE_LOG.md` with results

### **RLS Policy Changes:**
1. Read `docs/RLS_STRATEGY.md` first
2. Test with actual user flows
3. Never disable RLS in production
4. Document changes in `ISSUE_LOG.md`

---

## 📖 Related Documentation

- **`docs/DATABASE_DEPLOYMENT_GUIDE.md`** - Deployment instructions
- **`docs/DATABASE_ENUMS_REFERENCE.md`** - ENUM values reference
- **`docs/DATABASE_VALIDATION.md`** - Schema validation
- **`docs/RLS_STRATEGY.md`** - RLS design principles
- **`docs/ISSUE_LOG.md`** - Known issues and fixes

---

## 🔄 Schema Updates

When modifying the schema:
1. Update `DATABASE_SCHEMA_COMPLETE.sql`
2. Update `docs/DATABASE_ENUMS_REFERENCE.md` (if ENUMs changed)
3. Test deployment on clean database
4. Update affected forms in `/app`
5. Document in `docs/ISSUE_LOG.md`
6. Commit with clear message

---

**Last Schema Update:** 2025-01-10  
**Schema Version:** 1.0  
**Tables:** 24 | **ENUMs:** 11 | **Indexes:** 32 | **RLS Policies:** 28+

### Recent Feature Adds
- 2025-10: Plant rooms, equipment maintenance, schedule rules, templates

---

## ▶️ Apply Order (incremental scripts)

Recommended order when applying feature scripts to an existing database:

1. CREATE_PLANT_ROOMS.sql
2. CREATE_EQUIPMENT.sql
3. ALTER_EQUIPMENT_EXTENSIONS.sql
4. CREATE_EQUIPMENT_CHECKS.sql
5. CREATE_JOBS.sql
6. CREATE_SCHEDULE_TEMPLATES_TABLE.sql (if not already applied)
7. ENHANCED_SCHEDULING_SYSTEM.sql / APPLY_ENHANCED_SCHEDULING.sql (if used)
8. RLS_NEW_TABLES_MINIMAL.sql (see below)

Notes:
- Scripts are defensive where possible (IF NOT EXISTS guards), but still apply in order to satisfy FKs and indexes.
- Always run in a transaction on staging first.

## ⏪ Rollback Notes (high-level)

- CREATE_PLANT_ROOMS.sql: drop table plant_room_checks; drop table plant_rooms;
- CREATE_EQUIPMENT.sql: drop table equipment_maintenance_logs; drop table equipment;
- ALTER_EQUIPMENT_EXTENSIONS.sql: alter table equipment drop column(s) added if safe; consider data impact first;
- CREATE_EQUIPMENT_CHECKS.sql: drop table equipment_checks;
- CREATE_JOBS.sql: drop table jobs;
- CREATE_SCHEDULE_TEMPLATES_TABLE.sql: drop table schedule_templates;

In production, prefer forward fix scripts over destructive rollbacks; take backups before structural changes.

## 🔐 RLS for New Tables

Apply `RLS_NEW_TABLES_MINIMAL.sql` to enable minimal row-level security for:
- plant_rooms, plant_room_checks
- equipment, equipment_maintenance_logs, equipment_checks
- jobs

### Notes
- Equipment maintenance tasks in the app are generated only when `maintenance_scheduled = true` and `maintenance_frequency` is set. Update existing rows accordingly after applying schema.

Scope is company-bound via joins to `properties.company_id` where applicable, or explicit `company_id` on `jobs`.

