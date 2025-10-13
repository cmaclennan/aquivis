# 🌊 Aquivis - Pool Service Management Platform

**Professional pool service management for residential, commercial, and resort properties.**

Built from scratch with stability and real-world use cases in mind.

---

## ⚠️ IMPORTANT: Before Making ANY Changes

**👉 READ [`PROJECT_RULES.md`](./PROJECT_RULES.md) FIRST 👈**

This project follows **strict rules** to ensure quality and prevent the issues that plagued the previous version:
- ✅ No changes without user approval
- ✅ Thorough reviews always
- ✅ No shortcuts, only proper solutions
- ✅ Document and test everything

**Violating these rules wastes time and creates technical debt.** Please respect the process.

---

## 🎯 Project Overview

Aquivis is a comprehensive pool service management platform designed for:
- **Residential pool service companies** - Route management, water testing, customer records
- **Commercial/resort maintenance** - Complex property management, compliance tracking
- **Body corporate properties** - Unit-based billing, occupancy scheduling

### Real-World Use Cases

This platform is built to handle:
- **Sheraton Grand Mirage** - Multi-pool resort with plant room monitoring
- **Pullman Sea Temple** - 85+ individual units (spas, plunge pools) with booking-based scheduling
- **Residential properties** - Simple route-based service management

---

## 🚀 Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript + React
- **Database:** Supabase (PostgreSQL) - Remote instance
- **UI:** Tailwind CSS + Shadcn UI
- **Auth:** Supabase Auth with RLS
- **Deployment:** Vercel
- **Error Tracking:** Sentry
- **PWA:** Next PWA (installable, offline-capable)

**Why this stack?** See [DECISIONS.md](./DECISIONS.md) for detailed rationale.

**Business Logic:** See [BUSINESS_LOGIC_UNITS_VS_POOLS.md](./docs/BUSINESS_LOGIC_UNITS_VS_POOLS.md) for property/unit management logic.

---

## ✅ Attribution

This application was designed and built by CODEFORGE 3D for Aquivis. No third-party boilerplates or prior app codebases (e.g., “lovable”, “base44”) were used.

---

## 📋 Project Status

**Current Phase:** Core Development

- [x] Environment verified & ready
- [x] Git repository initialized & organized
- [x] Brand assets prepared (logo, colors, assets)
- [x] Documentation structure created & organized
- [x] Database schema designed & deployed
- [x] Next.js 15 project setup (App Router + TypeScript)
- [x] Authentication implemented (Supabase Auth + RLS)
- [x] Property management (list, create, detail pages)
- [x] Pool/Spa management (add, view units)
- [x] Customer management (CRUD operations)
- [x] Service management (water testing with QLD compliance)
- [x] QLD Health compliance validation (real-time)
- [x] Chemical recommendations with dosages
- [x] Dashboard with progress tracking
- [ ] Service history & trends
- [ ] Equipment tracking
- [ ] Booking system (occupancy-based scheduling)
- [ ] Run sheets (daily schedules)
- [ ] Billing & reports

---

## 🎨 Brand Guidelines

### Logo
- Water drop with wave design
- Clean, professional appearance
- See: `assets/logo-info.md`

### Colors
- **Primary Blue:** `#2090c3`
- **Accent Gray:** `#bac2c3`
- **Success:** `#10b981`
- **Warning:** `#f59e0b`
- **Error:** `#ef4444`

---

## 📁 Project Structure

```
aquivis/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard routes
│   └── logout/            # Logout route
├── assets/                # Brand assets (logos, etc.)
├── components/            # React components
│   └── ui/               # Shadcn UI components
├── docs/                  # 📚 All documentation
│   ├── ISSUE_LOG.md      # ⭐ Bug tracking (check first!)
│   ├── DATABASE_ENUMS_REFERENCE.md  # ⭐ ENUM reference
│   ├── SETUP_PLAN.md     # Project blueprint
│   ├── DECISIONS.md      # Tech decisions
│   └── ...               # Other docs
├── hooks/                 # React hooks
├── lib/                   # Utilities & helpers
│   └── supabase/         # Supabase clients
├── public/                # Static files (logos, icons)
├── scripts/               # Utility scripts
│   ├── apply-rls-postgres.js  # DB fix scripts
│   └── test-*.js         # Testing scripts
├── sql/                   # 🗄️ Database scripts
│   ├── DATABASE_SCHEMA_COMPLETE.sql  # ⭐ Main schema
│   ├── HOTFIX_*.sql      # Applied fixes
│   └── RLS_*.sql         # RLS policies
├── .env.local             # Environment variables (not committed)
├── middleware.ts          # Auth middleware
├── package.json           # Dependencies
└── README.md              # This file
```

**Key Directories:**
- **`/docs`** - All documentation and planning
- **`/sql`** - Database schema and scripts
- **`/scripts`** - Diagnostic and utility scripts
- **`/app`** - Application routes and pages

---

## 🔧 Development Setup

### Prerequisites
- ✅ Node.js v18+ (verified: v24.7.0)
- ✅ npm v8+ (verified: v11.5.1)
- ✅ Git (verified: v2.51.0)
- ✅ Supabase account (remote instance ready)

### Environment Variables

