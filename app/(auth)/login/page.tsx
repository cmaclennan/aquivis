'use client'

export const dynamic = 'force-dynamic'
import { Suspense } from 'react'

import { useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { loginAction } from './actions'

function LoginInner() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const params = useSearchParams()
  const isTimeout = params.get('timeout') === 'true'

  const handleLogin = async (formData: FormData) => {
    setError(null)

    startTransition(async () => {
      const result = await loginAction(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-accent-50">
      <div className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-16 w-16 relative">
            <Image 
              src="/logo-192.png" 
              alt="Aquivis Logo" 
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Aquivis</h1>
          <p className="mt-2 text-sm text-gray-600">Pool Service Management</p>
        </div>

        {/* Login Form */}
        <div className="rounded-xl bg-white p-8 shadow-md border border-gray-200">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">Sign In</h2>

          {isTimeout && (
            <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Your session has expired due to inactivity. Please sign in again.</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-error-light p-3 text-sm text-error">
              {error}
            </div>
          )}

          <form action={handleLogin} className="space-y-4">
            <input
              type="hidden"
              name="redirect"
              value={params.get('redirect') || '/dashboard'}
            />

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
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
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
            >
              {isPending ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Don&apos;t have an account? </span>
            <Link href="/signup" className="font-medium text-primary hover:text-primary-600">
              Sign up
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link href="/customer-portal/login" className="text-sm text-gray-600 hover:text-primary">
              Customer Portal →
            </Link>
          </div>
          
          <div className="mt-2 text-center">
            <Link href="/super-admin-login" className="text-xs text-gray-400 hover:text-gray-600">
              Admin Access
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-500">
          QLD Health Compliant • Secure • Professional
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <LoginInner />
    </Suspense>
  )
}

