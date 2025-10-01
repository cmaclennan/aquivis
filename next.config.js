/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use App Router
  experimental: {
    // Future flags for stability
  },
  
  // Image optimization
  images: {
    domains: ['krxabrdizqbpitpsvgiv.supabase.co'], // Supabase storage
    formats: ['image/webp', 'image/avif'],
  },
  
  // PWA support (will add next-pwa later)
  
  // Strict mode for catching issues early
  reactStrictMode: true,
  
  // Environment variables available to client
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
}

module.exports = nextConfig

