# 📝 ESLint Quick Reference Guide

**Purpose**: Quick reference for avoiding and fixing common ESLint warnings in React/Next.js projects.

---

## 🚨 Common ESLint Warnings & Fixes

### 1. Missing Dependencies in useEffect/useCallback

**Warning**: `React Hook useEffect has a missing dependency: 'variableName'`

**Fix**: Add all variables used inside the hook to the dependency array

```typescript
// ❌ Bad
useEffect(() => {
  loadData() // Missing loadData dependency
}, [])

// ✅ Good
useEffect(() => {
  loadData()
}, [loadData])
```

### 2. Functions Changing on Every Render

**Warning**: `The 'functionName' function makes the dependencies of useEffect Hook change on every render`

**Fix**: Wrap function in useCallback

```typescript
// ❌ Bad
const loadData = async () => {
  // function body
}

// ✅ Good
const loadData = useCallback(async () => {
  // function body
}, [dependency1, dependency2])
```

### 3. Unnecessary Dependencies

**Warning**: `React Hook useCallback has an unnecessary dependency: 'variableName'`

**Fix**: Remove unused dependencies

```typescript
// ❌ Bad
useCallback(() => {
  // only uses dependency1
}, [dependency1, dependency2]) // dependency2 not used

// ✅ Good
useCallback(() => {
  // only uses dependency1
}, [dependency1])
```

### 4. Variable Declaration Order

**Error**: `Block-scoped variable 'functionName' used before its declaration`

**Fix**: Move useEffect after function declaration

```typescript
// ❌ Bad
useEffect(() => {
  loadData() // loadData not yet declared
}, [loadData])

const loadData = useCallback(async () => {
  // function body
}, [])

// ✅ Good
const loadData = useCallback(async () => {
  // function body
}, [])

useEffect(() => {
  loadData() // loadData already declared
}, [loadData])
```

---

## 🔧 Quick Fix Commands

### Check Current Warnings
```bash
npm run lint
```

### Fix Automatically (when possible)
```bash
npm run lint -- --fix
```

### Type Check
```bash
npm run type-check
```

### Full Build Test
```bash
npm run build
```

---

## 📋 Pre-Commit Checklist

Before committing code, run:

1. ✅ `npm run type-check` - No TypeScript errors
2. ✅ `npm run lint` - No ESLint warnings
3. ✅ `npm run build` - Successful build

---

## 🎯 Best Practices

### Always Include All Dependencies
```typescript
// ✅ Include ALL variables used inside the hook
useEffect(() => {
  if (user && property) {
    loadData(user.id, property.id)
  }
}, [user, property, loadData]) // All three dependencies
```

### Use useCallback for Functions Passed as Dependencies
```typescript
// ✅ Memoize functions to prevent recreation
const loadData = useCallback(async (userId: string) => {
  // function body
}, [supabase, dependency1])
```

### Remove Unused Dependencies
```typescript
// ✅ Only include dependencies actually used
useCallback(() => {
  console.log('Hello') // No dependencies needed
}, []) // Empty array for no dependencies
```

### Declare Functions Before Use
```typescript
// ✅ Correct order
const myFunction = useCallback(() => {
  // function body
}, [])

useEffect(() => {
  myFunction()
}, [myFunction])
```

---

## 🚀 Performance Benefits

Following these patterns provides:

- ✅ **Fewer re-renders** - Components only update when necessary
- ✅ **Better memory usage** - Functions properly memoized
- ✅ **Cleaner builds** - No warnings in production logs
- ✅ **Professional quality** - Meets React best practices

---

## 📚 Related Documentation

- [Complete ESLint Fixes](ESLINT_FIXES_COMPLETE.md)
- [Issue Log](ISSUE_LOG.md)
- [React Hooks Rules](https://reactjs.org/docs/hooks-rules.html)
- [ESLint React Hooks Plugin](https://www.npmjs.com/package/eslint-plugin-react-hooks)

---

*Last Updated: January 13, 2025*
