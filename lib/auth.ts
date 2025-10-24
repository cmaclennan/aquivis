import NextAuth from 'next-auth'
import { cookies, headers } from 'next/headers'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Validate required environment variables
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || process.env.AUTH_URL

if (!AUTH_SECRET) {
  throw new Error('AUTH_SECRET/NEXTAUTH_SECRET is not set')
}

if (!NEXTAUTH_URL) {
  throw new Error('NEXTAUTH_URL/AUTH_URL is not set')
}

export const authOptions = {
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
        const { email, password } = (credentials || {}) as Record<'email' | 'password', string>
        if (!email || !password) {
          throw new Error('Email and password required')
        }

        try {
          if (process.env.E2E_TEST_MODE === '1') {
            if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
              throw new Error('Configuration: Missing Supabase URL')
            }
            if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
              throw new Error('Configuration: Missing service role key')
            }
            const supabaseAdmin = createSupabaseClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL,
              process.env.SUPABASE_SERVICE_ROLE_KEY,
              { auth: { autoRefreshToken: false, persistSession: false } }
            )
            const { data: profile, error: profileError } = await supabaseAdmin
              .from('profiles')
              .select('id, email, role, company_id')
              .eq('email', email)
              .single()
            if (profileError || !profile) {
              throw new Error('Invalid credentials')
            }
            return {
              id: profile.id,
              email: profile.email,
              role: profile.role || 'user',
              company_id: profile.company_id,
            }
          }

          // Validate environment variables
          if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
            throw new Error('Configuration: Missing Supabase URL')
          }

          if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Configuration: Missing service role key')
          }

          // Use Supabase Admin client for BOTH profile query AND password verification
          // This avoids the cookie-based server client which can cause issues
          const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
              auth: {
                autoRefreshToken: false,
                persistSession: false
              }
            }
          )

          // Query the profiles table directly to verify user exists
          const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, email, role, company_id')
            .eq('email', email)
            .single()

          if (profileError || !profile) {
            throw new Error('Invalid credentials')
          }

          // Verify password using admin client
          const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password,
          })

          if (authError || !authData.user) {
            throw new Error('Invalid credentials')
          }

          // Return user object for NextAuth JWT (NO Supabase session created)
          return {
            id: profile.id,
            email: profile.email,
            role: profile.role || 'user',
            company_id: profile.company_id,
          }
        } catch (error) {
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
        token.email = user.email
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
    strategy: 'jwt' as const,
    maxAge: 60 * 60 * 24, // 24 hours
  },
  jwt: {
    maxAge: 60 * 60 * 24, // 24 hours
  },
  secret: AUTH_SECRET,
  trustHost: true,
}

const AuthKit = NextAuth(authOptions)
export const { handlers, signIn, signOut } = AuthKit

export async function auth(...args: any[]) {
  try {
    const hdrs = await headers()
    const testMode = process.env.E2E_TEST_MODE === '1' && hdrs.get('x-e2e-bypass') === '1'

    if (testMode) {
      // 1) If explicit identity headers are present, synthesize a session
      const idFromHdr = hdrs.get('x-user-id') || undefined
      if (idFromHdr) {
        return {
          user: {
            id: idFromHdr,
            email: hdrs.get('x-user-email') || '',
            role: hdrs.get('x-user-role') || 'user',
            company_id: (hdrs.get('x-user-company-id') as string) || null,
          },
        } as any
      }

      // 2) Fallback to e2e-auth cookie if provided
      const store = await cookies()
      let raw = store.get('e2e-auth')?.value
      if (!raw) {
        const cookieHeader = hdrs.get('cookie') || ''
        const match = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith('e2e-auth='))
        if (match) raw = decodeURIComponent(match.slice('e2e-auth='.length))
      }
      if (raw) {
        let payload: { id?: string; email?: string; role?: string; company_id?: string } | null = null
        try { payload = JSON.parse(raw) } catch {}
        if (!payload) {
          try { payload = JSON.parse(decodeURIComponent(raw)) } catch {}
        }
        if (payload?.id) {
          return {
            user: {
              id: payload.id,
              email: payload.email || '',
              role: payload.role || 'user',
              company_id: payload.company_id || null,
            },
          } as any
        }
      }
    }
  } catch {}
  // Fallback to real NextAuth auth
  // @ts-expect-error - forwarding optional args as NextAuth's auth signature can vary
  return AuthKit.auth(...args)
}

