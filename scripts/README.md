# 🛠️ Utility Scripts

This directory contains diagnostic, testing, and utility scripts for development.

---

## 🔍 Diagnostic Scripts

### **`diagnose-rls.js`**
Check current RLS policies on database
```bash
node scripts/diagnose-rls.js
```

### **`test-rls-policies.ts`**
Test RLS policies and database state
```bash
npx tsx scripts/test-rls-policies.ts
```

---

## 🧪 Testing Scripts

### **`test-onboarding-flow.js`**
Test complete user onboarding flow
```bash
node scripts/test-onboarding-flow.js
```

### **`test-user-flow.ts`**
Test user authentication flow
```bash
npx tsx scripts/test-user-flow.ts
```

---

## 🔧 Database Fix Scripts

### **`apply-rls-postgres.js`** ⭐
Apply RLS fixes directly via PostgreSQL connection
```bash
# Set database password first
$env:DATABASE_URL="postgresql://postgres:[PASSWORD]@db.krxabrdizqbpitpsvgiv.supabase.co:5432/postgres"
node scripts/apply-rls-postgres.js
```

### **`apply-rls-fix.ts`**
Apply RLS fixes via Supabase client
```bash
npx tsx scripts/apply-rls-fix.ts
```

### **`apply-fix-now.js`**
Alternative RLS fix approach
```bash
node scripts/apply-fix-now.js
```

### **`fix-rls-direct.js`**
Direct RLS fix via REST API
```bash
node scripts/fix-rls-direct.js
```

---

## 📋 Prerequisites

### **Node.js Scripts (.js)**
No additional setup required
```bash
node scripts/[script-name].js
```

### **TypeScript Scripts (.ts)**
Requires tsx (already installed)
```bash
npx tsx scripts/[script-name].ts
```

### **Environment Variables**
Some scripts require:
- `DATABASE_URL` - PostgreSQL connection string
- Or service role key in script (for admin operations)

---

## 🚨 Safety Notes

### **Production Use:**
- ⚠️ Most scripts use SERVICE ROLE KEY (bypasses RLS)
- ⚠️ Test in development environment first
- ⚠️ Never expose service role key in commits
- ⚠️ Scripts contain hardcoded credentials for dev only

### **Script Categories:**
- **Diagnostic:** Safe to run anytime
- **Testing:** Safe to run anytime
- **Database Fixes:** Use with caution, test first

---

## 📖 Related Documentation

- **`docs/ISSUE_LOG.md`** - When these scripts were used
- **`docs/SUPABASE_CLI_SETUP.md`** - CLI setup for alternative approach
- **`sql/`** - SQL scripts these may execute

---

## 🔄 Adding New Scripts

When adding new scripts:
1. Use clear, descriptive names
2. Add header comment explaining purpose
3. Update this README
4. Include error handling
5. Add to `.gitignore` if contains sensitive data

---

**Last Updated:** 2025-10-01

