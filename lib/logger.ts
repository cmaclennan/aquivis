/**
 * Logger Utility
 * 
 * Provides development-only logging and production error tracking via Sentry.
 * All console.* statements should be replaced with these utilities.
 */

import * as Sentry from '@sentry/nextjs'

/**
 * Check if we're in development mode
 */
const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Logger class for structured logging
 */
class Logger {
  /**
   * Log informational messages (development only)
   */
  info(message: string, data?: any) {
    if (isDevelopment) {
      console.log(`ℹ️ ${message}`, data || '')
    }
  }

  /**
   * Log warning messages (development only)
   */
  warn(message: string, data?: any) {
    if (isDevelopment) {
      console.warn(`⚠️ ${message}`, data || '')
    }
  }

  /**
   * Log error messages
   * - Development: Logs to console
   * - Production: Sends to Sentry
   */
  error(message: string, error?: Error | unknown, context?: Record<string, any>) {
    if (isDevelopment) {
      console.error(`❌ ${message}`, error || '', context || '')
    } else {
      // In production, send to Sentry
      Sentry.captureException(error instanceof Error ? error : new Error(message), {
        level: 'error',
        extra: {
          message,
          context,
          errorDetails: error
        }
      })
    }
  }

  /**
   * Log debug messages (development only)
   */
  debug(message: string, data?: any) {
    if (isDevelopment) {
      console.debug(`🐛 ${message}`, data || '')
    }
  }

  /**
   * Log success messages (development only)
   */
  success(message: string, data?: any) {
    if (isDevelopment) {
      console.log(`✅ ${message}`, data || '')
    }
  }

  /**
   * Track performance metrics
   * - Development: Logs to console
   * - Production: Sends to Sentry as breadcrumb
   */
  performance(operation: string, duration: number, metadata?: Record<string, any>) {
    if (isDevelopment) {
      console.log(`⚡ ${operation} took ${duration}ms`, metadata || '')
    } else {
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `${operation} took ${duration}ms`,
        level: 'info',
        data: metadata
      })
    }
  }

  /**
   * Track user actions
   * - Development: Logs to console
   * - Production: Sends to Sentry as breadcrumb
   */
  action(action: string, metadata?: Record<string, any>) {
    if (isDevelopment) {
      console.log(`👤 User action: ${action}`, metadata || '')
    } else {
      Sentry.addBreadcrumb({
        category: 'user-action',
        message: action,
        level: 'info',
        data: metadata
      })
    }
  }

  /**
   * Track API calls
   * - Development: Logs to console
   * - Production: Sends to Sentry as breadcrumb
   */
  api(method: string, endpoint: string, status: number, duration?: number) {
    if (isDevelopment) {
      console.log(`🌐 ${method} ${endpoint} - ${status}${duration ? ` (${duration}ms)` : ''}`)
    } else {
      Sentry.addBreadcrumb({
        category: 'api',
        message: `${method} ${endpoint}`,
        level: status >= 400 ? 'error' : 'info',
        data: {
          method,
          endpoint,
          status,
          duration
        }
      })
    }
  }
}

/**
 * Singleton logger instance
 */
export const logger = new Logger()

/**
 * Capture exception to Sentry (production) or log to console (development)
 */
export function captureException(error: Error | unknown, context?: Record<string, any>) {
  if (isDevelopment) {
    console.error('❌ Exception:', error, context || '')
  } else {
    Sentry.captureException(error, {
      extra: context
    })
  }
}

/**
 * Capture message to Sentry (production) or log to console (development)
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
  if (isDevelopment) {
    const emoji = level === 'error' ? '❌' : level === 'warning' ? '⚠️' : 'ℹ️'
    console.log(`${emoji} ${message}`, context || '')
  } else {
    Sentry.captureMessage(message, {
      level,
      extra: context
    })
  }
}

/**
 * Add breadcrumb for debugging (production) or log to console (development)
 */
export function addBreadcrumb(category: string, message: string, data?: Record<string, any>) {
  if (isDevelopment) {
    console.log(`🍞 [${category}] ${message}`, data || '')
  } else {
    Sentry.addBreadcrumb({
      category,
      message,
      data
    })
  }
}

/**
 * Start a performance transaction
 * Note: Sentry v8+ uses startSpan instead of startTransaction
 */
export function startTransaction(name: string, op: string) {
  // Development: Return a mock transaction
  const startTime = Date.now()
  return {
    finish: () => {
      const duration = Date.now() - startTime
      if (isDevelopment) {
        console.log(`⚡ Transaction: ${name} (${op}) took ${duration}ms`)
      }
    },
    setStatus: () => {},
    setData: () => {},
    setTag: () => {}
  }
}

