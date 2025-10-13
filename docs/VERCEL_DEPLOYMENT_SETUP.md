# 🚀 Vercel Deployment Setup Guide

**Issue**: Build failing due to missing Supabase environment variables  
**Error**: `@supabase/ssr: Your project's URL and API key are required to create a Supabase client!`  
**Solution**: Configure environment variables in Vercel dashboard

---

## 🔧 Required Environment Variables

### **Essential Variables (Required for Build)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
```

### **Email Functionality (Required for Team Invitations)**
```env
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=noreply@aquivis.app
```

### **Optional Variables (Recommended)**
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here
```

---

## 📋 Step-by-Step Setup

### **1. Get Supabase Credentials**

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to API Settings**
   - Go to: Settings → API
   - Copy the following values:
     - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
     - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

3. **Get Resend API Key (for Email Functionality)**
   - Visit: https://resend.com/api-keys
   - Sign up/Login to Resend
   - Create a new API key
   - Copy the key → `RESEND_API_KEY`

### **2. Configure Vercel Environment Variables**

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your `aquivis` project

2. **Navigate to Settings**
   - Click on your project
   - Go to: Settings → Environment Variables

3. **Add Each Variable**
   - Click "Add New"
   - Add each variable with these settings:
     - **Environment**: Production, Preview, Development (select all)
     - **Value**: Your actual values from Supabase

### **3. Required Variables to Add**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://krxabrdizqbpitpsvgiv.supabase.co` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Your Supabase anon key |
| `NEXT_PUBLIC_APP_URL` | `https://aquivis.vercel.app` | Your Vercel app URL |
| `RESEND_API_KEY` | `re_...` | Your Resend API key for emails |
| `EMAIL_FROM` | `noreply@aquivis.app` | Email sender address |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Your Supabase service role key (optional) |

### **4. Redeploy After Adding Variables**

1. **Trigger New Deployment**
   - Go to: Deployments tab
   - Click "Redeploy" on the latest deployment
   - Or push a new commit to trigger automatic deployment

---

## 🔍 Verification Steps

### **1. Check Environment Variables**
- Go to Vercel Dashboard → Project → Settings → Environment Variables
- Verify all required variables are present
- Ensure they're enabled for Production environment

### **2. Monitor Build Logs**
- Go to Deployments tab
- Click on the latest deployment
- Check build logs for any remaining errors

### **3. Test Application**
- Visit your deployed app URL
- Test key functionality:
  - User signup/login
  - Dashboard access
  - Database operations

---

## 🚨 Common Issues & Solutions

### **Issue 1: Still Getting Supabase Error**
**Solution**: 
- Double-check variable names (case-sensitive)
- Ensure variables are enabled for Production environment
- Redeploy after adding variables

### **Issue 2: Build Succeeds but App Doesn't Work**
**Solution**:
- Check browser console for client-side errors
- Verify `NEXT_PUBLIC_APP_URL` matches your actual Vercel URL
- Test database connectivity

### **Issue 3: Environment Variables Not Loading**
**Solution**:
- Variables starting with `NEXT_PUBLIC_` are available to client-side
- Variables without `NEXT_PUBLIC_` are server-side only
- Redeploy after any environment variable changes

---

## 📱 Vercel Dashboard Navigation

### **Finding Environment Variables**
1. Vercel Dashboard → Your Project
2. Settings (top navigation)
3. Environment Variables (left sidebar)

### **Adding New Variables**
1. Click "Add New"
2. Enter Name and Value
3. Select Environments (Production, Preview, Development)
4. Click "Save"

### **Redeploying**
1. Deployments tab
2. Click "..." on latest deployment
3. Select "Redeploy"

---

## 🔐 Security Notes

### **Public Variables (NEXT_PUBLIC_*)**
- Visible to client-side code
- Safe to expose: URLs, public API keys
- **Never expose**: Service role keys, secrets

### **Private Variables**
- Only available server-side
- Use for: Database service keys, API secrets
- **Example**: `SUPABASE_SERVICE_ROLE_KEY` (without NEXT_PUBLIC_)

---

## 🎯 Expected Result

After configuring environment variables:

✅ **Build Status**: Successful  
✅ **Deployment**: Complete  
✅ **Application**: Functional  
✅ **Database**: Connected  
✅ **Authentication**: Working  

---

## 📞 Support

If you continue to have issues:

1. **Check Vercel Build Logs** for specific error messages
2. **Verify Supabase Project** is active and accessible
3. **Test Environment Variables** are correctly set
4. **Redeploy** after any changes

---

## 🔗 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Environment Variables Guide**: https://vercel.com/docs/concepts/projects/environment-variables

---

*Last Updated: January 13, 2025*
