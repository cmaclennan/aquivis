'use client'

import { useDashboardStats } from '@/lib/performance-optimizations'
import { Building2, CheckCircle2, User, Check, Calendar, Clock, AlertTriangle, TrendingUp, Plus, Droplets } from 'lucide-react'
import AquivisReadyDialog from '@/components/AquivisReadyDialog'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// Optimized dashboard using React Query and optimized views
export default function DashboardPageOptimized() {
  const supabase = createClient()
  
  // Use optimized dashboard stats hook
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats()
  
  // Get recent services using optimized view
  const { data: recentServices, isLoading: servicesLoading } = useQuery({
    queryKey: ['recent-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services_optimized')
        .select('*')
        .order('service_date', { ascending: false })
        .limit(5)
      
      if (error) throw error
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
  
  // Get water quality issues using optimized view
  const { data: waterQualityIssues, isLoading: qualityLoading } = useQuery({
    queryKey: ['water-quality-issues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services_optimized')
        .select('*')
        .eq('all_parameters_ok', false)
        .order('service_date', { ascending: false })
        .limit(3)
      
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  
  // Get upcoming bookings
  const { data: upcomingBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['upcoming-bookings'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          unit:units!inner(name, unit_type, properties!inner(name, has_individual_units))
        `)
        .eq('unit.properties.has_individual_units', true)
        .eq('check_in_date', today)
        .order('check_in_date', { ascending: true })
        .limit(5)
      
      if (error) throw error
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  // Loading state
  if (statsLoading || servicesLoading || qualityLoading || bookingsLoading) {
    return <DashboardSkeleton />
  }

  // Error state
  if (statsError) {
    return <ErrorBoundary error={statsError} />
  }

  const statsData = stats || {
    property_count: 0,
    unit_count: 0,
    today_services: 0,
    week_services: 0,
    water_quality_issues: 0,
    today_bookings: 0,
    recent_services: 0
  }

  // Calculate quick start progress
  const hasProperties = statsData.property_count > 0
  const hasUnits = statsData.unit_count > 0
  const hasServices = statsData.today_services > 0
  const allStepsComplete = hasProperties && hasUnits && hasServices

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back! Here's your business overview.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Properties</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{statsData.property_count}</p>
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
              <p className="mt-2 text-3xl font-bold text-gray-900">{statsData.today_services}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-light">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            {statsData.today_services > 0 ? `${statsData.today_services} service${statsData.today_services > 1 ? 's' : ''} completed` : 'No services completed today'}
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
          <p className="mt-4 text-sm text-gray-600">
            <Link href="/team" className="text-primary hover:text-primary-600">
              Invite team members →
            </Link>
          </p>
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
                      {service.service_type?.replace('_', ' ')} - {service.unit_name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {service.property_name} • {new Date(service.service_date).toLocaleDateString()}
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
                      {service.unit_name} - Water Quality Issue
                    </p>
                    <p className="text-xs text-gray-600">
                      {service.property_name} • {new Date(service.service_date).toLocaleDateString()}
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
              <span className="text-lg font-semibold text-gray-900">{statsData.week_services}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Today's Services</span>
              <span className="text-lg font-semibold text-gray-900">{statsData.today_services}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Properties</span>
              <span className="text-lg font-semibold text-gray-900">{statsData.property_count}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Units</span>
              <span className="text-lg font-semibold text-gray-900">{statsData.unit_count}</span>
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

// Loading skeleton component
function DashboardSkeleton() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="mt-2 h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg bg-white p-6 shadow">
            <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-lg bg-white p-6 shadow">
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Error boundary component
function ErrorBoundary({ error }: { error: any }) {
  return (
    <div className="p-8">
      <div className="rounded-lg bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h2>
        <p className="mt-2 text-red-600">{error.message}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    </div>
  )
}
