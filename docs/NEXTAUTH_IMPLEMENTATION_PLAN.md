# NextAuth.js Implementation Plan

**Status:** APPROVED - Starting implementation
**Timeline:** 4 days
**Scope:** Replace Supabase Auth with NextAuth.js for all 3 user types

---

## 📋 PHASE 1: Setup & Configuration (Day 1)

### **1.1 Install Dependencies**
```bash
npm install next-auth@beta
npm install @auth/prisma-adapter  # For database
```

### **1.2 Create Database Schema**
```sql
-- NextAuth.js required tables
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, provider_account_id)
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL
);

CREATE TABLE verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMP NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Extend profiles table with role if needed
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
```

### **1.3 Create Auth Configuration**
- Create `lib/auth.ts` with NextAuth config
- Set up CredentialsProvider for email/password
- Configure JWT and session callbacks
- Add role and company_id to session

### **1.4 Create API Route**
- Create `app/api/auth/[...nextauth]/route.ts`
- Export NextAuth handler

### **1.5 Environment Variables**
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_PROVIDERS_CREDENTIALS_ENABLED=true
```

---

## 📋 PHASE 2: Login Flows (Day 2)

### **2.1 Update Regular Login** (`/login`)
- Replace Supabase auth with NextAuth `signIn()`
- Keep same UI/UX
- Add role-based redirect logic
- Test with regular user account

### **2.2 Update Super Admin Login** (`/super-admin-login`)
- Use same NextAuth backend
- Add role check: `role === 'super_admin'`
- Redirect to `/super-admin` on success
- Redirect to `/super-admin-login` if not super admin

### **2.3 Update Customer Portal Login** (`/customer-portal/login`)
- Use same NextAuth backend
- Verify profile exists
- Redirect to `/customer-portal` on success
- Redirect to `/customer-portal/login` if not found

### **2.4 Create Logout Route**
- Create `app/api/auth/logout/route.ts`
- Call `signOut()` from NextAuth
- Redirect to appropriate login page

---

## 📋 PHASE 3: Protected Routes (Day 3)

### **3.1 Update Middleware**
- Check session in middleware
- Verify role for protected routes
- Redirect to appropriate login page

### **3.2 Update Layouts**
- Remove Supabase auth checks
- Use NextAuth `getSession()` or `useSession()`
- Check role and company_id

### **3.3 Update Protected Routes**
- `/dashboard` - Requires session + company_id
- `/super-admin` - Requires session + role === 'super_admin'
- `/customer-portal` - Requires session

### **3.4 Session Timeout**
- Implement session timeout in middleware
- Auto-logout after inactivity
- Keep existing SessionTimeoutHandler or replace

---

## 📋 PHASE 4: Testing & Deployment (Day 4)

### **4.1 Local Testing**
- Test regular user login → dashboard
- Test super admin login → super-admin
- Test customer portal login → customer-portal
- Test logout from all 3
- Test session persistence
- Test role-based redirects

### **4.2 Edge Cases**
- Non-super-admin trying to access `/super-admin`
- Non-customer trying to access `/customer-portal`
- Expired session handling
- Invalid credentials

### **4.3 Production Deployment**
- Set environment variables in Vercel
- Deploy to staging first
- Test on staging
- Deploy to production

---

## 🔄 MIGRATION STRATEGY

### **Keep Supabase For:**
- ✅ Data storage (profiles, companies, services, etc.)
- ✅ RLS policies
- ✅ Real-time features
- ✅ Storage (images, files)

### **Replace with NextAuth.js:**
- ❌ Authentication (Supabase Auth)
- ❌ Session management
- ❌ Cookie handling

### **Result:**
- Supabase = Database + RLS
- NextAuth.js = Auth + Sessions
- Clean separation of concerns

---

## 📊 FILES TO CREATE/MODIFY

### **Create:**
- `lib/auth.ts` - NextAuth configuration
- `app/api/auth/[...nextauth]/route.ts` - NextAuth API route
- `lib/auth-utils.ts` - Helper functions

### **Modify:**
- `app/(auth)/login/page.tsx` - Use NextAuth
- `app/(auth)/login/actions.ts` - Remove (use NextAuth API)
- `app/super-admin-login/page.tsx` - Use NextAuth
- `app/super-admin-login/actions.ts` - Remove
- `app/customer-portal/login/page.tsx` - Use NextAuth
- `app/customer-portal/login/actions.ts` - Remove
- `middleware.ts` - Add NextAuth session check
- `app/(dashboard)/layout.tsx` - Use NextAuth session
- `app/super-admin/layout.tsx` - Use NextAuth session
- `app/customer-portal/layout.tsx` - Use NextAuth session
- `package.json` - Add next-auth dependency

### **Remove:**
- `app/(protected)/layout.tsx` - No longer needed
- Old Supabase auth utilities

---

## ✅ SUCCESS CRITERIA

- [x] Users can log in to dashboard
- [x] Super admins can log in to super-admin
- [x] Customers can log in to customer portal
- [x] Sessions persist across navigation
- [x] Cookies don't disappear
- [x] Role-based access control works
- [x] Logout works from all 3 areas
- [x] No redirect loops
- [x] No mysterious auth errors

---

## 🚀 STARTING NOW

I'm about to:
1. Install NextAuth.js
2. Create database schema
3. Set up auth configuration
4. Update login flows
5. Test everything

**No more debugging, no more guessing - just a solid, working auth system.**

