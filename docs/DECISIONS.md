# 🎯 Aquivis - Technical Decisions & Rationale

**Purpose:** Document all technical choices, why they were made, and what alternatives were considered.

---

## 🏗️ Tech Stack Decisions

### Frontend Framework: **Next.js 15 (App Router) + TypeScript + React**

**Chosen:** 2025-01-10

**Why:**
- ✅ Production-stable with zero config needed
- ✅ Built-in TypeScript support (no setup hassle)
- ✅ Server Components reduce client bundle size
- ✅ File-based routing (simpler than React Router)
- ✅ API routes included (no separate backend needed for some features)
- ✅ Vercel deployment optimized (they built Next.js)
- ✅ Handles JSX/build complexity automatically (avoids previous Vite issues)
- ✅ Battle-tested by millions of production apps

**Alternatives Considered:**
- ❌ Vite + React - Previous build had persistent JSX/build issues
- ❌ SvelteKit - Smaller ecosystem, less familiar
- ❌ Remix - Newer, less mature
- ❌ Next.js without TypeScript - Lose type safety and bug prevention

**Risk Mitigation:**
- Use Next.js defaults (no custom webpack/build config)
- Deploy to Vercel (optimal compatibility)
- Test production builds frequently

---

### Backend: **Supabase (Remote PostgreSQL)**

**Chosen:** 2025-01-10

**Why:**
- ✅ Already provisioned and ready: https://krxabrdizqbpitpsvgiv.supabase.co
- ✅ PostgreSQL (robust, scalable, proven)
- ✅ Built-in auth, real-time, storage
- ✅ Row Level Security (RLS) for data protection
- ✅ Remote instance (no local setup complexity)
- ✅ Generous free tier, scales to enterprise
- ✅ TypeScript types auto-generated from schema

**Alternatives Considered:**
- ❌ Local Supabase - User specifically requires remote instance
- ❌ Firebase - Prefer relational DB for complex queries
- ❌ PlanetScale - No built-in auth/storage
- ❌ Custom backend - Unnecessary complexity

**Critical Rule:**
- 🚨 **ALWAYS use remote instance** - Never attempt local Supabase setup

---

### UI Framework: **Tailwind CSS + Shadcn UI**

**Chosen:** 2025-01-10

**Why:**
- ✅ Tailwind: Fast development, consistent design system, small bundle
- ✅ Shadcn: Copy-paste components (we own the code), fully customizable
- ✅ Clean, professional look out of the box
- ✅ Excellent mobile responsiveness
- ✅ Dark mode support built-in
- ✅ Accessibility features included

**Brand Colors:**
- Primary Blue: #2090c3 (from logo)
- Accent Gray: #bac2c3 (from logo)

**Alternatives Considered:**
- ❌ Material UI - Too opinionated, harder to customize
- ❌ Chakra UI - Heavier bundle size
- ❌ Custom CSS - Too slow, reinventing the wheel
- ❌ Bootstrap - Dated appearance

---

### State Management: **React Server Components + Zustand**

**Chosen:** 2025-01-10 (Pending implementation)

**Why:**
- ✅ Server Components: Data fetching on server (faster, more secure)
- ✅ Zustand: Lightweight client state (simpler than Redux)
- ✅ React Query: Server state caching and synchronization
- ✅ Minimal boilerplate compared to Redux/MobX

**Use Cases:**
- Server Components: Initial page loads, SEO content
- Zustand: UI state (modals, forms, filters)
- React Query: API data, caching, refetching

---

### Deployment: **Vercel**

**Chosen:** 2025-01-10

**Why:**
- ✅ Built by Next.js creators (optimal compatibility)
- ✅ Zero-config deployment
- ✅ Automatic previews for git branches
- ✅ Edge functions for global performance
- ✅ Free tier sufficient for development
- ✅ Easy environment variable management

**Alternatives Considered:**
- ❌ Netlify - Previous build had deployment issues there
- ❌ AWS - Overkill complexity for this stage
- ❌ Railway - Good but less Next.js optimized

---

### Error Tracking: **Sentry**

**Chosen:** 2025-01-10