Create `.env.local` (see `.env.local.example`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://krxabrdizqbpitpsvgiv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

```bash
# Clone repository (if not already done)
git clone <repository-url>
cd aquivis

# Install dependencies
npm install

# Start development server
npm run dev
```

**App will be available at:** http://localhost:3000

---

## 🗄️ Database Schema

**Status:** Designed & Deployed ✅

**Core Entities:**
- Companies (multi-tenant with regional settings)
- Users/Profiles (role-based access)
- Properties (residential, commercial, resort, body corporate)
- Units (pools, spas, villas with water types)
- Services & Water Tests (compliance tracking)
- Equipment & Plant Rooms (resort features)
- Bookings (occupancy-based scheduling)
- Customers & Billing

**Database Files:**
- **Main Schema:** `sql/DATABASE_SCHEMA_COMPLETE.sql` (24 tables, 11 ENUMs)
- **ENUM Reference:** `docs/DATABASE_ENUMS_REFERENCE.md` (use for forms!)
- **Full Documentation:** `docs/SETUP_PLAN.md`

---

## 🎯 Core Features

### Phase 1: Foundation (Weeks 1-4) ✅ COMPLETE
- [x] Authentication & user management
- [x] Property & unit management
- [x] Customer management
- [x] Service management with water testing
- [x] QLD Health compliance validation

### Phase 2: Advanced Features (Weeks 5-8)
- [x] Scheduling rules (incl. specific days, occupancy, random de-dup)
- [x] Equipment & plant room checks (measurement_config-driven)
- [x] Jobs (one-off/existing customer) and CSV export integration
- [ ] Booking system (occupancy-based scheduling)
- [ ] Run sheet generation polish
- [ ] Billing reports (full PDFs)

### Phase 3: Polish & Deploy (Weeks 9-12)
- [ ] Mobile PWA optimization
- [ ] Customer portal (view-only)
- [ ] Field testing & refinement
- [ ] Production deployment

**Detailed Roadmap:** See [SETUP_PLAN.md](./SETUP_PLAN.md)

---

## 📚 Documentation

**All documentation is in `/docs` directory.** Key documents:

### **Essential Reading**
- **[docs/ISSUE_LOG.md](./docs/ISSUE_LOG.md)** ⭐ - Bug tracking (check FIRST!)
- **[docs/DATABASE_ENUMS_REFERENCE.md](./docs/DATABASE_ENUMS_REFERENCE.md)** ⭐ - ENUM values for forms
- **[docs/SETUP_PLAN.md](./docs/SETUP_PLAN.md)** - Complete project blueprint

### **Architecture & Design**
- **[docs/DECISIONS.md](./docs/DECISIONS.md)** - Technical decisions & rationale
- **[docs/RLS_STRATEGY.md](./docs/RLS_STRATEGY.md)** - Row Level Security design
- **[docs/DATABASE_VALIDATION.md](./docs/DATABASE_VALIDATION.md)** - Schema validation

### **Deployment & Guides**
- **[docs/DATABASE_DEPLOYMENT_GUIDE.md](./docs/DATABASE_DEPLOYMENT_GUIDE.md)** - How to deploy schema
- **[docs/PRODUCTION_CHECKLIST.md](./docs/PRODUCTION_CHECKLIST.md)** - Pre-production checklist
- **[docs/EMAIL_SETUP_GUIDE.md](./docs/EMAIL_SETUP_GUIDE.md)** - Email configuration

### **Code Quality & Maintenance**
- **[docs/ESLINT_FIXES_COMPLETE.md](./docs/ESLINT_FIXES_COMPLETE.md)** - Complete ESLint warning resolution
- **[docs/ESLINT_QUICK_REFERENCE.md](./docs/ESLINT_QUICK_REFERENCE.md)** - Quick reference for avoiding ESLint issues

**See `/docs/README.md` for complete documentation index.**

---

## 🐛 Issue Tracking

**Critical Rule:** Before attempting any fix, check [docs/ISSUE_LOG.md](./docs/ISSUE_LOG.md) to avoid repeating failed solutions.

**Report Issues:**
1. Check `docs/ISSUE_LOG.md` first (check for existing solutions)
2. Document the exact error message
3. Note what was tried
4. Record the working solution
5. Update `docs/ISSUE_LOG.md` immediately

**Current Issues:** 7 resolved, 0 active

---

## 🚀 Deployment

**Platform:** Vercel (optimized for Next.js)

**Environments:**
- **Development:** Local (`npm run dev`)
- **Staging:** Vercel preview branches
- **Production:** Vercel main branch

Apply these DB updates if not already applied:

```sql
alter table if exists equipment
  add column if not exists maintenance_scheduled boolean not null default false;

alter table if exists equipment
  alter column maintenance_frequency drop default;
```

Then follow `docs/PRODUCTION_CHECKLIST.md` to enable email confirmation, configure SMTP, and replace dev RLS with production policies.

---

## 🤝 Contributing

**Current Phase:** Solo development (Craig + AI Assistant)

**Future:** Team expansion once core features are stable

---

## 📄 License

Proprietary - All rights reserved

**Created by:** Craig  
**Business:** Pool service management (Sheraton, Sea Temple, residential)  
**Built with:** Cursor AI + modern web technologies

---

## 📞 Contact

**Developer:** Craig MacLennan  
**Project Start:** January 10, 2025  
**Current Sprint:** Advanced Features (Service History & Equipment Tracking)  
**Target Launch:** ~12 weeks (April 2025)

---

## 🎉 Acknowledgments

**Lessons Learned From:**
- Fieldside V2 (Flutter) - First app, active use, validated use cases
- Aqua-sync-qld-1 (React/Vite) - Feature-rich but unstable build

**Built Better:**
- Clean architecture from day one
- Comprehensive planning before coding
- Issue tracking to prevent infinite loops
- Real-world use cases driving development

---

*"Building stable, scalable pool service management software - one feature at a time."*

