# Vercel Environment Variables Setup

**Status:** REQUIRED - Must be done before NextAuth works
**URL:** https://vercel.com/cmaclennan/aquivis/settings/environment-variables

---

## 🔧 Required Environment Variables

You need to add these 2 variables to Vercel:

### 1. NEXTAUTH_URL
- **Name:** `NEXTAUTH_URL`
- **Value:** `https://www.aquivis.co`
- **Environments:** Production, Preview, Development

### 2. NEXTAUTH_SECRET
- **Name:** `NEXTAUTH_SECRET`
- **Value:** `b7c721f0605d84e196f83330b211d4c6650df68ed1d6e6c0a3ac233f22991138`
- **Environments:** Production, Preview, Development

---

## 📋 Step-by-Step Instructions

### Step 1: Go to Vercel Settings
1. Open https://vercel.com/cmaclennan/aquivis/settings/environment-variables
2. You should see a form to add environment variables

### Step 2: Add NEXTAUTH_URL
1. Click "Add New" or the input field
2. **Name:** `NEXTAUTH_URL`
3. **Value:** `https://www.aquivis.co`
4. **Environments:** Check all (Production, Preview, Development)
5. Click "Save"

### Step 3: Add NEXTAUTH_SECRET
1. Click "Add New" or the input field
2. **Name:** `NEXTAUTH_SECRET`
3. **Value:** `b7c721f0605d84e196f83330b211d4c6650df68ed1d6e6c0a3ac233f22991138`
4. **Environments:** Check all (Production, Preview, Development)
5. Click "Save"

### Step 4: Redeploy
1. Go to https://vercel.com/cmaclennan/aquivis/deployments
2. Find the latest deployment
3. Click the "..." menu
4. Click "Redeploy"
5. Wait for deployment to complete

---

## ✅ Verification

After setting the variables and redeploying:

1. Go to https://www.aquivis.co/login
2. Check browser console (F12)
3. Should NOT see 500 errors
4. Should see login form working

---

## 🚨 If Still Getting 500 Errors

1. **Check Vercel logs:**
   - Go to https://vercel.com/cmaclennan/aquivis/deployments
   - Click on the latest deployment
   - Click "Logs" tab
   - Look for error messages

2. **Common issues:**
   - Variable name typo (must be exact: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`)
   - Value copied incorrectly
   - Deployment not redeployed after adding variables

3. **Solution:**
   - Double-check variable names and values
   - Redeploy the project
   - Wait 2-3 minutes for deployment to complete
   - Clear browser cache (Ctrl+Shift+Delete)
   - Try again

---

## 📝 Notes

- These variables are sensitive - don't share them publicly
- The NEXTAUTH_SECRET is used to sign JWT tokens
- NEXTAUTH_URL must match the production domain exactly
- All 3 environments (Production, Preview, Development) should have these variables

---

## 🔗 Useful Links

- Vercel Settings: https://vercel.com/cmaclennan/aquivis/settings/environment-variables
- Vercel Deployments: https://vercel.com/cmaclennan/aquivis/deployments
- NextAuth Docs: https://next-auth.js.org/deployment

