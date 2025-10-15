const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Safe experimental features for performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  // External packages for server components
  serverExternalPackages: ['@supabase/ssr'],
  
  // Skip TypeScript checking during build (temporary)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Bundle analyzer (uncomment to analyze bundle size)
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     config.resolve.fallback = {
  //       ...config.resolve.fallback,
  //       fs: false,
  //     };
  //   }
  //   return config;
  // },
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ]
  },
}

// Sentry configuration
const sentryWebpackPluginOptions = {
  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,
  // Disable tunnel to avoid 403s unless explicitly configured server-side
  // tunnelRoute: '/monitoring',
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
  // Enables automatic instrumentation of Vercel Cron Monitors
  automaticVercelMonitors: true,
}

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions)
