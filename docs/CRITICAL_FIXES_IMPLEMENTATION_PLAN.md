# 🚨 Critical Fixes Implementation Plan
**Date:** 2025-01-20  
**Priority:** IMMEDIATE  
**Estimated Time:** 4-6 hours

---

## 🎯 Fix #1: Authentication Loop Issue (CRITICAL)

### Problem
Users redirected to login after successfully logging in and clicking navigation links.

### Root Cause
Client-side navigation (`router.push`) doesn't properly persist session cookies before middleware check.

### Solution: Server Action for Login

**Step 1: Create Server Action**
```typescript
// app/(auth)/login/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirect') as string || '/dashboard'

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    // Check if user has a company profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', data.user.id)
      .single()

    if (!profile) {
      redirect('/onboarding')
    } else {
      redirect(redirectTo)
    }
  }

  return { error: 'Login failed' }
}
```

**Step 2: Update Login Page**
```typescript
// app/(auth)/login/page.tsx
'use client'

import { loginAction } from './actions'
import { useFormState } from 'react-dom'

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, { error: null })

  return (
    <form action={formAction}>
      <input type="email" name="email" required />
      <input type="password" name="password" required />
      <input type="hidden" name="redirect" value={searchParams.get('redirect') || '/dashboard'} />
      {state?.error && <p className="text-red-600">{state.error}</p>}
      <button type="submit">Sign In</button>
    </form>
  )
}
```

**Testing:**
1. Clear all cookies
2. Login with valid credentials
3. Verify redirect to dashboard
4. Click navigation links
5. Verify no redirect to login

---

## 🎯 Fix #2: Logout Route Hardcoded URL (HIGH)

### Problem
Logout redirects to production URL even in development.

### Solution

**File:** `app/logout/route.ts`

**Replace:**
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  await supabase.auth.signOut()
  
  // Use relative URL to avoid HTTPS/HTTP issues
  return NextResponse.redirect(new URL('/login', 'https://www.aquivis.co'))
}
```

**With:**
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  
  await supabase.auth.signOut()
  
  // Use request URL for proper environment handling
  const requestUrl = new URL(request.url)
  const redirectUrl = new URL('/login', requestUrl.origin)
  
  return NextResponse.redirect(redirectUrl)
}
```

**Testing:**
1. Test logout in development (localhost:3000)
2. Test logout in staging
3. Test logout in production
4. Verify redirect to correct environment

---

## 🎯 Fix #3: Customer Portal Authentication (HIGH)

### Problem
Customer portal in public routes but requires authentication.

### Solution

**Step 1: Update Middleware**

**File:** `middleware.ts`

**Change Line 67-83:**
```typescript
const protectedRoutes = [
  '/dashboard',
  '/customers',           // ✅ ADD THIS
  '/customer-portal',     // ✅ ADD THIS
  '/properties',
  '/services',
  '/jobs',
  '/reports',
  '/team',
  '/profile',
  '/settings',
  '/management',
  '/schedule',
  '/equipment',
  '/super-admin',
  '/templates',
  '/onboarding',
]
```

**Change Line 86-95:**
```typescript
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/customer-portal/login',  // Keep only the login page public
  '/super-admin-login',
  '/invite/accept',
  '/style-guide',
]
```

**Step 2: Create Customer Portal Layout**

**File:** `app/customer-portal/layout.tsx`
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CustomerPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/customer-portal/login')
  }

  // Verify user has customer access
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/customer-portal/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <h1 className="text-xl font-bold">Customer Portal</h1>
              </div>
            </div>
            <div className="flex items-center">
              <a href="/logout" className="text-sm text-gray-700 hover:text-gray-900">
                Logout
              </a>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
```

**Testing:**
1. Logout completely
2. Try to access `/customer-portal` directly
3. Verify redirect to `/customer-portal/login`
4. Login as customer
5. Verify access to customer portal
6. Test navigation within customer portal

---

## 🎯 Fix #4: Rotate Exposed Credentials (CRITICAL SECURITY)

### Problem
Production credentials exposed in `env-template.txt`.

### Solution

**Step 1: Rotate Supabase Anon Key**
1. Go to Supabase Dashboard → Settings → API
2. Click "Rotate" on Anon Key
3. Copy new key
4. Update `.env.local` and Vercel environment variables

**Step 2: Rotate Resend API Key**
1. Go to Resend Dashboard → API Keys
2. Delete old key `re_4iiLMnUg_JNpvJ5dAdRKvxvhpAiEmg3Po`
3. Create new key
4. Update `.env.local` and Vercel environment variables

**Step 3: Update Template File**

**File:** `env-template.txt`

**Replace with:**
```
# Supabase Configuration
# Get these values from: https://supabase.com → Your Project → Settings → API
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Email Configuration
# Get this from: https://resend.com → API Keys
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=noreply@yourdomain.com

