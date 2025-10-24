# AUTH FIX TESTING CHECKLIST

**Branch:** `fix/complete-nextauth-migration`  
**Date:** 2025-10-21  
**Status:** Ready for Testing

---

## WHAT WAS FIXED

### Root Cause
The dashboard 307 redirect loop was caused by:
1. **Dual auth system conflict** - NextAuth and Supabase Auth running simultaneously
2. **Server component cookie access issue** - `auth()` in layouts couldn't reliably access cookies
3. **Incomplete migration** - SessionTimeoutHandler, logout, and onboarding still used Supabase Auth

### The Solution
- **Moved all auth checks to middleware** - Middleware has reliable cookie access in Edge Runtime
- **Pass user data via headers** - Layouts read from headers instead of calling `auth()`
- **Removed all Supabase Auth usage** - Only NextAuth for authentication now
- **Added SessionProvider** - For client-side session access via `useSession()`

---

## TESTING INSTRUCTIONS

### Prerequisites
1. Make sure you have valid test credentials:
   - Regular user: `craig.maclennan@gmail.com` / `password`
   - Super admin: (your super admin credentials)

### Local Testing (RECOMMENDED FIRST)

#### 1. Start Development Server
```bash
cd c:\aquivis
git checkout fix/complete-nextauth-migration
npm run dev
```

#### 2. Test Regular User Login Flow
- [ ] Navigate to `http://localhost:3000/login`
- [ ] Enter email and password
- [ ] Click "Sign In"
- [ ] **EXPECTED:** Redirect to `/dashboard` (NO 307 loop)
- [ ] **EXPECTED:** Dashboard displays with your company name and user info
- [ ] **EXPECTED:** Sidebar shows all navigation links
- [ ] **EXPECTED:** No console errors

#### 3. Test Dashboard Access While Logged In
- [ ] Click on "Properties" in sidebar
- [ ] **EXPECTED:** Properties page loads
- [ ] Click on "Customers" in sidebar
- [ ] **EXPECTED:** Customers page loads
- [ ] Navigate directly to `http://localhost:3000/dashboard`
- [ ] **EXPECTED:** Dashboard loads (no redirect)

#### 4. Test Logout
- [ ] Click the logout icon in sidebar (bottom right)
- [ ] **EXPECTED:** Redirect to `/login`
- [ ] Try to access `http://localhost:3000/dashboard`
- [ ] **EXPECTED:** Redirect to `/login` (protected route)

#### 5. Test Login Page While Logged In
- [ ] Log in again
- [ ] Navigate to `http://localhost:3000/login`
- [ ] **EXPECTED:** Redirect to `/dashboard` (already authenticated)

#### 6. Test Super Admin Login
- [ ] Log out if logged in
- [ ] Navigate to `http://localhost:3000/super-admin-login`
- [ ] Enter super admin credentials
- [ ] Click "Sign in as Super Admin"
- [ ] **EXPECTED:** Redirect to `/super-admin`
- [ ] **EXPECTED:** Super admin dashboard loads

#### 7. Test Customer Portal Login
- [ ] Log out if logged in
- [ ] Navigate to `http://localhost:3000/customer-portal/login`
- [ ] Enter customer credentials
- [ ] Click "Sign In"
- [ ] **EXPECTED:** Redirect to `/customer-portal`
- [ ] **EXPECTED:** Customer portal loads

#### 8. Test Onboarding (if you have a user without company_id)
- [ ] Log in with a user that has no `company_id`
- [ ] **EXPECTED:** Redirect to `/onboarding`
- [ ] Fill out company details
- [ ] Click "Complete Setup"
- [ ] **EXPECTED:** Company created in database
- [ ] **EXPECTED:** Redirect to `/dashboard`

#### 9. Test Session Persistence
- [ ] Log in
- [ ] Refresh the page (F5)
- [ ] **EXPECTED:** Still logged in, no redirect
- [ ] Close browser tab
- [ ] Open new tab and navigate to `http://localhost:3000/dashboard`
- [ ] **EXPECTED:** Still logged in (session persists)

#### 10. Test Invalid Credentials
- [ ] Navigate to `/login`
- [ ] Enter invalid email/password
- [ ] Click "Sign In"
- [ ] **EXPECTED:** Error message displayed
- [ ] **EXPECTED:** Stay on login page

---

### Production Testing (After Local Tests Pass)

#### 1. Deploy to Vercel Preview
```bash
git push origin fix/complete-nextauth-migration
```

Wait for Vercel to deploy the preview. You'll get a URL like:
`https://aquivis-git-fix-complete-nextauth-migration-yourteam.vercel.app`

#### 2. Test on Preview Deployment
Repeat ALL the tests above on the preview URL instead of localhost.

**Critical checks:**
- [ ] Login works (no 307 loop)
- [ ] Dashboard loads after login
- [ ] Logout works
- [ ] Session persists across page refreshes
- [ ] Protected routes redirect to login when not authenticated

#### 3. Check Vercel Logs
- [ ] Open Vercel Dashboard → Your Project → Logs
- [ ] Filter for errors
- [ ] **EXPECTED:** No auth-related errors
- [ ] **EXPECTED:** No 307 redirects to `/login` after successful login

---

## WHAT TO LOOK FOR

### ✅ SUCCESS INDICATORS
- Login redirects to dashboard immediately (no loop)
- Dashboard displays user data correctly
- Sidebar navigation works
- Logout clears session and redirects to login
- Protected routes redirect to login when not authenticated
- Session persists across page refreshes
- No console errors
- No 307 redirects in Network tab after login

### ❌ FAILURE INDICATORS
- 307 redirect loop after login
- Dashboard shows "Loading..." forever
- Console errors about session or auth
- Logout doesn't clear session
- Can access protected routes without login
- Session lost on page refresh

---

## ROLLBACK PLAN (If Testing Fails)

If any critical issues are found:

### Option 1: Fix Forward (Minor Issues)
If it's a small bug (e.g., typo, missing check):
1. Identify the issue
2. Make the fix on the branch
3. Push and re-test

### Option 2: Revert to Main (Major Issues)
If the fix doesn't work at all:
```bash
git checkout main
git push origin main --force
```

This will revert production to the previous state.

### Option 3: Implement Option B (Revert to Supabase)
If NextAuth is fundamentally broken:
1. Follow the "Option B" plan in `AUTH_FIX_PLAN.md`
2. Remove NextAuth entirely
3. Fix original Supabase Auth issues

---

## MERGE TO PRODUCTION (After All Tests Pass)

Once ALL tests pass on both local and preview:

```bash
git checkout main
git merge fix/complete-nextauth-migration
git push origin main
```

Vercel will automatically deploy to production.

---

## MONITORING AFTER DEPLOYMENT

### First 30 Minutes
- [ ] Check Vercel logs for errors
- [ ] Check Sentry for new errors
- [ ] Test login yourself on production
- [ ] Monitor user reports

### First 24 Hours
- [ ] Check Sentry error rate
- [ ] Check Vercel analytics for 307 redirects
- [ ] Monitor user feedback

---

## CONTACT

If you encounter any issues during testing:
1. Take screenshots of errors
2. Copy console logs
3. Copy Network tab (especially 307 redirects)
4. Note the exact steps to reproduce

This will help debug any remaining issues quickly.

---

## CONFIDENCE LEVEL

**95%** - This fix addresses the root cause with a proven architecture pattern.

The 5% uncertainty is due to:
- NextAuth v5 being in beta
- Next.js 15 being very new
- Potential edge cases we haven't encountered

However, the architecture is sound and the build passes all checks.

