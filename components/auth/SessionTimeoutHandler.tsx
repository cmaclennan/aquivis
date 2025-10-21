'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'

interface SessionTimeoutHandlerProps {
  /**
   * Warning time in minutes before session expires
   * Default: 5 minutes
   */
  warningMinutes?: number
  
  /**
   * Session timeout in minutes
   * Default: 60 minutes (1 hour)
   */
  timeoutMinutes?: number
  
  /**
   * Whether to show a warning dialog before timeout
   * Default: true
   */
  showWarning?: boolean
}

export function SessionTimeoutHandler({
  warningMinutes = 5,
  timeoutMinutes = 60,
  showWarning = true
}: SessionTimeoutHandlerProps = {}) {
  const [showWarningDialog, setShowWarningDialog] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let warningTimer: NodeJS.Timeout
    let logoutTimer: NodeJS.Timeout
    let countdownInterval: NodeJS.Timeout
    let activityListeners: (() => void)[] = []

    const resetTimers = () => {
      // Clear existing timers
      if (warningTimer) clearTimeout(warningTimer)
      if (logoutTimer) clearTimeout(logoutTimer)
      if (countdownInterval) clearInterval(countdownInterval)
      setShowWarningDialog(false)

      // Set warning timer
      const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000
      warningTimer = setTimeout(() => {
        if (showWarning) {
          setShowWarningDialog(true)
          setTimeRemaining(warningMinutes * 60)
          
          // Start countdown
          countdownInterval = setInterval(() => {
            setTimeRemaining(prev => {
              if (prev <= 1) {
                clearInterval(countdownInterval)
                return 0
              }
              return prev - 1
            })
          }, 1000)
        }
      }, warningMs)

      // Set logout timer
      const logoutMs = timeoutMinutes * 60 * 1000
      logoutTimer = setTimeout(async () => {
        await handleLogout()
      }, logoutMs)
    }

    const handleLogout = async () => {
      // Clear all timers
      if (warningTimer) clearTimeout(warningTimer)
      if (logoutTimer) clearTimeout(logoutTimer)
      if (countdownInterval) clearInterval(countdownInterval)
      
      // Sign out
      await supabase.auth.signOut()
      
      // Redirect to login with timeout message
      router.push('/login?timeout=true')
    }

    const handleActivity = () => {
      // Reset timers on user activity
      resetTimers()
    }

    const handleExtendSession = async () => {
      // Refresh the session
      const { error } = await supabase.auth.refreshSession()

      if (error) {
        logger.error('Failed to refresh session', error)
        await handleLogout()
      } else {
        // Reset timers after successful refresh
        resetTimers()
      }
    }

    // Initialize timers
    resetTimers()

    // Add activity listeners
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      const listener = () => handleActivity()
      window.addEventListener(event, listener)
      activityListeners.push(() => window.removeEventListener(event, listener))
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      } else if (event === 'TOKEN_REFRESHED') {
        resetTimers()
      }
    })

    // Cleanup
    return () => {
      if (warningTimer) clearTimeout(warningTimer)
      if (logoutTimer) clearTimeout(logoutTimer)
      if (countdownInterval) clearInterval(countdownInterval)
      activityListeners.forEach(cleanup => cleanup())
      subscription.unsubscribe()
    }
  }, [timeoutMinutes, warningMinutes, showWarning, router, supabase])

  const handleStayLoggedIn = async () => {
    // Refresh the session
    const { error } = await supabase.auth.refreshSession()

    if (error) {
      logger.error('Failed to refresh session', error)
      await supabase.auth.signOut()
      router.push('/login?timeout=true')
    } else {
      setShowWarningDialog(false)
    }
  }

  const handleLogoutNow = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!showWarningDialog) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Session Expiring Soon
          </h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          Your session will expire in <span className="font-bold text-red-600">{formatTime(timeRemaining)}</span> due to inactivity.
        </p>
        
        <p className="text-sm text-gray-500 mb-6">
          Would you like to stay logged in?
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={handleStayLoggedIn}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
          >
            Stay Logged In
          </button>
          <button
            onClick={handleLogoutNow}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 font-medium transition-colors"
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  )
}

