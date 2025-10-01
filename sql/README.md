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

