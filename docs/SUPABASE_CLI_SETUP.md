# 🛠️ Supabase CLI Setup

**Purpose:** Install Supabase CLI to enable direct database testing and management  
**Benefit:** I can test RLS policies without manual back-and-forth

---

## 📦 Installation (Windows)

### **Method 1: Scoop (Recommended)**

If you have Scoop installed:
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### **Method 2: npm/npx (Easier)**

```bash
npm install -g supabase
```

Or use without installing (npx):
```bash
npx supabase --version
```

### **Method 3: Direct Download**

1. Go to: https://github.com/supabase/cli/releases
2. Download: `supabase_windows_amd64.zip`
3. Extract and add to PATH

---

## 🔧 Quick Setup with npm

**Run this:**
```bash
npm install -g supabase
```

**Verify:**
```bash
supabase --version
```

**Should show:** `1.x.x` or similar

---

## 🔑 Link to Remote Project

Once installed:

```bash
supabase link --project-ref krxabrdizqbpitpsvgiv
```

**When prompted for database password:**
- This is your Supabase database password
- Get it from: Supabase Dashboard → Settings → Database → Connection string
- Or set a new one if you don't have it

---

## ✅ What This Enables

**With CLI, I can:**
- Run SQL against your remote database
- Test RLS policies
- Generate TypeScript types from your schema
- Run migrations
- Test different user scenarios
- Fix issues without your manual SQL execution

---

## 🎯 Immediate Benefit

**For our RLS issue:**
- I can test policies as different users
- Verify they work before giving you SQL
- No more "hotfix #6" that doesn't work

---

**Want to install it?** 

The `npm install -g supabase` method is simplest!

