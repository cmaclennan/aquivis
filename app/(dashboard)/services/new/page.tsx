'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function NewServicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get unit parameter if it exists
    const unitParam = searchParams.get('unit')
    
    // Redirect to guided flow with unit parameter if provided
    if (unitParam) {
      router.replace(`/services/new-guided?unit=${unitParam}`)
    } else {
      router.replace('/services/new-guided')
    }
    // Run only once on mount; avoid re-exec due to searchParams object identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Show loading state while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-gray-600">Redirecting to guided service flow...</p>
      </div>
    </div>
  )
}