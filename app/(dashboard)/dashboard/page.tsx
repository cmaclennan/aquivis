import { createClient } from '@/lib/supabase/server'
import { Building2, CheckCircle2, User, Check, Calendar, Clock, AlertTriangle, TrendingUp, Plus, Droplets } from 'lucide-react'
import AquivisReadyDialog from '@/components/AquivisReadyDialog'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, companies(*)')
    .eq('id', user!.id)
    .single()

  // Get actual property count
  const { count: propertyCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', profile!.company_id)

  // Get unit count
  const { count: unitCount } = await supabase
    .from('units')
    .select('*, properties!inner(*)', { count: 'exact', head: true })
    .eq('properties.company_id', profile!.company_id)

  // Get today's services
  const today = new Date().toISOString().split('T')[0]
  const { count: todayServiceCount } = await supabase
    .from('services')
    .select('*, units!inner(properties!inner(*))', { count: 'exact', head: true })
    .eq('units.properties.company_id', profile!.company_id)
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lt('created_at', `${today}T23:59:59.999Z`)

  // Get recent services (last 5)
  const { data: recentServices } = await supabase
    .from('services')
    .select(`
      *,
      unit:units!inner(name, unit_type, properties!inner(name))
    `)
    .eq('units.properties.company_id', profile!.company_id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get this week's service count
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const { count: weekServiceCount } = await supabase
    .from('services')
    .select('*, units!inner(properties!inner(*))', { count: 'exact', head: true })
    .eq('units.properties.company_id', profile!.company_id)
    .gte('created_at', weekStart.toISOString())

  // Get water quality issues (services with water test issues)
  const { data: waterQualityIssues } = await supabase
    .from('services')
    .select(`
      *,
      unit:units!inner(name, unit_type, properties!inner(name)),
      water_tests(all_parameters_ok)
    `)
    .eq('units.properties.company_id', profile!.company_id)
    .eq('water_tests.all_parameters_ok', false)
    .order('created_at', { ascending: false })
    .limit(3)

  // Get upcoming bookings (check-ins today)
  const { data: upcomingBookings } = await supabase
    .from('bookings')
    .select(`
      *,
      unit:units!inner(name, unit_type, properties!inner(name, has_individual_units))
    `)
    .eq('unit.properties.company_id', profile!.company_id)
    .eq('unit.properties.has_individual_units', true)
    .eq('check_in_date', today)
    .order('check_in_date', { ascending: true })
    .limit(5)

  // Calculate quick start progress
  const hasProperties = (propertyCount ?? 0) > 0
  const hasUnits = (unitCount ?? 0) > 0
  const hasServices = (todayServiceCount ?? 0) > 0
  const allStepsComplete = hasProperties && hasUnits && hasServices

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
              <p className="mt-2 text-3xl font-bold text-gray-900">{propertyCount ?? 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
          </div>
          {!hasProperties && (
            <p className="mt-4 text-sm text-gray-600">
              <Link href="/properties/new" className="text-primary hover:text-primary-600">
                Add your first property →
              </Link>
            </p>
          )}
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Services Today</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{todayServiceCount ?? 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-light">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            {(todayServiceCount ?? 0) > 0 ? `${todayServiceCount} service${(todayServiceCount ?? 0) > 1 ? 's' : ''} completed` : 'No services completed today'}
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Team Members</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">1</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-100">
              <User className="h-6 w-6 text-accent-700" />
            </div>
          </div>
          {profile?.role === 'owner' && (
            <p className="mt-4 text-sm text-gray-600">
              <Link href="/team" className="text-primary hover:text-primary-600">
                Invite team members →
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Enhanced Dashboard Widgets */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Today's Schedule */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
            <Link
              href="/schedule"
              className="text-sm text-primary hover:text-primary-600"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingBookings && upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking: any) => (
                <div key={booking.id} className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Check-in: {booking.unit.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {booking.unit.properties.name}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <Calendar className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No check-ins today</p>
                <Link
                  href="/schedule"
                  className="mt-2 inline-block text-sm text-primary hover:text-primary-600"
                >
                  View Schedule →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link
              href="/services"
              className="text-sm text-primary hover:text-primary-600"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {recentServices && recentServices.length > 0 ? (
              recentServices.map((service: any) => (
                <div key={service.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {service.service_type.replace('_', ' ')} - {service.unit.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {service.unit.properties.name} • {new Date(service.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <Droplets className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No recent services</p>
                <Link
                  href="/services/new-guided"
                  className="mt-2 inline-block text-sm text-primary hover:text-primary-600"
                >
                  Log Service →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Water Quality Alerts */}
        {waterQualityIssues && waterQualityIssues.length > 0 && (
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Water Quality Alerts</h2>
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="space-y-3">
              {waterQualityIssues.map((service: any) => (
                <div key={service.id} className="flex items-center space-x-3 p-3 rounded-lg bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {service.unit.name} - Water Quality Issue
                    </p>
                    <p className="text-xs text-gray-600">
                      {service.unit.properties.name} • {new Date(service.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Summary */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">This Week</h2>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Services Completed</span>
              <span className="text-lg font-semibold text-gray-900">{weekServiceCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Today's Services</span>
              <span className="text-lg font-semibold text-gray-900">{todayServiceCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Properties</span>
              <span className="text-lg font-semibold text-gray-900">{propertyCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Units</span>
              <span className="text-lg font-semibold text-gray-900">{unitCount ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/services/new-guided"
            className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary-50 transition-colors"
          >
            <Plus className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-gray-900">Log Service</span>
          </Link>
          <Link
            href="/schedule"
            className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary-50 transition-colors"
          >
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-gray-900">View Schedule</span>
          </Link>
          <Link
            href="/properties"
            className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary-50 transition-colors"
          >
            <Building2 className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-gray-900">Manage Properties</span>
          </Link>
          <Link
            href="/reports"
            className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary-50 transition-colors"
          >
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-gray-900">View Reports</span>
          </Link>
        </div>
      </div>

      {/* Aquivis Ready Dialog - Only shows once */}
      <AquivisReadyDialog />
    </div>
  )
}

