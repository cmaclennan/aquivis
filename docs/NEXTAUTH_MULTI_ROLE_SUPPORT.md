# NextAuth.js: Multi-Role Support (Super Admin & Customer Portal)

**Question:** Will NextAuth.js handle the super admin/customer portal as well?

**Answer:** ✅ **YES - BETTER THAN CURRENT SYSTEM**

---

## 📊 CURRENT ARCHITECTURE

### **3 Separate Auth Flows**

1. **Regular Users** (`/login`)
   - Email/password login
   - Redirects to `/dashboard`
   - Requires `company_id` in profile

2. **Super Admin** (`/super-admin-login`)
   - Email/password login
   - Checks if `role === 'super_admin'`
   - Redirects to `/super-admin`
   - 4-hour session timeout
   - Logs all actions

3. **Customer Portal** (`/customer-portal/login`)
   - Email/password login
   - Checks if profile exists
   - Redirects to `/customer-portal`
   - 60-minute session timeout

### **Current Problem**
- All 3 flows use Supabase Auth
- All 3 are broken (cookies disappear, auth context lost)
- Each has its own session management
- Inconsistent behavior across flows

---

## ✅ HOW NEXTAUTH.JS HANDLES THIS

### **Single Auth System, Multiple Roles**

```
NextAuth.js (handles all auth)
├── Regular User Login → /dashboard
├── Super Admin Login → /super-admin
└── Customer Portal Login → /customer-portal
```

### **Key Features**

1. **Role-Based Access Control (RBAC)**
   - Store `role` in session
   - Check role in middleware/layouts
   - Redirect based on role

2. **Multiple Login Pages**
   - `/login` - Regular users
   - `/super-admin-login` - Super admins
   - `/customer-portal/login` - Customers
   - All use NextAuth.js backend

3. **Unified Session Management**
   - Single session table
   - Consistent cookie handling
   - No mysterious disappearances

4. **Custom Session Data**
   - Store `role`, `company_id`, `email`
   - Access in any component
   - Type-safe with TypeScript

---

## 🏗️ IMPLEMENTATION STRUCTURE

### **Database Schema**
```sql
-- NextAuth.js sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMP NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Keep existing profiles table
-- Just add role field if not present
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
```

### **NextAuth Configuration**
```typescript
// lib/auth.ts
export const authOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        // Validate with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })
        
        if (error || !data.user) return null
        
        // Get user role from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, company_id')
          .eq('id', data.user.id)
          .single()
        
        return {
          id: data.user.id,
          email: data.user.email,
          role: profile?.role,
          company_id: profile?.company_id,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.company_id = user.company_id
      }
      return token
    },
    async session({ session, token }) {
      session.user.role = token.role
      session.user.company_id = token.company_id
      return session
    }
  }
}
```

### **Login Pages**
```typescript
// All 3 login pages use same NextAuth.js API
// Just different redirects based on role

const handleLogin = async (email, password) => {
  const result = await signIn('credentials', {
    email,
    password,
    redirect: false,
  })
  
  if (result.ok) {
    // Get session to check role
    const session = await getSession()
    
    if (session.user.role === 'super_admin') {
      router.push('/super-admin')
    } else if (session.user.role === 'customer') {
      router.push('/customer-portal')
    } else {
      router.push('/dashboard')
    }
  }
}
```

### **Protected Routes**
```typescript
// middleware.ts
export async function middleware(request) {
  const session = await getSession({ req: request })
  
  // Super admin routes
  if (request.nextUrl.pathname.startsWith('/super-admin')) {
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.redirect('/super-admin-login')
    }
  }
  
  // Customer portal routes
  if (request.nextUrl.pathname.startsWith('/customer-portal')) {
    if (!session) {
      return NextResponse.redirect('/customer-portal/login')
    }
  }
  
  // Dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session || !session.user.company_id) {
      return NextResponse.redirect('/login')
    }
  }
}
```

---

## 🎯 ADVANTAGES OVER CURRENT SYSTEM

| Feature | Current | NextAuth.js |
|---------|---------|------------|
| **Cookie Handling** | ❌ Broken | ✅ Works |
| **Session Persistence** | ❌ Disappears | ✅ Reliable |
| **Role Support** | ⚠️ Manual checks | ✅ Built-in |
| **Multiple Logins** | ⚠️ Separate flows | ✅ Unified |
| **Session Timeout** | ⚠️ Manual | ✅ Automatic |
| **Type Safety** | ⚠️ Partial | ✅ Full |
| **Logging** | ⚠️ Manual | ✅ Built-in |

---

## 📋 MIGRATION PLAN

### **Phase 1: Setup (1 day)**
- Install NextAuth.js
- Create auth configuration
- Set up database schema

### **Phase 2: Login Flows (1 day)**
- Update `/login` to use NextAuth
- Update `/super-admin-login` to use NextAuth
- Update `/customer-portal/login` to use NextAuth

### **Phase 3: Protected Routes (1 day)**
- Update middleware for role checks
- Update layouts for role checks
- Test all 3 flows

### **Phase 4: Testing & Deployment (1 day)**
- Test regular user login
- Test super admin login
- Test customer portal login
- Test session persistence
- Deploy to production

---

## ✅ ANSWER TO YOUR QUESTION

**"Will NextAuth.js handle the super admin/customer portal as well?"**

**YES - and it will handle them BETTER than the current system:**

1. ✅ Single unified auth system for all 3 roles
2. ✅ Reliable cookie handling (no disappearing cookies)
3. ✅ Built-in role-based access control
4. ✅ Consistent session management across all flows
5. ✅ Type-safe session data
6. ✅ Easier to maintain and extend

**No more separate auth flows, no more mysterious redirects, no more broken cookies.**

---

## 🚀 READY TO PROCEED?

If you're satisfied that NextAuth.js will handle all 3 auth flows properly, I can:

1. Create detailed implementation plan
2. Set up NextAuth.js configuration
3. Implement all 3 login flows
4. Migrate existing sessions
5. Test thoroughly before deploying

**Shall we proceed?**

