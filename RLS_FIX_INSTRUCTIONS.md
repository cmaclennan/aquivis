# 🔧 RLS Companies Policy - Final Fix Instructions

**Status:** Ready to apply  
**Issue:** 403 Forbidden when trying to SELECT/INSERT companies during onboarding  
**Root Cause:** RLS SELECT policy doesn't account for users without a company_id yet

---

## 🎯 What This Fixes

### Current State (Broken):
1. User signs up ✅
2. Profile created with `company_id = NULL` ✅
3. User goes to onboarding page
4. App tries `SELECT * FROM companies`
5. **RLS blocks it** ❌ (403 Forbidden)
6. Can't proceed to create company

### After Fix:
1. User signs up ✅
2. Profile created with `company_id = NULL` ✅
3. User goes to onboarding page
4. App tries `SELECT * FROM companies`
5. **RLS allows it** ✅ (returns empty array)
6. App sees no companies, shows create form
7. User creates company ✅
8. User updates profile with company_id ✅
9. Complete! ✅

---

## 📋 Steps to Apply

### 1. Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/krxabrdizqbpitpsvgiv
2. Click **SQL Editor** in left sidebar
3. Click **+ New query**

### 2. Run the Fix SQL

Copy and paste the entire contents of:
```
FIX_RLS_COMPANIES_FINAL.sql
```

Click **Run** (or press `Ctrl+Enter`)

### 3. Verify It Worked

Run this verification query:
```sql
SELECT 
    policyname,
    cmd as "Command",
    qual as "USING Clause"
FROM pg_policies
WHERE tablename = 'companies'
ORDER BY policyname;
```

**You should see:**
- `companies_select_policy` - Has OR clause for NULL company_id
- `companies_insert_policy` - Allows authenticated users
- `companies_update_policy` - Owners only
- `companies_delete_policy` - Owners only

### 4. Test the Flow

1. Log out of the app (if logged in)
2. Go to: http://localhost:3000/signup
3. Create a new test account
4. Should redirect to onboarding automatically
5. Should see "Create Your Company" form
6. Fill it out and submit
7. Should successfully create company ✅

---

## 🔍 What Changed

### Old SELECT Policy (Broken):
```sql
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.company_id = companies.id
    AND profiles.id = auth.uid()
  )
)
```
❌ **Problem:** Only allows users who already have company_id → Blocks onboarding!

### New SELECT Policy (Fixed):
```sql
FOR SELECT USING (
  -- User is member of this company
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.company_id = companies.id
    AND profiles.id = auth.uid()
  )
  OR
  -- User has NO company yet (onboarding)
  (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id IS NULL
    )
  )
)
```
✅ **Solution:** Allows both existing members AND users without a company

---

## 🧪 Testing Checklist

After applying the fix, test these scenarios:

- [ ] New user can sign up
- [ ] New user redirected to onboarding
- [ ] Onboarding page loads without 403 error
- [ ] User can create company
- [ ] User redirected to dashboard after company creation
- [ ] Dashboard shows company name
- [ ] User can log out and log back in
- [ ] Returning user goes straight to dashboard (not onboarding)

---

## 📝 Notes

- This uses **explicit NULL check** instead of `NOT EXISTS` for clarity
- Policy is permissive during onboarding but strict after
- Once user has company_id, they can only see their own company
- Service role key still bypasses all RLS (for admin operations)

---

## 🚨 If It Still Doesn't Work

If you still get 403 after applying this:

1. Run the verification query above and share results
2. Check browser console for exact error message
3. Run this diagnostic:
   ```sql
   SELECT id, email, company_id FROM profiles WHERE email = 'YOUR_EMAIL';
   ```
4. Verify RLS is enabled on companies table:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'companies';
   ```
   (Should show `rowsecurity = true`)

---

**Ready to apply?** Copy `FIX_RLS_COMPANIES_FINAL.sql` into Supabase SQL Editor and run it!