**Why:**
- ✅ User already has Sentry account
- ✅ Industry standard for error monitoring
- ✅ Performance monitoring included
- ✅ Source maps for debugging
- ✅ User feedback capture

---

### PWA/Mobile: **Next PWA + Capacitor (future)**

**Chosen:** 2025-01-10

**Why:**
- ✅ Next PWA: Progressive Web App (installable, offline-capable)
- ✅ Capacitor: Path to native iOS/Android apps if needed later
- ✅ Same codebase for web and mobile
- ✅ Camera/photo capture supported
- ✅ Offline storage with IndexedDB

**Phase 1:** PWA only (web-based, installable)
**Phase 2:** Native apps via Capacitor (if needed)

---

## 🎨 Design Decisions

### Design Philosophy: **Clean, Professional, Mobile-First**

**Chosen:** 2025-01-10

**Principles:**
- Mobile-first (technicians in field use phones/tablets)
- Large touch targets (minimum 44px)
- High contrast for outdoor visibility
- Minimal clicks to complete tasks
- Offline-capable for remote locations
- Fast load times on cellular networks

**Color Palette:**
```
Primary:   #2090c3 (Aquivis Blue)
Accent:    #bac2c3 (Subtle Gray)
Success:   #10b981 (Green - for completed tasks)
Warning:   #f59e0b (Amber - for alerts)
Error:     #ef4444 (Red - for issues)
Background: #ffffff (White - clean)
Text:      #1f2937 (Dark Gray - readable)
```

---

### Navigation: **Hybrid Approach**

**Chosen:** 2025-01-10 (Pending final mockup approval)

**Desktop/Tablet:**
- Sidebar navigation (always visible)
- Breadcrumbs for deep navigation
- Quick search/command palette

**Mobile:**
- Bottom tab bar for main features (Run Sheet, Camera, Profile)
- Hamburger menu for secondary features (Settings, Reports)
- Swipe gestures for navigation

---

## 🚀 Development Approach

### Build Strategy: **Incremental + Vertical Slices**

**Chosen:** 2025-01-10

**Why:**
- Start with complete database schema (foundation)
- Build one complete workflow (Sheraton morning checks)
- Validate approach works end-to-end
- Then expand to other use cases (Sea Temple, residential)
- Iterate based on real usage feedback

**Phases:**
1. Foundation (auth, database, basic UI)
2. Sheraton use case (simpler, validates approach)
3. Sea Temple use case (complex, booking-based)
4. Residential use case (simplified version)
5. Polish and optimize

---

### Testing Strategy: **Practical + Critical Path**

**Chosen:** 2025-01-10

**Approach:**
- Unit tests for critical business logic (chemical calculations, billing)
- Integration tests for database operations
- E2E tests for main user flows (service completion, report generation)
- Manual testing for field validation
- NO test coverage requirements (focus on what matters)

**Tools:**
- Vitest (unit/integration)
- Playwright (E2E)
- Manual testing with real users (Craig's team)

---

## 📝 Rejected Approaches

### What We're NOT Doing (and Why)

1. ❌ **Local Supabase** - User requires remote instance
2. ❌ **Microservices** - Unnecessary complexity at this stage
3. ❌ **GraphQL** - REST + Supabase client is simpler
4. ❌ **100% Test Coverage** - Focus on critical paths instead
5. ❌ **Custom Build Config** - Use Next.js defaults only
6. ❌ **Complex State Management** - Keep it simple with Server Components
7. ❌ **Real-time Everything** - Only where actually needed (chat, live updates)
8. ❌ **Premature Optimization** - Build first, optimize later

---

## 🔄 Decision Review Process

**When to Reconsider:**
- If a chosen technology causes persistent issues (log in ISSUE_LOG.md)
- If user requirements change significantly
- If a better alternative emerges with clear benefits
- If performance/cost becomes an issue

**How to Update:**
1. Document the issue
2. Propose alternative with rationale
3. Get user approval
4. Update this document
5. Migrate carefully

---

*Last Updated: 2025-01-10 - Initial decisions documented*
*Maintained by: Craig + AI Assistant*

