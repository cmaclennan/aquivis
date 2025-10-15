// ============================================
// SENTRY INTEGRATION UTILITIES
// ============================================
// Purpose: Centralized Sentry error reporting and monitoring
// Priority: CRITICAL - Essential for production monitoring
// Date: 2025-01-14

import * as Sentry from '@sentry/nextjs'

// Error reporting utilities
export const reportError = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    tags: {
      source: 'manual',
    },
    extra: context,
  })
}

export const reportMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.captureMessage(message, level)
}

// Performance monitoring - using breadcrumbs for now

export const addBreadcrumb = (message: string, category?: string, level?: 'info' | 'warning' | 'error') => {
  Sentry.addBreadcrumb({
    message,
    category: category || 'user',
    level: level || 'info',
  })
}

// User context
export const setUserContext = (user: { id: string; email?: string; company_id?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    company_id: user.company_id,
  })
}

export const clearUserContext = () => {
  Sentry.setUser(null)
}

// Custom error types for better categorization
export class DatabaseError extends Error {
  constructor(message: string, public query?: string, public table?: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string, public userId?: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string, public value?: any) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Error reporting with proper categorization
export const reportDatabaseError = (error: Error, query?: string, table?: string) => {
  Sentry.captureException(error, {
    tags: {
      errorType: 'database',
      table: table || 'unknown',
    },
    extra: {
      query: query || 'unknown',
    },
  })
}

export const reportAuthError = (error: Error, userId?: string) => {
  Sentry.captureException(error, {
    tags: {
      errorType: 'authentication',
    },
    extra: {
      userId: userId || 'unknown',
    },
  })
}

export const reportValidationError = (error: Error, field?: string, value?: any) => {
  Sentry.captureException(error, {
    tags: {
      errorType: 'validation',
      field: field || 'unknown',
    },
    extra: {
      value: value || 'unknown',
    },
  })
}

// Performance tracking utilities
export const trackPageLoad = (pageName: string) => {
  const startTime = performance.now()
  return () => {
    const duration = performance.now() - startTime
    Sentry.addBreadcrumb({
      message: `Page load: ${pageName}`,
      category: 'performance',
      level: 'info',
      data: { duration }
    })
  }
}

export const trackQuery = (queryName: string) => {
  const startTime = performance.now()
  return () => {
    const duration = performance.now() - startTime
    Sentry.addBreadcrumb({
      message: `Query: ${queryName}`,
      category: 'performance',
      level: 'info',
      data: { duration }
    })
  }
}

export const trackAction = (actionName: string) => {
  const startTime = performance.now()
  return () => {
    const duration = performance.now() - startTime
    Sentry.addBreadcrumb({
      message: `Action: ${actionName}`,
      category: 'performance',
      level: 'info',
      data: { duration }
    })
  }
}

// Supabase error handling
export const handleSupabaseError = (error: any, context: string) => {
  const errorMessage = error.message || 'Unknown Supabase error'
  const errorCode = error.code || 'unknown'
  
  reportError(new Error(`Supabase ${context}: ${errorMessage}`), {
    supabaseError: error,
    context,
    errorCode,
  })
}

// React Query error handling
export const handleQueryError = (error: any, queryKey: string[]) => {
  const errorMessage = error.message || 'Unknown query error'
  
  reportError(new Error(`Query Error [${queryKey.join('.')}]: ${errorMessage}`), {
    queryKey,
    error,
  })
}

// Form validation error handling
export const handleValidationError = (field: string, value: any, rule: string) => {
  const error = new ValidationError(`Validation failed for ${field}: ${rule}`, field, value)
  reportValidationError(error, field, value)
  return error
}

// API error handling
export const handleApiError = (error: any, endpoint: string, method: string) => {
  const errorMessage = error.message || 'Unknown API error'
  
  reportError(new Error(`API Error [${method} ${endpoint}]: ${errorMessage}`), {
    endpoint,
    method,
    error,
  })
}
