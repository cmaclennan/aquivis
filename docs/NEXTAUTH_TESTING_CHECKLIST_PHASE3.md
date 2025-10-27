# NextAuth.js Testing Checklist - Phase 3

**Status:** Ready for Testing
**URL:** https://www.aquivis.co
**Date:** 2025-10-21

---

## 🧪 TEST 1: Regular User Login

### Steps:
1. Go to https://www.aquivis.co/login
2. Enter a regular user's email and password
3. Click "Sign In"

### Expected Results:
- [ ] Login succeeds (no error message)
- [ ] Redirects to `/dashboard`
- [ ] Dashboard loads with data
- [ ] Sidebar shows user info
- [ ] Can see property count (not 0)

### What to Check:
- [ ] Browser DevTools → Application → Cookies
  - Should see `next-auth.session-token` cookie
  - Cookie should NOT disappear after 1 second
  - Cookie should persist across page refreshes

---

## 🧪 TEST 2: Super Admin Login

### Steps:
1. Go to https://www.aquivis.co/super-admin-login
2. Enter super admin email and password
3. Click "Sign in as Super Admin"

### Expected Results:
- [ ] Login succeeds
- [ ] Redirects to `/super-admin`
- [ ] Super admin dashboard loads
- [ ] Can see admin controls

### What to Check:
- [ ] Session cookie present
- [ ] Cookie persists across navigation

---

## 🧪 TEST 3: Customer Portal Login

### Steps:
1. Go to https://www.aquivis.co/customer-portal/login
2. Enter customer email and password
3. Click "Sign In"

### Expected Results:
- [ ] Login succeeds
- [ ] Redirects to `/customer-portal`
- [ ] Customer portal loads
- [ ] Can see customer-specific content

---

## 🧪 TEST 4: Session Persistence

### Steps:
1. Log in as regular user
2. Navigate to different pages (properties, services, etc.)
3. Refresh the page
4. Go back to dashboard

### Expected Results:
- [ ] Stay logged in after navigation
- [ ] Stay logged in after page refresh
- [ ] No redirect to login
- [ ] Session cookie persists

### Critical Check:
- [ ] **Cookie does NOT disappear after 1 second** (this was the main issue!)

---

## 🧪 TEST 5: Role-Based Access Control

### Steps:
1. Log in as regular user
2. Try to access `/super-admin` directly
3. Log out and log in as super admin
4. Try to access `/dashboard` (regular user area)

### Expected Results:
- [ ] Regular user redirected away from `/super-admin`
- [ ] Super admin redirected away from regular `/dashboard`
- [ ] Each user can only access their authorized area

---

## 🧪 TEST 6: Logout

### Steps:
1. Log in as regular user
2. Click logout button
3. Try to access `/dashboard`

### Expected Results:
- [ ] Logout succeeds
- [ ] Redirected to `/login`
- [ ] Cannot access protected routes
- [ ] Session cookie cleared

---

## 🧪 TEST 7: Already Logged In Redirect

### Steps:
1. Log in as regular user
2. Go to `/login` page directly
3. Log in as super admin
4. Go to `/super-admin-login` page directly

### Expected Results:
- [ ] Regular user redirected from `/login` to `/dashboard`
- [ ] Super admin redirected from `/super-admin-login` to `/super-admin`

---

## 🧪 TEST 8: Unauthenticated Access

### Steps:
1. Open new incognito/private window
2. Try to access `/dashboard` directly
3. Try to access `/super-admin` directly
4. Try to access `/customer-portal` directly

### Expected Results:
- [ ] Redirected to `/login` for dashboard routes
- [ ] Redirected to `/super-admin-login` for super-admin routes
- [ ] Redirected to `/customer-portal/login` for customer portal routes

---

## 🧪 TEST 9: Data Loading

### Steps:
1. Log in as regular user
2. Go to dashboard
3. Wait for data to load
4. Check property count, services, etc.

### Expected Results:
- [ ] Dashboard shows actual data (not 0)
- [ ] RPC functions work correctly
- [ ] Data loads without errors
- [ ] No console errors

---

## 🧪 TEST 10: Browser Console

### Steps:
1. Open DevTools (F12)
2. Go to Console tab
3. Log in and navigate around
4. Check for errors

### Expected Results:
- [ ] No auth-related errors
- [ ] No "Not authenticated" errors
- [ ] No cookie-related errors
- [ ] No session errors

---

## 📋 Summary Checklist

- [ ] Regular user login works
- [ ] Super admin login works
- [ ] Customer portal login works
- [ ] Session persists across navigation
- [ ] Session persists after page refresh
- [ ] **Cookies do NOT disappear after 1 second** ⭐
- [ ] Role-based access control works
- [ ] Logout works
- [ ] Already logged in redirect works
- [ ] Unauthenticated access redirects correctly
- [ ] Data loads on dashboard
- [ ] No console errors

---

## 🚨 If Something Fails

### Common Issues:

**Issue: "Can't log in"**
- Check browser console for errors
- Check Vercel deployment status
- Verify environment variables are set in Vercel

**Issue: "Cookies disappear after 1 second"**
- This was the original issue - should be FIXED now
- If still happening, check middleware configuration

**Issue: "Redirected to login after navigation"**
- Check if session cookie is persisting
- Check middleware configuration
- Check layout auth checks

**Issue: "Data shows 0 on dashboard"**
- Check if RPC function is getting auth context
- Check Supabase logs
- Verify user has company_id

---

## 📞 Next Steps

1. **Test all scenarios above**
2. **Report any failures** with:
   - What you were trying to do
   - What happened instead
   - Browser console errors (if any)
   - Network tab errors (if any)

3. **If all tests pass:**
   - Proceed to Phase 4 (Production Deployment)
   - Set environment variables in Vercel
   - Deploy to production

---

## ✅ Success Criteria

**All tests pass = Auth system is FIXED! 🎉**

The main issue was cookies disappearing after 1 second. If cookies now persist across navigation and page refreshes, the problem is solved.

