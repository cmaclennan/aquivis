import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Set environment
  environment: process.env.NODE_ENV,
  
  // Add release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
})
