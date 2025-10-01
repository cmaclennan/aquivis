# 🔍 Authentication Flow Analysis

**Purpose:** Systematically trace the complete auth flow and determine EXACTLY what RLS policies are needed  
**Date:** 2025-01-10

---

## 📋 The Complete Flow (Step by Step)

### **Step 1: User Signs Up**

**User Action:** Fills out signup form, clicks "Create Account"

**What Happens:**
```typescript
// app/(auth)/signup/page.tsx
supabase.auth.signUp({
  email,
  password,
  options: { data: { first_name, last_name } }
})
```

**Supabase Does:**
1. Creates record in `auth.users` table (system table)
2. Stores email, password hash, metadata (first_name, last_name)

**Database Trigger Fires:**
```sql
-- HOTFIX_AUTO_CREATE_PROFILE.sql (we created this)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Trigger Function:**
```sql
INSERT INTO public.profiles (id, email, first_name, last_name, role)
VALUES (
  NEW.id,
  NEW.email,
  COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
  COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
  'owner'
);
```

**RLS Check:**
- ❓ Does profiles INSERT policy allow this?
- ✅ YES: Trigger runs as SECURITY DEFINER (bypasses RLS)

**Result:**
- ✅ auth.users created (id: user-uuid-123)
- ✅ profiles created (id: user-uuid-123, company_id: NULL, role: 'owner')

---

### **Step 2: User Redirected to Onboarding**

**What Happens:**
```typescript
// app/(auth)/signup/page.tsx
router.push('/onboarding')
```

**User State:**
- Has auth.users record ✅
- Has profiles record (company_id = NULL) ✅
- Not assigned to any company yet

---

### **Step 3: Onboarding Page Loads**

**What Happens:**
```typescript
// app/(auth)/onboarding/page.tsx (client component)
// No database queries on page load
// Just shows business type selection form
```

**RLS Check:** None (no queries yet)

**Result:** Page renders ✅

---

### **Step 4: User Selects Business Type**

**User Action:** Clicks "Both Residential & Commercial", clicks "Continue"

**What Happens:**
```typescript
// Local state only
setBusinessType('both')
setStep(2)
```

**RLS Check:** None

**Result:** Shows Step 2 (company details form) ✅

---

### **Step 5: User Creates Company**

**User Action:** Enters company name, clicks "Complete Setup"

**What Happens:**
```typescript
// app/(auth)/onboarding/page.tsx
const { data: company, error } = await supabase
  .from('companies')
  .insert({
    name: companyName,
    business_type: businessType,
    phone: phone,
    timezone: 'Australia/Brisbane',
    // ... other fields
  })
  .select()
  .single()
```

**RLS Check - THIS IS WHERE IT FAILS:**

**INSERT Policy Required:**
- Policy: `companies_insert_auth`
- Logic: `WITH CHECK (auth.uid() IS NOT NULL)`
- Current user: auth.uid() = user-uuid-123 ✅
- Should allow: YES ✅

**But ERROR occurs:** "new row violates row-level security policy"

**Why?**
Let me check the actual INSERT policy...

**WAIT - I need to verify what's ACTUALLY in the database, not what I think I created.**

---

## 🔍 Current Policies (From Your Verification)

**Companies policies you showed:**
```
companies_insert_auth: INSERT, qual: null
companies_select_member: SELECT, qual: (EXISTS ...)
companies_update_owner: UPDATE, qual: (EXISTS ...)
```

**Issue:** `qual: null` for INSERT

In PostgreSQL policies:
- `qual` = USING clause (for SELECT, UPDATE, DELETE)
- `with_check` = WITH CHECK clause (for INSERT, UPDATE)

**The verification query doesn't show WITH CHECK!**

Let me query differently to see the actual INSERT constraint...

---

## 🎯 The Real Problem

**I think the INSERT policy isn't being evaluated correctly.**

**Let me check:** Is the INSERT policy actually using WITH CHECK or USING?

```sql
CREATE POLICY "companies_insert_auth" ON companies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  --      ^^^^^^^^^^^ This is correct syntax
```

**But maybe PostgreSQL is interpreting it differently?**

---

## 🔧 Solution: Verify What's Actually There

**Run this in Supabase to see the ACTUAL policy:**

```sql
SELECT 
  polname as policy_name,
  polcmd as command,
  pg_get_expr(polqual, polrelid) as using_expression,
  pg_get_expr(polwithcheck, polrelid) as with_check_expression
FROM pg_policy 
JOIN pg_class ON pg_policy.polrelid = pg_class.oid
WHERE polrelid = 'companies'::regclass;
```

This will show us the actual WITH CHECK expression.

---

## 💡 My Hypothesis

**I think:** The INSERT policy might be missing the WITH CHECK entirely, or it's evaluating something else.

**Let me create a VERIFIED, TESTED policy:**

```sql
-- Drop and recreate with absolutely certain syntax
DROP POLICY IF EXISTS "companies_insert_auth" ON companies;

CREATE POLICY "companies_insert_authenticated" ON companies
  AS PERMISSIVE -- Explicitly permissive
  FOR INSERT 
  TO public -- For all roles
  WITH CHECK (
    auth.uid() IS NOT NULL -- User must be authenticated
  );
```

**This is the simplest possible INSERT policy that should work.**

---

**Can you run that verification query above to see what's actually in the database?** Then we'll know what we're really dealing with.

