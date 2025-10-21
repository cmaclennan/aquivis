# ✅ Quick Fix Checklist - Critical Issues
**Date:** 2025-01-20  
**Priority:** IMMEDIATE  
**Print this and check off as you complete each step**

---

## 🔴 CRITICAL FIX #1: Rotate Exposed Credentials (30 min)

### Supabase Anon Key
- [ ] Go to https://supabase.com/dashboard
- [ ] Navigate to: Aquivis-Beta project → Settings → API
- [ ] Click "Rotate" on Anon Key
- [ ] Copy new anon key
- [ ] Update `.env.local` file locally
- [ ] Update Vercel environment variable: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Test application still works locally
- [ ] Redeploy to Vercel

### Resend API Key
- [ ] Go to https://resend.com/api-keys
- [ ] Delete old key: `re_4iiLMnUg_JNpvJ5dAdRKvxvhpAiEmg3Po`
- [ ] Create new API key
- [ ] Copy new key
- [ ] Update `.env.local` file locally
- [ ] Update Vercel environment variable: `RESEND_API_KEY`
- [ ] Test email sending works

### Update Template File
- [ ] Open `env-template.txt`
- [ ] Replace all actual values with placeholders
- [ ] Commit and push changes
- [ ] Verify no credentials in file

**Verification:**
- [ ] Application works with new keys
- [ ] No credentials visible in repository
- [ ] Vercel deployment successful

---

## 🔴 CRITICAL FIX #2: Authentication Loop (2-3 hours)

### Step 1: Create Server Action
- [ ] Create file: `app/(auth)/login/actions.ts`
- [ ] Copy server action code from implementation plan
- [ ] Add 'use server' directive
- [ ] Import required dependencies
- [ ] Test file compiles without errors

### Step 2: Update Login Page
- [ ] Open `app/(auth)/login/page.tsx`
- [ ] Import `loginAction` from `./actions`
- [ ] Replace form submission with server action
- [ ] Add error state handling
- [ ] Add hidden redirect field
- [ ] Test file compiles without errors

### Step 3: Test Login Flow
- [ ] Clear all browser cookies
- [ ] Navigate to `/login`
- [ ] Enter valid credentials
- [ ] Click "Sign In"
- [ ] **Verify:** Redirected to `/dashboard`
- [ ] Click "Customers" link
- [ ] **Verify:** Navigate to `/customers` (NO redirect to login)
- [ ] Click "Properties" link
- [ ] **Verify:** Navigate to `/properties` (NO redirect to login)
- [ ] Click "Services" link
- [ ] **Verify:** Navigate to `/services` (NO redirect to login)

### Step 4: Test Customer Portal Login
- [ ] Logout completely
- [ ] Navigate to `/customer-portal/login`
- [ ] Enter customer credentials
- [ ] Click "Sign In"
- [ ] **Verify:** Redirected to `/customer-portal`
- [ ] Refresh page
- [ ] **Verify:** Stay on `/customer-portal` (NO redirect)

### Step 5: Test Super Admin Login
- [ ] Logout completely
- [ ] Navigate to `/super-admin-login`
- [ ] Enter super admin credentials
- [ ] Click "Sign In"
- [ ] **Verify:** Redirected to `/super-admin`
- [ ] Refresh page
- [ ] **Verify:** Stay on `/super-admin` (NO redirect)

**Verification:**
- [ ] All three login flows work
- [ ] No redirect loops
- [ ] Navigation works after login
- [ ] Session persists across page refreshes

---

## 🟡 HIGH PRIORITY FIX #3: Logout Route (15 min)

### Update Logout Route
- [ ] Open `app/logout/route.ts`
- [ ] Add `request: Request` parameter to GET function
- [ ] Replace hardcoded URL with dynamic URL
- [ ] Save file

### Test Logout
- [ ] Login to application
- [ ] Navigate to `/logout`
- [ ] **Verify:** Redirected to `/login` on localhost (dev)
- [ ] **Verify:** URL is `http://localhost:3000/login` (not production URL)
- [ ] Try to access `/dashboard`
- [ ] **Verify:** Redirected to `/login`

**Verification:**
- [ ] Logout works in development
- [ ] Logout redirects to correct environment
- [ ] Cannot access protected routes after logout

---

## 🟡 HIGH PRIORITY FIX #4: Customer Portal Auth (30 min)

### Step 1: Update Middleware
- [ ] Open `middleware.ts`
- [ ] Add `/customers` to protected routes (line ~69)
- [ ] Add `/customer-portal` to protected routes (line ~70)
- [ ] Remove `/customer-portal` from public routes
- [ ] Keep `/customer-portal/login` in public routes
- [ ] Save file

### Step 2: Create Customer Portal Layout
- [ ] Create file: `app/customer-portal/layout.tsx`
- [ ] Copy layout code from implementation plan
- [ ] Add auth check
- [ ] Add navigation header
- [ ] Save file

