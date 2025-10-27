# 🔴 CRITICAL: Vercel Environment Variables Setup

## The Problem
The NextAuth API endpoints are returning 500 errors because **NEXTAUTH_SECRET** and **NEXTAUTH_URL** are not set in Vercel's environment variables.

**Important:** `.env.production` file is a LOCAL file and is NOT used by Vercel. You must set environment variables directly in Vercel's dashboard.

## Step-by-Step Setup

### 1. Go to Vercel Project Settings
Navigate to: **https://vercel.com/cmaclennan/aquivis/settings/environment-variables**

### 2. Add NEXTAUTH_URL
- **Name:** `NEXTAUTH_URL`
- **Value:** `https://www.aquivis.co`
- **Environments:** Check all (Production, Preview, Development)
- Click **Save**

### 3. Add NEXTAUTH_SECRET
- **Name:** `NEXTAUTH_SECRET`
- **Value:** `b7c721f0605d84e196f83330b211d4c6650df68ed1d6e6c0a3ac233f22991138`
- **Environments:** Check all (Production, Preview, Development)
- Click **Save**

### 4. Redeploy
1. Go to: **https://vercel.com/cmaclennan/aquivis/deployments**
2. Find the latest deployment (should show "Failed" or "Error")
3. Click the **"..."** menu
4. Select **"Redeploy"**
5. Wait 2-3 minutes for deployment to complete

### 5. Test
Go to: **https://www.aquivis.co/login**

You should see:
- ✅ Login form loads without errors
- ✅ No "Failed to execute 'json' on 'Response'" errors
- ✅ Can attempt to log in

## Verification
After setting the variables, you can verify they're set by:
1. Going to the Environment Variables page
2. You should see both `NEXTAUTH_URL` and `NEXTAUTH_SECRET` listed

## If Still Getting 500 Errors
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Wait 5 minutes for Vercel to fully deploy
4. Check that BOTH variables are set in ALL environments

## Why This Matters
- `NEXTAUTH_URL`: Tells NextAuth what the production URL is
- `NEXTAUTH_SECRET`: Used to sign and verify JWT tokens
- Without these, NextAuth cannot initialize and returns 500 errors