# Sentry Configuration (Optional)
# Get from: https://sentry.io → Settings → Projects → [Your Project] → Client Keys (DSN)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here
SENTRY_ORG=your_sentry_org_here
SENTRY_PROJECT=your_sentry_project_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 4: Verify No Credentials in Git History**
```bash
# Search for exposed keys
git log -p | grep -i "NEXT_PUBLIC_SUPABASE_ANON_KEY"
git log -p | grep -i "RESEND_API_KEY"

# If found, consider using git-filter-repo to remove from history
```

---

## 🎯 Fix #5: Add Missing Protected Route (MEDIUM)

### Problem
`/customers` route not in protected routes list.

### Solution

**File:** `middleware.ts` (Line 67-83)

**Already covered in Fix #3 above.**

---

## 📋 Implementation Checklist

### Pre-Implementation
- [ ] Backup current production database
- [ ] Create feature branch: `fix/critical-auth-issues`
- [ ] Notify team of upcoming changes

### Implementation Order
1. [ ] **Fix #4: Rotate Credentials** (15 min)
   - [ ] Rotate Supabase anon key
   - [ ] Rotate Resend API key
   - [ ] Update env-template.txt
   - [ ] Update Vercel environment variables
   - [ ] Test application still works

2. [ ] **Fix #2: Logout Route** (10 min)
   - [ ] Update logout route code
   - [ ] Test in development
   - [ ] Commit changes

3. [ ] **Fix #3: Customer Portal Auth** (30 min)
   - [ ] Update middleware protected routes
   - [ ] Create customer portal layout
   - [ ] Test customer portal access
   - [ ] Commit changes

4. [ ] **Fix #1: Authentication Loop** (2-3 hours)
   - [ ] Create login server action
   - [ ] Update login page component
   - [ ] Test login flow thoroughly
   - [ ] Test navigation after login
   - [ ] Test redirect parameter
   - [ ] Commit changes

### Testing
- [ ] Test all three login flows:
  - [ ] Normal login → dashboard
  - [ ] Customer portal login → customer portal
  - [ ] Super admin login → super admin
- [ ] Test logout from all areas
- [ ] Test navigation after login (no redirect loop)
- [ ] Test in development environment
- [ ] Test in staging environment

### Deployment
- [ ] Create pull request
- [ ] Code review
- [ ] Merge to main
- [ ] Deploy to staging
- [ ] Verify staging works
- [ ] Deploy to production
- [ ] Monitor Sentry for errors
- [ ] Verify production works

### Post-Deployment
- [ ] Monitor error rates in Sentry
- [ ] Check user login success rates
- [ ] Verify no authentication loop reports
- [ ] Update documentation

---

## 🔍 Verification Tests

### Test Case 1: Normal Login Flow
1. Clear all cookies
2. Navigate to `/login`
3. Enter valid credentials
4. Click "Sign In"
5. **Expected:** Redirect to `/dashboard`
6. Click on "Customers" link
7. **Expected:** Navigate to `/customers` (no redirect to login)
8. Click on "Properties" link
9. **Expected:** Navigate to `/properties` (no redirect to login)

### Test Case 2: Customer Portal Login
1. Clear all cookies
2. Navigate to `/customer-portal/login`
3. Enter customer credentials
4. Click "Sign In"
5. **Expected:** Redirect to `/customer-portal`
6. Refresh page
7. **Expected:** Stay on `/customer-portal` (no redirect to login)

### Test Case 3: Logout
1. Login to application
2. Navigate to `/logout`
3. **Expected:** Redirect to `/login` on same domain
4. Try to access `/dashboard`
5. **Expected:** Redirect to `/login`

---

## 📊 Success Metrics

- ✅ Zero authentication loop reports
- ✅ Login success rate > 99%
- ✅ Logout works in all environments
- ✅ Customer portal properly protected
- ✅ No exposed credentials in repository
- ✅ Sentry error rate < 1%

---

**Plan Created:** 2025-01-20  
**Estimated Completion:** 4-6 hours  
**Priority:** IMMEDIATE - START TODAY

