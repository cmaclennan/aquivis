# 📧 Email Setup Guide - Supabase Email Templates

**Purpose:** Configure professional email templates for Aquivis  
**Status:** Required for production

---

## 🎯 Quick Setup (Supabase Dashboard)

### Step 1: Disable Email Confirmation (Development Only)

**For faster development, you can disable email confirmation:**

1. Go to: Supabase Dashboard → Authentication → Providers
2. Click "Email" provider
3. Toggle OFF: "Confirm email"
4. Save

**Result:** Users can sign up and login immediately (no email confirmation)

**⚠️ Important:** Re-enable for production!

---

### Step 2: Configure Email Templates (Production)

**Go to:** Supabase Dashboard → Authentication → Email Templates

**Templates to Configure:**

#### **1. Confirm Signup**

**Subject:** Welcome to Aquivis - Confirm Your Email

**Body (HTML):**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="background-color: #2090c3; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
      <span style="font-size: 40px; color: white;">🌊</span>
    </div>
    <h1 style="color: #2090c3; margin-top: 20px;">Welcome to Aquivis</h1>
    <p style="color: #6b7280;">Professional Pool Service Management</p>
  </div>
  
  <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <h2 style="color: #1f2937; margin-top: 0;">Confirm Your Email Address</h2>
    <p style="color: #4b5563; line-height: 1.6;">
      Thanks for signing up! Click the button below to confirm your email address and activate your account.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background-color: #2090c3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
        Confirm Email Address
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">
      Or copy and paste this URL into your browser:<br>
      <a href="{{ .ConfirmationURL }}" style="color: #2090c3; word-break: break-all;">{{ .ConfirmationURL }}</a>
    </p>
  </div>
  
  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
    <p style="color: #6b7280; font-size: 12px; text-align: center;">
      QLD Health Compliant • Secure • Professional<br>
      © 2025 Aquivis Pool Service Management
    </p>
  </div>
</div>
```

#### **2. Invite User (Team Invitations)**

**Subject:** You've been invited to join {{ .SiteURL }} on Aquivis

**Body:** Similar structure, customize for team invites

#### **3. Magic Link (Passwordless)**

**Subject:** Your Aquivis Sign In Link

**Body:** Customize if using magic links

#### **4. Reset Password**

**Subject:** Reset Your Aquivis Password

**Body:** Customize for password resets

---

## 🔧 Quick Fix for Development

**To skip email confirmation during development:**

### Option 1: Disable Email Confirmation
(See Step 1 above)

### Option 2: Use Email Confirmation but Auto-confirm in Dev

In Supabase Dashboard:
1. Authentication → Settings
2. "Auth Providers" → Email
3. Enable "Enable email confirmations" for production
4. For development, manually confirm users in Authentication → Users → click user → "Confirm email"

---

## 📧 Email Provider Setup (Production)

**For production emails, configure SMTP:**

1. Go to: Project Settings → Auth → SMTP Settings
2. Choose provider:
   - **Resend** (recommended - user already has account)
   - SendGrid
   - AWS SES
   - Custom SMTP

**For Resend:**
- API Key: (user mentioned having Resend in tech stack)
- From Email: noreply@yourdomain.com
- From Name: Aquivis

---

## ✅ Recommended Approach for NOW

**For development speed:**

1. **Disable email confirmation** (Step 1 above)
2. Users can sign up and login immediately
3. Build features faster
4. **Re-enable before production launch**

**For production:**
1. Enable email confirmation
2. Configure email templates (professional HTML)
3. Set up SMTP provider (Resend)
4. Test complete flow

---

**Action Now:** Disable email confirmation in Supabase to continue development, or manually confirm test users.

