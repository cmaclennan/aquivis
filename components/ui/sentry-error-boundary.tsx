'use client'

import React from 'react'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface SentryErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
  showDialog?: boolean
}

export function SentryErrorBoundary({ 
  children, 
  fallback, 
  showDialog = false 
}: SentryErrorBoundaryProps) {
  useEffect(() => {
    // Initialize Sentry error boundary
    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      Sentry.captureException(event.reason)
    }

    const uncaughtErrorHandler = (event: ErrorEvent) => {
      Sentry.captureException(event.error)
    }

    window.addEventListener('unhandledrejection', unhandledRejectionHandler)
    window.addEventListener('error', uncaughtErrorHandler)

    return () => {
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler)
      window.removeEventListener('error', uncaughtErrorHandler)
    }
  }, [])

  return <>{children}</>
}

// Enhanced error boundary with Sentry integration
export class SentryErrorBoundaryClass extends React.Component<
  SentryErrorBoundaryProps,
  { hasError: boolean; error?: Error }
> {
  constructor(props: SentryErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Capture error with Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        errorBoundary: true,
      },
    })

    // Show Sentry dialog in development
    if (this.props.showDialog && process.env.NODE_ENV === 'development') {
      Sentry.showReportDialog()
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              We've been notified about this error and are working to fix it. 
              Please try refreshing the page.
            </p>
            <button
              onClick={this.resetError}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Utility functions for manual error reporting
export const reportError = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    tags: {
      manual: true,
    },
    extra: context,
  })
}

export const reportMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.captureMessage(message, level)
}

// Performance monitoring integration - using breadcrumbs

export const addBreadcrumb = (message: string, category?: string, level?: 'info' | 'warning' | 'error') => {
  Sentry.addBreadcrumb({
    message,
    category: category || 'user',
    level: level || 'info',
  })
}
