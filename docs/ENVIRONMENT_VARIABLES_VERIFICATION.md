# 🔧 Environment Variables Verification Guide

**Issue**: 404 NOT_FOUND errors likely caused by missing environment variables  
**Solution**: Comprehensive verification and setup guide

---

## 🚨 **Critical Issue**

The 404 error is most likely caused by **missing environment variables in Vercel**. The middleware is trying to create a Supabase client but failing because the environment variables are not configured.

---

## 📋 **Required Environment Variables**

### **Essential Variables (Must Have)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://krxabrdizqbpitpsvgiv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_APP_URL=https://www.aquivis.co
```

### **Email Functionality (Recommended)**
```env
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=noreply@aquivis.app
```

### **Optional Variables**
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here
```

---

## 🔍 **Step-by-Step Verification**

### **Step 1: Get Supabase Credentials**

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to API Settings**
   - Go to: Settings → API
   - Copy these values:
     - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
     - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (optional)

### **Step 2: Configure Vercel Environment Variables**

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

### **Step 3: Required Variables to Add**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://krxabrdizqbpitpsvgiv.supabase.co` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Your Supabase anon key |
| `NEXT_PUBLIC_APP_URL` | `https://www.aquivis.co` | Your Vercel app URL |
| `RESEND_API_KEY` | `re_...` | Your Resend API key for emails |
| `EMAIL_FROM` | `noreply@aquivis.app` | Email sender address |

### **Step 4: Redeploy After Adding Variables**

1. **Trigger New Deployment**
   - Go to: Deployments tab
   - Click "Redeploy" on the latest deployment
   - Or push a new commit to trigger automatic deployment

---

## 🧪 **Testing the Fix**

### **Test 1: Root Path**
- Visit: `https://www.aquivis.co/`
- **Expected**: Homepage loads successfully
- **If 404**: Environment variables still not configured

### **Test 2: Login Page**
- Visit: `https://www.aquivis.co/login`
- **Expected**: Login form loads
- **If 404**: Middleware or environment issue

### **Test 3: Protected Route**
- Visit: `https://www.aquivis.co/dashboard`
- **Expected**: Redirects to login (if not authenticated)
- **If 404**: Middleware issue

---

## 🔍 **Troubleshooting**

### **If Still Getting 404 After Adding Variables**

1. **Check Variable Names**
   - Ensure exact spelling: `NEXT_PUBLIC_SUPABASE_URL`
   - Case-sensitive: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - No extra spaces or characters

2. **Check Environment Scope**
   - Variables must be enabled for **Production** environment
   - Preview and Development are optional but recommended

3. **Check Variable Values**
   - Supabase URL should start with `https://`
   - Anon key should start with `eyJ`
   - No quotes around values

4. **Redeploy After Changes**
   - Environment variable changes require redeployment
   - Go to Deployments → Redeploy

### **Common Issues**

| Issue | Solution |
|-------|----------|
| Variable not found | Check spelling and case |
| Still getting 404 | Redeploy after adding variables |
| Supabase errors | Verify API keys are valid |
| Build fails | Check variable format |

---

## 📊 **Verification Checklist**

### **Environment Variables**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] `NEXT_PUBLIC_APP_URL` is set
- [ ] All variables enabled for Production
- [ ] No typos in variable names
- [ ] Values are correct and complete

### **Supabase Configuration**
- [ ] Project is active
- [ ] API keys are valid
- [ ] Database is accessible
- [ ] RLS policies are configured

### **Vercel Configuration**
- [ ] Environment variables are set
- [ ] Variables are enabled for Production
- [ ] Deployment completed successfully
- [ ] No build errors

---

## 🎯 **Expected Results**

After properly configuring environment variables:

✅ **Homepage loads** - `https://www.aquivis.co/` works  
✅ **Login page accessible** - `/login` loads properly  
✅ **No more 404 errors** - All routes resolve correctly  
✅ **Authentication working** - Middleware functions properly  
✅ **Database connected** - Supabase client initializes successfully  

---

## 🚀 **Quick Fix Summary**

1. **Get Supabase credentials** from dashboard
2. **Add environment variables** to Vercel
3. **Redeploy** the application
4. **Test** the homepage and login page

**This should resolve the 404 error completely!**

---

## 📞 **Support**

If you continue to have issues:

1. **Check Vercel Function Logs** for specific error messages
2. **Verify Supabase Project** is active and accessible
3. **Test Environment Variables** are correctly set
4. **Redeploy** after any changes

---

*Last Updated: January 13, 2025*
