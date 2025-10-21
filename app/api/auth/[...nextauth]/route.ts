import { handlers } from '@/lib/auth'

// Verify environment variables are set
if (!process.env.NEXTAUTH_SECRET) {
  console.error('NEXTAUTH_SECRET is not set in environment variables')
}

if (!process.env.NEXTAUTH_URL) {
  console.error('NEXTAUTH_URL is not set in environment variables')
}

export const { GET, POST } = handlers

