'use client'

export const dynamic = 'force-dynamic'
import { Suspense } from 'react'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { customerPortalLoginAction } from './actions'

function CustomerLoginInner() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const params = useSearchParams()

  const handleLogin = async (formData: FormData) => {
    setError(null)

    startTransition(async () => {
      const result = await customerPortalLoginAction(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success && result?.redirectTo) {
        // Client-side redirect after successful login
        router.push(result.redirectTo)
      }
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-accent-50">
      <div className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-16 w-16 relative">
            <Image src="/logo-192.png" alt="Aquivis Logo" width={64} height={64} className="object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Aquivis</h1>
          <p className="mt-1 text-sm text-gray-600">Customer Portal Sign In</p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-md border border-gray-200">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">Sign In</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-error-light p-3 text-sm text-error">
              {error}
            </div>
          )}

          <form action={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
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

          <div className="mt-6 text-center text-xs text-gray-500">
            Not a customer? <Link href="/login" className="text-primary hover:text-primary-600">Subscriber sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <CustomerLoginInner />
    </Suspense>
  )
}


