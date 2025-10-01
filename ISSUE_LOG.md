# 🐛 Aquivis - Issue & Fix Log

**Purpose:** Track every issue encountered and solution applied to prevent duplicate work and endless loops.

---

## 📋 Rules

1. ✅ Log EVERY issue immediately when encountered
2. ✅ Document what was tried (including failures)
3. ✅ Document the final working solution
4. ✅ Update in real-time, not end of day
5. ✅ **NEVER try the same failed solution twice** - check this log first!
6. ✅ Include error messages verbatim
7. ✅ Tag issues by category

---

## 🏷️ Issue Categories

- 🔧 **BUILD** - Build process, dependencies, configuration
- 🐛 **BUG** - Application bugs and runtime errors
- 🔒 **SECURITY** - Security-related issues
- 🗄️ **DATABASE** - Database schema, queries, migrations
- 🎨 **UI/UX** - User interface and styling issues
- 📱 **MOBILE** - Mobile/PWA specific issues
- 🔄 **SYNC** - Data synchronization issues
- 🧪 **TEST** - Testing related issues
- 🚀 **DEPLOY** - Deployment issues

---

## 📊 Current Issues

*None - Fresh build started 2025-01-10*

---

## ✅ Resolved Issues

*Will be populated as issues are encountered and resolved*

---

## 💡 Known Working Solutions

### Environment Setup
- ✅ Node.js v24.7.0 - Confirmed working
- ✅ npm v11.5.1 - Confirmed working
- ✅ Git v2.51.0 - Confirmed working
- ✅ PowerShell syntax: Use semicolon `;` not `&&` for multiple commands

### Supabase
- ✅ Remote instance: https://krxabrdizqbpitpsvgiv.supabase.co
- ✅ Connection method: Supabase client library with environment variables
- ✅ **NEVER attempt local Supabase setup** - Always use remote instance

---

## 🚫 Rejected Approaches (Don't Try These)

### From Previous Build (Aqua-sync-qld-1)
1. ❌ Vite with @vitejs/plugin-react-swc + custom esbuild config (JSX conflicts)
2. ❌ Multiple JSX transformation configurations (causes jsxDEV errors)
3. ❌ Classic JSX runtime with React (build failures)
4. ❌ Manual JSX polyfills (doesn't solve root cause)
5. ❌ Downgrading Vite without fixing config (same issues persist)

**Lesson Learned:** Next.js with default config avoids all these issues

---

## 📝 Template for New Issues

```markdown
### Issue #XXX: [Brief Description]
- **Category:** [🔧/🐛/etc.]
- **Severity:** [Low/Medium/High/Critical]
- **Date:** YYYY-MM-DD
- **Status:** [🔄 In Progress / ✅ Resolved / ❌ Blocked]

**Problem:**
[Exact error message or description]

**Root Cause:**
[Why this happened]

**Attempted Solutions:**
1. ❌ [What was tried that didn't work]
2. ❌ [Another failed attempt]

**Working Solution:**
✅ [What actually fixed it]

**Files Modified:**
- `path/to/file.ts`

**Prevention:**
[How to avoid this in future]
```

---

*Last Updated: 2025-01-10 - Initial setup*
*Maintained by: Craig + AI Assistant*

