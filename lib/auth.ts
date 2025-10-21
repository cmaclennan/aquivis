import NextAuth, { type NextAuthOptions } from 'next-auth'
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
            .eq('email', credentials.email)
            .single()

          if (profileError || !profile) {
            throw new Error('Invalid credentials')
          }

          // Verify password using admin client
          const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
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