### Step 3: Test Customer Portal Protection
- [ ] Logout completely
- [ ] Try to access `/customer-portal` directly
- [ ] **Verify:** Redirected to `/customer-portal/login`
- [ ] Login as customer
- [ ] **Verify:** Access to `/customer-portal` granted
- [ ] Refresh page
- [ ] **Verify:** Stay on `/customer-portal`

**Verification:**
- [ ] Customer portal requires authentication
- [ ] Proper redirect to customer login
- [ ] Layout displays correctly
- [ ] Logout link works

---

## 🟢 MEDIUM PRIORITY FIX #5: Add /customers Route (5 min)

### Update Middleware
- [ ] Open `middleware.ts`
- [ ] Verify `/customers` in protected routes list
- [ ] (Already done in Fix #4)

**Verification:**
- [ ] `/customers` requires authentication
- [ ] Redirect to login if not authenticated

---

## 📋 FINAL VERIFICATION CHECKLIST

### Authentication
- [ ] Normal login works (staff/owners)
- [ ] Customer portal login works
- [ ] Super admin login works
- [ ] No redirect loops after login
- [ ] Navigation works after login
- [ ] Session persists across refreshes

### Security
- [ ] All credentials rotated
- [ ] No credentials in repository
- [ ] Customer portal protected
- [ ] All protected routes require auth

### Functionality
- [ ] Logout works in all environments
- [ ] Dashboard loads correctly
- [ ] All navigation links work
- [ ] No console errors

### Deployment
- [ ] All changes committed
- [ ] Pull request created
- [ ] Code reviewed
- [ ] Deployed to staging
- [ ] Staging tested
- [ ] Deployed to production
- [ ] Production tested

---

## 🚀 DEPLOYMENT STEPS

### Pre-Deployment
- [ ] Create feature branch: `fix/critical-auth-issues`
- [ ] Commit all changes
- [ ] Push to GitHub
- [ ] Create pull request

### Staging Deployment
- [ ] Merge to staging branch
- [ ] Deploy to staging environment
- [ ] Run full test suite on staging
- [ ] Verify all fixes work on staging

### Production Deployment
- [ ] Merge to main branch
- [ ] Deploy to production
- [ ] Monitor Sentry for errors
- [ ] Test production login flows
- [ ] Verify no authentication loops

### Post-Deployment
- [ ] Monitor error rates (target: < 1%)
- [ ] Check login success rates (target: > 99%)
- [ ] Verify user feedback is positive
- [ ] Update documentation

---

## 📊 SUCCESS CRITERIA

### Must Have (Before Deployment)
- ✅ All credentials rotated
- ✅ Authentication loop fixed
- ✅ Logout works in all environments
- ✅ Customer portal protected
- ✅ All tests passing

### Should Have (Within 24 Hours)
- ✅ Zero authentication loop reports
- ✅ Login success rate > 99%
- ✅ Sentry error rate < 1%
- ✅ User feedback positive

### Nice to Have (Within 1 Week)
- ✅ Performance optimizations verified
- ✅ Customer portal features enhanced
- ✅ Rate limiting implemented
- ✅ Session management improved

---

## 🆘 ROLLBACK PLAN

If critical issues occur after deployment:

### Immediate Rollback
1. [ ] Revert to previous Vercel deployment
2. [ ] Notify users of temporary issue
3. [ ] Investigate error logs in Sentry
4. [ ] Fix issues in development
5. [ ] Re-test thoroughly
6. [ ] Re-deploy when ready

### Partial Rollback
1. [ ] Identify which fix caused issue
2. [ ] Revert only that specific change
3. [ ] Keep other fixes in place
4. [ ] Fix problematic change
5. [ ] Re-deploy fixed version

---

## 📞 CONTACTS

### If Issues Occur
- **Sentry Dashboard:** https://sentry.io
- **Vercel Dashboard:** https://vercel.com
- **Supabase Dashboard:** https://supabase.com
- **GitHub Repository:** https://github.com/cmaclennan/aquivis

### Support Resources
- **Implementation Plan:** `docs/CRITICAL_FIXES_IMPLEMENTATION_PLAN.md`
- **Full Review:** `docs/COMPREHENSIVE_APP_REVIEW_2025-01-20.md`
- **Executive Summary:** `docs/EXECUTIVE_SUMMARY_APP_REVIEW.md`

---

**Checklist Created:** 2025-01-20  
**Estimated Time:** 4-6 hours  
**Priority:** 🔴 IMMEDIATE - START NOW

---

## ✅ COMPLETION SIGN-OFF

- [ ] All critical fixes completed
- [ ] All tests passing
- [ ] Deployed to production
- [ ] Verified working in production
- [ ] Documentation updated
- [ ] Team notified

**Completed By:** ___________________  
**Date:** ___________________  
**Time:** ___________________  
**Sign-off:** ___________________

