import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, companies(*)')
    .eq('id', user!.id)
    .single()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back, {profile?.first_name}!
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Properties</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
              <span className="text-2xl">🏢</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            <a href="/properties" className="text-primary hover:text-primary-600">
              Add your first property →
            </a>
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Services Today</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-light">
              <span className="text-2xl">✓</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">No services scheduled</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Team Members</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">1</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-100">
              <span className="text-2xl">👤</span>
            </div>
          </div>
          {profile?.role === 'owner' && (
            <p className="mt-4 text-sm text-gray-600">
              <a href="/team" className="text-primary hover:text-primary-600">
                Invite team members →
              </a>
            </p>
          )}
        </div>
      </div>

      {/* Quick Start */}
      <div className="mt-8 rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900">Quick Start</h2>
        <p className="mt-2 text-sm text-gray-600">Get started with Aquivis in 3 easy steps</p>

        <div className="mt-6 space-y-4">
          <div className="flex items-start space-x-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
              1
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Add Your First Property</h3>
              <p className="text-sm text-gray-600">Start by adding a property you service</p>
              <a href="/properties" className="mt-2 inline-block text-sm text-primary hover:text-primary-600">
                Go to Properties →
              </a>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-500">
              2
            </div>
            <div>
              <h3 className="font-medium text-gray-500">Add Pools/Units</h3>
              <p className="text-sm text-gray-500">Add pools, spas, or units to your property</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-500">
              3
            </div>
            <div>
              <h3 className="font-medium text-gray-500">Start Servicing</h3>
              <p className="text-sm text-gray-500">Log your first service and water test</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="mt-8 rounded-lg border border-primary-200 bg-primary-50 p-6">
        <h3 className="font-medium text-primary-900">✨ Aquivis is Ready!</h3>
        <p className="mt-2 text-sm text-primary-700">
          Your pool service management platform is set up with:
        </p>
        <ul className="mt-3 space-y-1 text-sm text-primary-700">
          <li>✓ QLD Health compliance tracking</li>
          <li>✓ Mobile-optimized service forms</li>
          <li>✓ Real-time operations dashboard</li>
          <li>✓ Chemical cheat sheet reference</li>
          <li>✓ Secure role-based access</li>
        </ul>
      </div>
    </div>
  )
}

