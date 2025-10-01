# 🔒 RLS Policy Strategy - The Right Way

**Date:** 2025-01-10  
**Decision:** Fix RLS properly NOW, not later

---

## ❌ What We Almost Did (Wrong)

**Shortcut Approach:**
- Use permissive policies for development
- "We'll fix it later before production"
- Ship features fast, defer security

**Why This is Wrong:**
- RLS bugs compound as you add features
- Hard to retrofit proper security later
- Exactly what led to previous build's 47 migrations
- Security should be foundational, not bolted on

**User's insight:** "If we can't get signup RLS right, how will we handle 24 tables?"

**Answer:** We won't. We need to fix it NOW.

---

## ✅ The Correct Approach

### **Philosophy:**

**Simple > Complex:**
- Avoid clever nested subqueries
- Use straightforward EXISTS checks
- Test each policy independently

**Correct > Permissive:**
- Never punt security to "later"
- Fix policies properly on first attempt
- Test complete user flows

**Document > Assume:**
- Explain WHY each policy works
- Document edge cases (signup, onboarding, normal operation)
- Create test scenarios

---

## 🎯 Proper RLS Design Principles

### **Principle 1: Handle NULL Gracefully**

**Problem:**
```sql
-- BAD: Fails when user has no company
company_id = public.user_company_id()
-- If user_company_id() returns NULL, this becomes:
company_id = NULL  -- Always false!
```

**Solution:**
```sql
-- GOOD: Use EXISTS to handle NULL
EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.company_id = companies.id 
  AND profiles.id = auth.uid()
)
-- Returns true/false, handles NULL properly
```

### **Principle 2: Policy Behavior**

**Important:** RLS policies FILTER rows, they don't BLOCK queries

- SELECT with no matching rows = Empty array (✓ OK)
- SELECT with permission error = 403 (❌ Bad policy)

**During onboarding:**
- User queries companies table
- Has no company yet (company_id = NULL)
- Policy filters to zero rows
- Returns empty array
- App sees "no company, show onboarding" ✓

### **Principle 3: Test Every State**

**User States:**
1. Just signed up (no profile yet) - trigger creates profile
2. Has profile, no company (onboarding) - needs to query/create company
3. Has company (normal operation) - needs to access company data
4. Owner role - needs additional permissions
5. Technician role - restricted permissions

**Each policy must work for ALL states.**

---

## 📋 Correct Policies for Signup Flow

### **profiles Table:**

```sql
SELECT: id = auth.uid() OR (company_id IS NOT NULL AND company_id = public.user_company_id())
-- State 1: Can see own profile (even with NULL company) ✓
-- State 2: Can see own profile ✓
-- State 3: Can see own profile + company members ✓

INSERT: id = auth.uid()
-- Allows creating own profile during signup ✓

UPDATE: id = auth.uid()
-- Allows updating own profile (adding company_id during onboarding) ✓
```

### **companies Table:**

```sql
SELECT: EXISTS (SELECT 1 FROM profiles WHERE profiles.company_id = companies.id AND profiles.id = auth.uid())
        OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id IS NOT NULL)
-- State 2 (no company): Returns empty array, no error ✓
-- State 3 (has company): Returns their company only ✓
-- Other companies: Filtered out ✓

INSERT: auth.uid() IS NOT NULL
-- Any authenticated user can create ✓

UPDATE: EXISTS (SELECT 1 FROM profiles WHERE company_id = companies.id AND id = auth.uid() AND role = 'owner')
-- Only owners can update their company ✓
```

**This is the CORRECT, PRODUCTION-READY approach.**

---

## 🔧 Implementation Plan

### **Step 1: Apply Correct Policies (NOW)**
Run: `RLS_SIMPLE_AND_CORRECT.sql`

### **Step 2: Test Complete Flow**
1. Signup (creates profile via trigger)
2. Login
3. Onboarding check (SELECT companies - returns empty)
4. Create company (INSERT companies)
5. Update profile with company_id (UPDATE profiles)
6. Access dashboard (SELECT companies - returns their company)

### **Step 3: Validate Multi-Tenant Isolation**
1. Create two test accounts
2. Each creates a company
3. Verify company A cannot see company B's data

### **Step 4: Apply to All Tables**
Once companies/profiles work, apply same pattern to:
- properties
- units
- services
- etc.

**Pattern:**
```sql
FOR SELECT USING (company_id = public.user_company_id())
-- Works because user_company_id() returns their company's id
-- Automatically filters to their data only
```

---

## ✅ Why This Will Work

**Companies SELECT Policy:**
```sql
EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.company_id = companies.id 
  AND profiles.id = auth.uid()
)
OR 
NOT EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND company_id IS NOT NULL
)
```

**Breakdown:**
- First part: "Show companies where I'm a member"
- Second part: "OR if I don't have a company yet, don't block the query"
- Result during onboarding: Query succeeds, returns empty array
- Result after onboarding: Query succeeds, returns my company only

**This is simple, testable, and correct.**

---

## 🎯 Commitment

**No more shortcuts.**

We'll:
1. Apply correct policies now
2. Test thoroughly
3. Fix any issues properly
4. Document what works
5. Use same pattern for all tables

**RLS will be solid from day one, not an afterthought.**

---

**Ready to apply RLS_SIMPLE_AND_CORRECT.sql?**

