export default function TestEnv() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Test Page</h1>
      <p>This page tests environment variables without causing errors.</p>
      
      <div className="mt-4 space-y-2">
        <h2 className="text-lg font-semibold">Environment Variables:</h2>
        <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
        <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
        <p>RESEND_API_KEY: {process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing'}</p>
        <p>EMAIL_FROM: {process.env.EMAIL_FROM ? '✅ Set' : '❌ Missing'}</p>
      </div>
      
      <div className="mt-4">
        <p className="text-sm text-gray-600">
          If this page loads, the basic Next.js routing is working and we can see which environment variables are missing.
        </p>
      </div>
    </div>
  )
}
