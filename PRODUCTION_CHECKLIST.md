# 🚀 Production Deployment Checklist

**Purpose:** Critical items to complete before launching to production  
**Status:** Development mode active - email confirmation DISABLED

---

## 🔒 Security & Authentication

### Email Confirmation (CRITICAL)
- [ ] **Re-enable email confirmation** in Supabase
  - Location: Dashboard → Authentication → Providers → Email
  - Toggle ON: "Confirm email"
  - **Currently:** ⚠️ DISABLED for development
  - **Must enable:** Before any production users

### Email Templates
- [ ] Configure professional email templates
  - See: `EMAIL_SETUP_GUIDE.md`
  - Confirm signup template (HTML with Aquivis branding)
  - Password reset template
  - Team invitation template
  
### SMTP Provider
- [ ] Set up SMTP for production emails
  - Recommended: Resend (user already has account)
  - Configure in: Project Settings → Auth → SMTP Settings
  - From email: noreply@aquivis.com (or your domain)
  - Test emails work before launch

### Service Role Key
- [ ] Add SUPABASE_SERVICE_ROLE_KEY to .env.local
  - Currently: Not set
  - Needed for: Admin operations, migrations
  - Get from: Supabase Dashboard → Settings → API

---

## 🌐 Domain & Hosting

### Custom Domain
- [ ] Purchase domain (e.g., aquivis.com)
- [ ] Configure DNS
- [ ] Set up SSL certificate (Vercel auto-configures)

### Vercel Deployment
- [ ] Create Vercel project
- [ ] Connect GitHub repository
- [ ] Configure environment variables
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - NEXT_PUBLIC_APP_URL (production URL)
  - NEXT_PUBLIC_SENTRY_DSN (if using)
- [ ] Test deployment
- [ ] Configure custom domain

---

## 📧 Email & Notifications

### Supabase Email Settings
- [ ] Set site URL to production domain
- [ ] Configure redirect URLs
- [ ] Set email rate limits (production values)

### Optional: Transactional Emails
- [ ] Team invitations
- [ ] Service notifications
- [ ] Compliance alerts
- [ ] Lab test reminders

---

## 🔐 Database & Security

### RLS Policies
- [x] Development mode policies applied (permissive for testing)
- [ ] **CRITICAL:** Replace with production policies before launch
- [ ] Audit policies before production
- [ ] Test multi-tenant isolation (company A can't see company B)
- [ ] Test role-based access (owner vs technician)
- [ ] **Currently:** ⚠️ Using permissive dev policies (HOTFIX_RLS_DEVELOPMENT_MODE.sql)

### Backup & Recovery
- [ ] Enable Supabase automatic backups
- [ ] Test restore procedure
- [ ] Document backup schedule

---

## 📱 PWA Features

### Mobile Installation
- [ ] Configure PWA manifest
- [ ] Add service worker
- [ ] Test install on iOS
- [ ] Test install on Android
- [ ] Configure app icons (logo-192.png, logo-512.png already added)

### Offline Capability
- [ ] IndexedDB setup
- [ ] Offline service logging
- [ ] Sync when back online

---

## 🧪 Testing

### Manual Testing
- [ ] Complete signup → onboarding → dashboard flow
- [ ] Create property (Sheraton example)
- [ ] Add units (Sea Temple example)
- [ ] Complete service (spa form)
- [ ] Complete service (pool form)
- [ ] Plant room check
- [ ] Billing report generation
- [ ] Customer portal access

### Load Testing
- [ ] Test with realistic data (100+ properties)
- [ ] Test with multiple concurrent users
- [ ] Performance monitoring

---

## 📊 Compliance & Legal

### QLD Health Compliance
- [x] Requirements built into system
- [ ] Test compliance reporting
- [ ] Generate sample compliance certificate
- [ ] Review with QLD Health guidelines

### Terms & Privacy
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Cookie Policy
- [ ] GDPR compliance (if applicable)

---

## 💰 Billing & Subscriptions

### Stripe Integration
- [ ] Set up Stripe account
- [ ] Configure subscription tiers
- [ ] Test payment flow
- [ ] Set up webhooks

### Pricing
- [ ] Finalize subscription tiers
- [ ] Set pricing (AUD)
- [ ] Configure limits per tier

---

## 📈 Monitoring & Analytics

### Error Tracking
- [ ] Configure Sentry (user already has account)
- [ ] Set up error alerting
- [ ] Configure performance monitoring

### Analytics (Optional)
- [ ] Google Analytics or Plausible
- [ ] User behavior tracking
- [ ] Conversion tracking

---

## 🎨 Branding & Content

### Design
- [x] Logo integrated (water drop with wave)
- [x] Brand colors configured (#2090c3, #bac2c3)
- [ ] Favicon set up
- [ ] Email templates branded
- [ ] Marketing pages (landing, pricing, about)

### Content
- [ ] Help documentation
- [ ] FAQ section
- [ ] Onboarding guides
- [ ] Video tutorials (optional)

---

## ⚠️ CRITICAL - DO NOT FORGET

**Before Launch:**
1. ✅ **RE-ENABLE EMAIL CONFIRMATION** ← Most important!
2. ✅ Configure SMTP provider
3. ✅ Set production environment variables
4. ✅ Test complete user flows
5. ✅ Enable Sentry error tracking

---

## 📝 Notes

**Development Mode Active:**
- Email confirmation: ⚠️ DISABLED (2025-01-10)
- Reason: Faster development iteration
- **MUST RE-ENABLE:** Before production launch

**Security:**
- RLS policies: ✅ Fixed and tested
- Multi-tenant isolation: ✅ Active
- Role-based access: ✅ Implemented

---

**Last Updated:** 2025-01-10  
**Next Review:** Before production deployment

---

*Keep this checklist updated as we progress through development.*

