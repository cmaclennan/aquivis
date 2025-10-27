import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Building2, CheckCircle2, User, Calendar, Clock, AlertTriangle, TrendingUp, Plus, Droplets } from 'lucide-react'
import Link from 'next/link'
import { SentryErrorBoundaryClass } from '@/components/ui/sentry-error-boundary'
import { PageLoadTracker } from '@/components/metrics/PageLoadTracker'
import { logger } from '@/lib/logger'

export default async function DashboardPage() {
  // Get user data from middleware headers
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const companyId = headersList.get('x-user-company-id')

  if (!userId) {
    redirect('/login')
  }

  if (!companyId) {
    return (
      <div className="p-8">
        <div className="text-center py-8">
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const supabase = createAdminClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*, companies(*)')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    logger.error('[DASHBOARD] Profile query failed', profileError)
    // Use data from headers as fallback
    const fallbackProfile = {
      id: userId,
      company_id: companyId,
      companies: null
    }
    // Continue with fallback data
  }

  let dashboardStats: any = null
  let recentServices: any[] = []
  let upcomingBookings: any[] = []

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const weekAhead = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [propCountRes, unitCountRes, totalServicesRes, todayServicesRes, weekServicesRes, issuesCountRes, recentServicesRes] = await Promise.all([
    (supabase as any)
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId),
    (supabase as any)
      .from('units')
      .select('id, properties!inner(company_id)', { count: 'exact', head: true })
      .eq('properties.company_id', companyId),
    (supabase as any)
      .from('services')
      .select('id, units!inner(properties!inner(company_id))', { count: 'exact', head: true })
      .eq('units.properties.company_id', companyId),
    (supabase as any)
      .from('services')
      .select('id, units!inner(properties!inner(company_id))', { count: 'exact', head: true })
      .eq('units.properties.company_id', companyId)
      .eq('service_date', todayStr),
    (supabase as any)
      .from('services')
      .select('id, units!inner(properties!inner(company_id))', { count: 'exact', head: true })
      .eq('units.properties.company_id', companyId)
      .gte('service_date', todayStr)
      .lt('service_date', weekAhead),
    (supabase as any)
      .from('water_tests')
      .select('id, services!inner(units!inner(properties!inner(company_id)))', { count: 'exact', head: true })
      .eq('services.units.properties.company_id', companyId)
      .eq('all_parameters_ok', false)
      .gte('test_time', sevenDaysAgo),
    (supabase as any)
      .from('services')
      .select('id, service_date, status, units:units!inner(name, properties!inner(name, company_id))')
      .eq('units.properties.company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  dashboardStats = {
    company_id: companyId,
    company_name: profile?.companies?.name || 'Company',
    property_count: propCountRes?.count || 0,
    unit_count: unitCountRes?.count || 0,
    today_services: todayServicesRes?.count || 0,
    week_services: weekServicesRes?.count || 0,
    total_services: totalServicesRes?.count || 0,
    water_quality_issues: issuesCountRes?.count || 0,
    today_bookings: 0,
    recent_services: 0,
  }

  recentServices = Array.isArray(recentServicesRes?.data) ? recentServicesRes.data : []

  try {
    const { data: bookingsData } = await (supabase as any)
      .from('bookings')
      .select(`
        *,
        units!inner(
          name,
          unit_number,
          properties!inner(name, company_id)
        )
      `)
      .eq('units.properties.company_id', companyId)
      .eq('check_in_date', todayStr)
      .order('check_in_time', { ascending: true })
      .limit(5)

    upcomingBookings = bookingsData ?? []
  } catch (error) {
    logger.debug('[DASHBOARD] Bookings query failed', error)
    upcomingBookings = []
  }

  // Calculate quick start progress using optimized data
  const hasProperties = (dashboardStats?.property_count ?? 0) > 0
  const hasUnits = (dashboardStats?.unit_count ?? 0) > 0
  const hasServices = (dashboardStats?.week_services ?? 0) > 0 // Use week_services instead of today_services
  const allStepsComplete = hasProperties && hasUnits && hasServices

  // Client-side performance tracker

  return (
    <SentryErrorBoundaryClass>
      <PageLoadTracker page="dashboard" />
    <div className="p-8">
      <div className="space-y-6">

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Properties */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Properties</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats?.property_count ?? 0}</p>
            </div>
            <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          <div className="mt-4">
            <Link 
              href="/properties" 
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View Properties →
            </Link>
            </div>
        </div>

        {/* Units */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Units</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats?.unit_count ?? 0}</p>
            </div>
            <Droplets className="h-8 w-8 text-green-600" />
            </div>
          <div className="mt-4">
            <Link 
              href="/properties" 
              className="text-sm text-green-600 hover:text-green-800 font-medium"
            >
              View Properties →
            </Link>
            </div>
        </div>

        {/* Today's Services */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Services</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats?.today_services ?? 0}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          <div className="mt-4">
            <Link 
              href="/services" 
              className="text-sm text-purple-600 hover:text-purple-800 font-medium"
            >
              View Services →
            </Link>
        </div>
      </div>

        {/* This Week's Services */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats?.week_services ?? 0}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
          <div className="mt-4">
            <Link 
              href="/services" 
              className="text-sm text-orange-600 hover:text-orange-800 font-medium"
            >
              View All →
            </Link>
            </div>
            </div>
          </div>

      {/* Water Quality Issues */}
      {dashboardStats?.water_quality_issues && dashboardStats.water_quality_issues > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Water Quality Issues</h3>
              <p className="text-red-700">
                {dashboardStats.water_quality_issues} service{dashboardStats.water_quality_issues !== 1 ? 's' : ''} with water quality issues need attention.
              </p>
            </div>
              </div>
          <div className="mt-4">
            <Link 
              href="/services?filter=water_quality_issues" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Review Issues
            </Link>
              </div>
            </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Services */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Services</h3>
              <Link 
                href="/services" 
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentServices && recentServices.length > 0 ? (
          <div className="space-y-4">
                {recentServices.map((service: any) => (
                  <div key={service.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`h-2 w-2 rounded-full ${
                        service.status === 'completed' ? 'bg-green-500' :
                        service.status === 'in_progress' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {(service.property_name ?? service.units?.properties?.name ?? 'Property')} - {(service.unit_name ?? service.units?.name ?? 'Unit')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {service.technician_name ?? ''} {service.technician_name ? '• ' : ''}{new Date(service.service_date).toLocaleDateString()}
                        </p>
              </div>
            </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      service.status === 'completed' ? 'bg-green-100 text-green-800' :
                      service.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {service.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent services</p>
                )}
              </div>
            </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Today's Check-ins</h3>
              <Link 
                href="/schedule" 
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View Schedule
              </Link>
            </div>
              </div>
          <div className="p-6">
            {upcomingBookings && upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {booking.units.properties.name} - {booking.units.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Check-in: {booking.check_in_time}
                </p>
              </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {booking.guest_name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No check-ins today</p>
            )}
            </div>
          </div>
        </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/services/new" 
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Schedule Service</span>
          </Link>
          
          <Link 
            href="/properties/new" 
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Building2 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-900">Add Property</span>
          </Link>
          
          <Link 
            href="/customers/new" 
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <User className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-900">Add Customer</span>
          </Link>
        </div>
        </div>

      </div>
    </div>
    </SentryErrorBoundaryClass>
  )
}
