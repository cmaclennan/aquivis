# 🌊 Aquivis - Pool Service Management Platform

**Professional pool service management for residential, commercial, and resort properties.**

Built from scratch with stability and real-world use cases in mind.

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

---

## 📋 Project Status

**Current Phase:** Initial Setup & Planning

- [x] Environment verified (Node.js v24.7.0, npm v11.5.1, Git v2.51.0)
- [x] Git repository initialized
- [x] Brand assets prepared (logo, colors)
- [x] Documentation structure created
- [ ] Database schema design
- [ ] Next.js project setup
- [ ] Authentication implementation
- [ ] Core features (see SETUP_PLAN.md)

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
├── assets/              # Logo, images, media
├── public/              # Static files (will be created)
├── src/
│   ├── app/            # Next.js app directory (routes)
│   ├── components/     # React components
│   ├── lib/            # Utilities, helpers
│   └── types/          # TypeScript types
├── .env.local          # Environment variables (not committed)
├── .gitignore          # Git ignore rules
├── DECISIONS.md        # Technical decisions & rationale
├── ISSUE_LOG.md        # Bug tracking & solutions
├── SETUP_PLAN.md       # Comprehensive build plan
└── README.md           # This file
```

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

*Instructions will be added after initial Next.js setup*

---

## 🗄️ Database Schema

**Status:** In Design Phase

**Core Entities:**
- Companies (multi-tenant)
- Users/Profiles (role-based)
- Properties (residential, commercial, resort, body corporate)
- Units (pools, spas, villas)
- Services & Water Tests
- Equipment & Plant Rooms
- Bookings (for occupied units)
- Billing & Reports

**Full Schema:** See [SETUP_PLAN.md](./SETUP_PLAN.md#database-schema)

---

## 🎯 Core Features

### Phase 1: Foundation (Weeks 1-4)
- [ ] Authentication & user management
- [ ] Property & unit management
- [ ] Basic service logging
- [ ] Water testing forms

### Phase 2: Advanced Features (Weeks 5-8)
- [ ] Booking system (occupancy-based scheduling)
- [ ] Run sheet generation
- [ ] Equipment & plant room checks
- [ ] Billing reports

### Phase 3: Polish & Deploy (Weeks 9-12)
- [ ] Mobile PWA optimization
- [ ] Customer portal (view-only)
- [ ] Field testing & refinement
- [ ] Production deployment

**Detailed Roadmap:** See [SETUP_PLAN.md](./SETUP_PLAN.md)

---

## 📚 Documentation

- **[SETUP_PLAN.md](./SETUP_PLAN.md)** - Comprehensive build plan with mockups
- **[DECISIONS.md](./DECISIONS.md)** - Technical decisions & rationale
- **[ISSUE_LOG.md](./ISSUE_LOG.md)** - Bug tracking & solutions
- **[assets/logo-info.md](./assets/logo-info.md)** - Brand guidelines

---

## 🐛 Issue Tracking

**Critical Rule:** Before attempting any fix, check [ISSUE_LOG.md](./ISSUE_LOG.md) to avoid repeating failed solutions.

**Report Issues:**
1. Check ISSUE_LOG.md first
2. Document the exact error
3. Note what was tried
4. Record the working solution
5. Update ISSUE_LOG.md immediately

---

## 🚀 Deployment

**Platform:** Vercel (optimized for Next.js)

**Environments:**
- **Development:** Local (`npm run dev`)
- **Staging:** Vercel preview branches
- **Production:** Vercel main branch

*Deployment instructions will be added during Phase 3*

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

**Developer:** Craig  
**Project Start:** January 10, 2025  
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

