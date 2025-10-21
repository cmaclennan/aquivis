# Authentication System - Testing Checklist

## 🧪 QUICK TEST PROCEDURE

### Prerequisites
- [ ] Clear all cookies for aquivis.co
- [ ] Open DevTools (F12)
- [ ] Go to Application → Cookies tab

---

## ✅ TEST CASE 1: Normal Login

**Steps:**
1. Go to https://www.aquivis.co/login
2. Enter test credentials
3. Click "Sign In"

**Expected Results:**
- [ ] No error message
- [ ] Redirected to /dashboard
- [ ] Auth cookies appear in DevTools
- [ ] Dashboard loads successfully

**Cookies to Look For:**
- `sb-krxabrdizqbpitpsvgiv-auth-token`
- `sb-krxabrdizqbpitpsvgiv-auth-token-code-verifier`

---

## ✅ TEST CASE 2: Session Persistence

**Steps:**
1. After successful login, click links to navigate:
   - Click "Properties"
   - Click "Services"
   - Click "Dashboard"
   - Click "Settings"

**Expected Results:**
- [ ] No redirects to login
- [ ] All pages load successfully
- [ ] Cookies remain in DevTools
- [ ] Session persists across navigation

---

## ✅ TEST CASE 3: Customer Portal Login

**Steps:**
1. Go to https://www.aquivis.co/customer-portal/login
2. Enter customer credentials
3. Click "Sign In"

**Expected Results:**
- [ ] Redirected to /customer-portal
- [ ] Customer portal loads
- [ ] Auth cookies present
- [ ] Can navigate within portal

---

## ✅ TEST CASE 4: Super Admin Login

**Steps:**
1. Go to https://www.aquivis.co/super-admin-login
2. Enter super admin credentials
3. Click "Sign In"

**Expected Results:**
- [ ] Redirected to /super-admin
- [ ] Super admin dashboard loads
- [ ] Auth cookies present
- [ ] Can navigate within super admin

---

## ✅ TEST CASE 5: Protected Route Access

**Steps:**
1. Clear cookies
2. Try to access https://www.aquivis.co/dashboard directly

**Expected Results:**
- [ ] Redirected to /login
- [ ] No infinite loop
- [ ] Login page loads normally

---

## ✅ TEST CASE 6: Logout

**Steps:**
1. After login, click "Logout"
2. Try to access /dashboard

**Expected Results:**
- [ ] Redirected to /login
- [ ] Auth cookies removed
- [ ] Cannot access protected routes

---

## ✅ TEST CASE 7: Session Timeout

**Steps:**
1. Log in successfully
2. Wait for session timeout (or manually trigger)
3. Try to navigate to a page

**Expected Results:**
- [ ] Redirected to /login with timeout message
- [ ] Can log in again
- [ ] No errors

---

## 🔍 DEBUGGING TIPS

### If Login Fails:
1. Check browser console for errors
2. Check Vercel function logs
3. Verify Supabase credentials in .env.local
4. Check Supabase auth configuration

### If Session Doesn't Persist:
1. Check DevTools → Application → Cookies
2. Verify cookies have correct domain
3. Check cookie attributes (Secure, HttpOnly, SameSite)
4. Check Vercel logs for errors

### If Infinite Redirect Loop:
1. Clear all cookies
2. Hard refresh (Ctrl+Shift+R)
3. Check middleware logs
4. Check layout component logs

---

## 📊 EXPECTED BEHAVIOR

| Action | Expected | Status |
|--------|----------|--------|
| Login | Redirect to dashboard | ✅ |
| Navigate | No redirect | ✅ |
| Cookies | Persist across requests | ✅ |
| Logout | Redirect to login | ✅ |
| Protected route | Redirect to login if no session | ✅ |
| Session timeout | Redirect to login with message | ✅ |

---

## 🎯 SUCCESS CRITERIA

All of the following must be true:

- [ ] Can log in successfully
- [ ] Redirected to correct page after login
- [ ] Can navigate between pages without redirect
- [ ] Cookies visible in DevTools
- [ ] Cookies persist across navigation
- [ ] Can log out successfully
- [ ] Cannot access protected routes without login
- [ ] No infinite redirect loops
- [ ] No console errors

---

## 📝 NOTES

- Tests should be done in incognito/private mode for clean state
- Test on both desktop and mobile if possible
- Test in different browsers if possible
- Check both aquivis.co and www.aquivis.co domains


