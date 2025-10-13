'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setDebugInfo(null)

    // Capture detailed debug information
    const debugData = {
      timestamp: new Date().toISOString(),
      email,
      firstName,
      lastName,
      passwordLength: password.length,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      step: 'starting_signup'
    }

    try {
      console.log('🔍 SIGNUP DEBUG - Starting signup process:', debugData)
      
      // Create auth user (trigger will auto-create profile)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      })

      // Enhanced debug information
      const enhancedDebug = {
        ...debugData,
        step: 'signup_response_received',
        hasData: !!data,
        hasError: !!signUpError,
        userExists: !!data?.user,
        userId: data?.user?.id,
        userEmail: data?.user?.email,
        userConfirmed: !!data?.user?.email_confirmed_at,
        identitiesCount: data?.user?.identities?.length || 0,
        errorMessage: signUpError?.message,
        errorCode: signUpError?.code,
        errorStatus: signUpError?.status
      }

      console.log('🔍 SIGNUP DEBUG - Response received:', enhancedDebug)
      setDebugInfo(enhancedDebug)

      if (signUpError) {
        console.error('❌ SIGNUP DEBUG - Signup error:', signUpError)
        throw signUpError
      }

      if (data.user) {
        console.log('✅ SIGNUP DEBUG - User created successfully:', data.user.id)
        
        // Check if email confirmation is required
        if (data.user.identities && data.user.identities.length === 0) {
          // Email confirmation required
          console.log('📧 SIGNUP DEBUG - Email confirmation required')
          setSuccess(true)
        } else {
          // No confirmation needed (or already confirmed)
          console.log('✅ SIGNUP DEBUG - No confirmation needed, creating profile...')
          
          // Create profile manually since trigger has timing issues
          const { data: profileResult, error: profileError } = await supabase
            .rpc('ensure_user_profile', {
              user_id: data.user.id,
              user_email: data.user.email || email,
              first_name: firstName,
              last_name: lastName
            })
          
          if (profileError) {
            console.error('❌ SIGNUP DEBUG - Profile creation failed:', profileError)
            setError('Failed to create user profile. Please try again.')
          } else {
            console.log('✅ SIGNUP DEBUG - Profile created successfully, redirecting to onboarding')
            const redirect = params.get('redirect')
            router.push(redirect || '/onboarding')
          }
        }
      } else {
        console.log('⚠️ SIGNUP DEBUG - No user in response data')
      }
    } catch (err: any) {
      console.error('❌ SIGNUP DEBUG - Exception caught:', err)
      
      const errorDebug = {
        ...debugData,
        step: 'exception_caught',
        errorType: err.constructor.name,
        errorMessage: err.message,
        errorCode: err.code,
        errorStatus: err.status,
        errorDetails: err.details,
        errorHint: err.hint,
        errorStack: err.stack
      }
      
      console.error('❌ SIGNUP DEBUG - Full error details:', errorDebug)
      setDebugInfo(errorDebug)
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-accent-50">
      <div className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-16 w-16">
            <img 
              src="/logo-192.png" 
              alt="Aquivis Logo" 
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Aquivis</h1>
          <p className="mt-2 text-sm text-gray-600">Pool Service Management</p>
        </div>

        {/* Signup Form */}
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">Create Account</h2>

          {success && (
            <div className="mb-4 rounded-lg bg-success-light p-4 text-sm text-success">
              <h3 className="font-semibold mb-2">✓ Account Created!</h3>
              <p className="mb-2">
                We&apos;ve sent a confirmation email to <strong>{email}</strong>
              </p>
              <p className="text-xs">
                Please check your inbox and click the confirmation link to activate your account, then return here to log in.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-error-light p-3 text-sm text-error">
              {error}
            </div>
          )}

          {debugInfo && (
            <div className="mb-4 rounded-lg bg-gray-100 p-3 text-xs">
              <h4 className="font-semibold mb-2">🔍 Debug Information:</h4>
              <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-40">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="your.email@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <a href="/login" className="font-medium text-primary hover:text-primary-600">
              Sign in
            </a>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-500">
          By signing up, you agree to our Terms of Service
        </p>
      </div>
    </div>
  )
}

