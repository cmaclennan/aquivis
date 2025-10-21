import { createClient } from '@/lib/supabase/server'
import { cookies, headers } from 'next/headers'

export default async function DebugAuthPage() {
  const cookieStore = await cookies()
  const headersList = await headers()
  const supabase = await createClient()

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  const allCookies = cookieStore.getAll()
  const supabaseCookies = allCookies.filter(c =>
    c.name.includes('supabase') || c.name.includes('sb-')
  )

  // Get request info
  const host = headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') || 'http'
  const userAgent = headersList.get('user-agent')
  const referer = headersList.get('referer')

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug Info</h1>
      
      <div className="space-y-6">
        {/* Session Info */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Session</h2>
          {sessionError ? (
            <div className="text-red-600">
              <p className="font-semibold">Error:</p>
              <pre className="text-sm">{JSON.stringify(sessionError, null, 2)}</pre>
            </div>
          ) : session ? (
            <div className="text-green-600">
              <p className="font-semibold">✓ Session exists</p>
              <pre className="text-sm text-gray-700 mt-2">{JSON.stringify(session, null, 2)}</pre>
            </div>
          ) : (
            <div className="text-yellow-600">
              <p className="font-semibold">⚠ No session found</p>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">User</h2>
          {userError ? (
            <div className="text-red-600">
              <p className="font-semibold">Error:</p>
              <pre className="text-sm">{JSON.stringify(userError, null, 2)}</pre>
            </div>
          ) : user ? (
            <div className="text-green-600">
              <p className="font-semibold">✓ User authenticated</p>
              <pre className="text-sm text-gray-700 mt-2">{JSON.stringify(user, null, 2)}</pre>
            </div>
          ) : (
            <div className="text-yellow-600">
              <p className="font-semibold">⚠ No user found</p>
            </div>
          )}
        </div>

        {/* Cookies */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Supabase Cookies</h2>
          {supabaseCookies.length > 0 ? (
            <div>
              <p className="text-green-600 font-semibold mb-2">✓ {supabaseCookies.length} cookie(s) found</p>
              <div className="space-y-2">
                {supabaseCookies.map((cookie) => (
                  <div key={cookie.name} className="text-sm">
                    <p className="font-semibold">{cookie.name}</p>
                    <p className="text-gray-600 truncate">{cookie.value.substring(0, 50)}...</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-yellow-600">
              <p className="font-semibold">⚠ No Supabase cookies found</p>
            </div>
          )}
        </div>

        {/* Request Info */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Request Info</h2>
          <div className="text-sm space-y-1">
            <p><span className="font-semibold">Host:</span> {host}</p>
            <p><span className="font-semibold">Protocol:</span> {protocol}</p>
            <p><span className="font-semibold">Full URL:</span> {protocol}://{host}/debug-auth</p>
            <p><span className="font-semibold">Referer:</span> {referer || 'None'}</p>
            <p><span className="font-semibold">User Agent:</span> {userAgent?.substring(0, 50)}...</p>
          </div>
        </div>

        {/* Environment */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Environment</h2>
          <div className="text-sm space-y-1">
            <p><span className="font-semibold">Supabase URL:</span> {process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ NOT SET'}</p>
            <p><span className="font-semibold">Anon Key:</span> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : '❌ NOT SET'}</p>
            <p><span className="font-semibold">Node ENV:</span> {process.env.NODE_ENV}</p>
            <p><span className="font-semibold">Vercel ENV:</span> {process.env.VERCEL_ENV || 'Not on Vercel'}</p>
          </div>
        </div>

        {/* All Cookies (for debugging) */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">All Cookies ({allCookies.length})</h2>
          <div className="text-sm space-y-1 max-h-60 overflow-y-auto">
            {allCookies.map((cookie) => (
              <div key={cookie.name} className="border-b pb-1">
                <p className="font-semibold">{cookie.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

