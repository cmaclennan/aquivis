'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugCookiesPage() {
  const [cookies, setCookies] = useState<any[]>([])
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkCookies = async () => {
      try {
        // Get all cookies from document
        const allCookies = document.cookie.split(';').map(c => {
          const [name, value] = c.trim().split('=')
          return { name, value }
        })
        setCookies(allCookies)

        // Get session from Supabase
        const supabase = createClient()
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
        }
        
        setSession(session)
        setLoading(false)
      } catch (error) {
        console.error('Error checking cookies:', error)
        setLoading(false)
      }
    }

    checkCookies()
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">🔍 Cookie Debug Page</h1>

      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Session Status</h2>
        {session ? (
          <div className="space-y-2">
            <p className="text-green-600">✅ Session found</p>
            <p><strong>User ID:</strong> {session.user?.id}</p>
            <p><strong>Email:</strong> {session.user?.email}</p>
            <p><strong>Expires at:</strong> {new Date(session.expires_at * 1000).toLocaleString()}</p>
          </div>
        ) : (
          <p className="text-red-600">❌ No session found</p>
        )}
      </div>

      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Cookies ({cookies.length})</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {cookies.length === 0 ? (
            <p className="text-gray-600">No cookies found</p>
          ) : (
            cookies.map((cookie, i) => (
              <div key={i} className="p-2 bg-white rounded border border-gray-200">
                <p><strong>{cookie.name}</strong></p>
                <p className="text-sm text-gray-600 break-all">{cookie.value?.substring(0, 100)}...</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-4 bg-yellow-50 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Instructions</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Log in to the app</li>
          <li>Navigate to this page: /debug-cookies</li>
          <li>Check if session is found and cookies are present</li>
          <li>Click a navigation link (e.g., Properties)</li>
          <li>If redirected to login, cookies were lost</li>
          <li>Share this information with support</li>
        </ol>
      </div>
    </div>
  )
}

