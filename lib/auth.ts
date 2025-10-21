import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createClient } from '@/lib/supabase/server'
import logger from '@/lib/logger'

// Validate required environment variables
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || process.env.AUTH_URL

if (!AUTH_SECRET) {
  throw new Error('AUTH_SECRET/NEXTAUTH_SECRET is not set')
}

if (!NEXTAUTH_URL) {
  throw new Error('NEXTAUTH_URL/AUTH_URL is not set')
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        try {
          // Validate environment variables
          if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
            logger.error('[auth] NEXT_PUBLIC_SUPABASE_URL is not set')
            throw new Error('Configuration error: Missing Supabase URL')
          }

          if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            logger.error('[auth] SUPABASE_SERVICE_ROLE_KEY is not set')
            throw new Error('Configuration error: Missing service role key')
          }

          const supabase = await createClient()

          // Query the profiles table directly to verify user exists
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, role, company_id')
            .eq('email', credentials.email)
            .single()

          if (profileError) {
            logger.error('[auth] Profile query error', profileError)
            throw new Error('Invalid credentials')
          }

          if (!profile) {
            logger.error('[auth] No profile found for email', new Error('Profile not found'), { email: credentials.email })
            throw new Error('Invalid credentials')
          }

          // Use Supabase Admin API to verify password ONLY
          const { createClient: createAdminClient } = await import('@supabase/supabase-js')
          const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
              auth: {
                autoRefreshToken: false,
                persistSession: false
              }
            }
          )

          // Verify password using admin client
          const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (authError) {
            logger.error('[auth] Password verification error', authError, { email: credentials.email })
            throw new Error('Invalid credentials')
          }

          if (!authData.user) {
            logger.error('[auth] No user returned from password verification', new Error('No user data'))
            throw new Error('Invalid credentials')
          }

          logger.info('[auth] Login successful', { email: credentials.email })

          // Return user object for NextAuth JWT (NO Supabase session created)
          return {
            id: profile.id,
            email: profile.email,
            role: profile.role || 'user',
            company_id: profile.company_id,
          }
        } catch (error) {
          logger.error('[auth] Authorization error', error)
          throw new Error(error instanceof Error ? error.message : 'Authentication failed')
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.company_id = user.company_id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.company_id = token.company_id as string
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24, // 24 hours
  },
  jwt: {
    maxAge: 60 * 60 * 24, // 24 hours
  },
  secret: AUTH_SECRET,
  trustHost: true,
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)

