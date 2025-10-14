# 🔑 ENVIRONMENT VARIABLES SETUP GUIDE

**Date:** 2025-01-14  
**Purpose:** Get all required keys and URLs for .env and Vercel setup

---

## 🎯 **REQUIRED ENVIRONMENT VARIABLES**

You need these 4 environment variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Email Configuration  
RESEND_API_KEY=re_your-api-key-here
EMAIL_FROM=noreply@aquivis.app
```

---

## 🔧 **HOW TO GET SUPABASE VALUES**

### **Step 1: Access Supabase Dashboard**
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your Aquivis project

### **Step 2: Get Project URL**
1. Go to **Settings** → **API**
2. Copy the **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
3. This becomes: `NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co`

### **Step 3: Get Anon Key**
1. In the same **Settings** → **API** page
2. Copy the **anon public** key (starts with `eyJ...`)
3. This becomes: `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`

---

## 📧 **HOW TO GET RESEND VALUES**

### **Step 1: Access Resend Dashboard**
1. Go to [resend.com](https://resend.com)
2. Sign in to your account

### **Step 2: Get API Key**
1. Go to **API Keys** section
2. Create a new API key or copy existing one
3. Copy the key (starts with `re_...`)
4. This becomes: `RESEND_API_KEY=re_...`

### **Step 3: Set Email From Address**
- Use: `EMAIL_FROM=noreply@aquivis.app`
- Or use your own domain: `EMAIL_FROM=noreply@yourdomain.com`

---

## 📁 **CREATE .env.local FILE**

Create a file called `.env.local` in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here

# Email Configuration
RESEND_API_KEY=your-actual-resend-api-key-here
EMAIL_FROM=noreply@aquivis.app
```

**Important:** Replace the placeholder values with your actual values!

---

## 🚀 **VERCEL ENVIRONMENT VARIABLES**

### **Step 1: Go to Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Navigate to your Aquivis project
3. Go to **Settings** → **Environment Variables**

### **Step 2: Add Each Variable**
For each variable:
1. Click **Add New**
2. **Name:** `NEXT_PUBLIC_SUPABASE_URL`
3. **Value:** Your actual Supabase URL
4. **Environment:** Select all (Production, Preview, Development)
5. Click **Save**

Repeat for all 4 variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RESEND_API_KEY`
- `EMAIL_FROM`

---

## 🧪 **TEST YOUR SETUP**

### **Local Testing:**
1. Create `.env.local` with your values
2. Run `npm run dev`
3. Visit `http://localhost:3001/test-env`
4. Check that all variables show "✅ Set"

### **Vercel Testing:**
1. Add variables to Vercel
2. Trigger new deployment
3. Visit `https://your-project.vercel.app/test-env`
4. Check that all variables show "✅ Set"

---

## 🚨 **COMMON ISSUES**

### **Issue 1: Wrong Supabase Project**
- Make sure you're using the correct Supabase project
- Check that the URL matches your project

### **Issue 2: Missing NEXT_PUBLIC_ Prefix**
- Supabase variables MUST start with `NEXT_PUBLIC_`
- This makes them available on the client side

### **Issue 3: Wrong Environment Scope**
- Set variables for Production, Preview, AND Development
- Don't just set for one environment

### **Issue 4: Copy-Paste Errors**
- Double-check that you copied the full key
- Make sure there are no extra spaces or characters

---

## 📋 **CHECKLIST**

### **Supabase Setup:**
- [ ] Have Supabase account and project
- [ ] Copied Project URL from Settings → API
- [ ] Copied anon public key from Settings → API
- [ ] Verified URL format: `https://xxx.supabase.co`

### **Resend Setup:**
- [ ] Have Resend account
- [ ] Created or copied API key
- [ ] Verified key format: `re_...`

### **Local Environment:**
- [ ] Created `.env.local` file
- [ ] Added all 4 variables with correct values
- [ ] Tested locally with `/test-env` route

### **Vercel Environment:**
- [ ] Added all 4 variables to Vercel
- [ ] Set for all environments (Production, Preview, Development)
- [ ] Triggered new deployment
- [ ] Tested on Vercel with `/test-env` route

---

## 🎯 **SUCCESS CRITERIA**

**Setup Complete When:**
- [ ] All 4 variables show "✅ Set" on `/test-env`
- [ ] No 404 errors on basic routes
- [ ] Application loads and functions correctly
- [ ] Authentication works properly

---

**Once you have these values, the 404 error should be resolved!**
