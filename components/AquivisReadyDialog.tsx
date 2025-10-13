'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Check, X } from 'lucide-react'

export default function AquivisReadyDialog() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has seen this dialogue before
    const hasSeenDialog = localStorage.getItem('aquivis-ready-seen')
    if (!hasSeenDialog) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('aquivis-ready-seen', 'true')
  }

  if (!isVisible) return null

  return (
    <div className="mt-8 rounded-lg border border-primary-200 bg-primary-50 p-6 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-primary-600 hover:text-primary-800"
        aria-label="Dismiss"
      >
        <X className="h-5 w-5" />
      </button>
      
      <div className="flex items-center space-x-2">
        <Sparkles className="h-5 w-5 text-primary-700" />
        <h3 className="font-medium text-primary-900">Aquivis is Ready!</h3>
      </div>
      <p className="mt-2 text-sm text-primary-700">
        Your pool service management platform is set up with:
      </p>
      <ul className="mt-3 space-y-2 text-sm text-primary-700">
        <li className="flex items-center space-x-2">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span>QLD Health compliance tracking</span>
        </li>
        <li className="flex items-center space-x-2">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span>Mobile-optimized service forms</span>
        </li>
        <li className="flex items-center space-x-2">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span>Real-time operations dashboard</span>
        </li>
        <li className="flex items-center space-x-2">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span>Chemical cheat sheet reference</span>
        </li>
        <li className="flex items-center space-x-2">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span>Secure role-based access</span>
        </li>
      </ul>
    </div>
  )
}






