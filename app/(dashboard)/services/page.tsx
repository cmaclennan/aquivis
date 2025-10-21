import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Calendar, User, Droplets, AlertTriangle, CheckCircle, Edit, Trash2 } from 'lucide-react'
import { SentryErrorBoundaryClass } from '@/components/ui/sentry-error-boundary'
import { PageLoadTracker } from '@/components/metrics/PageLoadTracker'
import { logger } from '@/lib/logger'
import ServicesClient from './ServicesClient'

interface Service {
  id: string
  service_date: string
  service_type: string
  status: string
  technician_name: string
  unit_name: string
  unit_type: string
  property_name: string
  all_parameters_ok: boolean | null
  company_id: string
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
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
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const page = Math.max(1, Number(searchParams?.page) || 1)
  const pageSize = 24
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = createAdminClient()

  // Try optimized view first, fallback to basic query if not available
  let services: Service[] = []
  let error: string | null = null

  try {
    const { data, error: queryError } = await supabase
      .from('services_optimized')
      .select('*')
      .eq('company_id', companyId)
      .order('service_date', { ascending: false })
      .range(from, to)

    if (queryError) throw queryError
    services = (data || []) as Service[]
  } catch (viewError) {
    logger.debug('[SERVICES] Optimized view failed, using fallback', viewError)

    // Fallback to basic services query
    try {
      const { data, error: fallbackError } = await supabase
        .from('services')
        .select(`
          id,
          service_date,
          service_type,
          status,
          property_id,
          unit_id,
          technician_id,
          properties!inner(name, company_id),
          units(name, unit_type),
          profiles(first_name, last_name),
          water_tests(all_parameters_ok)
        `)
        .eq('properties.company_id', companyId)
        .order('service_date', { ascending: false })
        .range(from, to)

      if (fallbackError) throw fallbackError

      // Transform data to match Service interface
      services = (data || []).map((s: any) => ({
        id: s.id,
        service_date: s.service_date,
        service_type: s.service_type,
        status: s.status,
        technician_name: s.profiles ? `${s.profiles.first_name} ${s.profiles.last_name}` : 'Unassigned',
        unit_name: s.units?.name || '',
        unit_type: s.units?.unit_type || '',
        property_name: s.properties?.name || 'Unknown',
        all_parameters_ok: s.water_tests?.[0]?.all_parameters_ok || null,
        company_id: companyId,
      }))
    } catch (fallbackError) {
      logger.error('[SERVICES] Both queries failed', fallbackError)
      error = 'Failed to load services'
      services = []
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <Droplets className="h-4 w-4 text-blue-600" />
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-gray-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'in_progress':
        return 'text-blue-600 bg-blue-50'
      case 'scheduled':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-yellow-600 bg-yellow-50'
    }
  }

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'test_only':
        return 'Water Test Only'
      case 'full_service':
        return 'Full Service'
      case 'equipment_check':
        return 'Equipment Check'
      case 'plant_room_check':
        return 'Plant Room Check'
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  return (
    <SentryErrorBoundaryClass>
      <PageLoadTracker page="services" />
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Services</h1>
              <p className="mt-2 text-gray-600">
                Manage water testing and service records
              </p>
            </div>
            <Link
              href="/services/new-guided"
              className="inline-flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add Service</span>
            </Link>
          </div>
        </div>

        {/* Services List */}
        {error ? (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">
            {error}
          </div>
        ) : services.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <Droplets className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">No services yet</p>
              <p className="text-xs text-gray-500 mt-1">Add your first service to get started</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="group block rounded-xl border border-[#bbc3c4] bg-white p-6 shadow-md hover:border-primary hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between">
                  <Link
                    href={`/services/${service.id}`}
                    className="flex-1"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(service.status)}
                      <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                        {getServiceTypeLabel(service.service_type)}
                      </h3>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(service.status)}`}>
                        {service.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Property:</span>
                        <span>{service.property_name || 'Unknown'}</span>
                      </div>

                      {service.unit_name && (
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Unit:</span>
                          <span>
                            {service.unit_name} ({String(service.unit_type || '').replace('_', ' ')})
                          </span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{service.technician_name || 'Unassigned'}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(service.service_date).toLocaleDateString('en-AU')}</span>
                      </div>
                    </div>

                    {service.all_parameters_ok !== null && (
                      <div className="mt-3 flex items-center space-x-2">
                        {service.all_parameters_ok ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm text-gray-600">
                          Water test: {service.all_parameters_ok ? 'All parameters OK' : 'Issues detected'}
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Action Buttons - Use ServicesClient for delete functionality */}
                  <ServicesClient serviceId={service.id} />
                </div>
              </div>
            ))}
            {/* Pagination */}
            <div className="flex items-center justify-center gap-4 mt-6">
              {page > 1 && (
                <Link
                  href={`/services?page=${page - 1}`}
                  className="text-sm text-gray-700 underline hover:text-gray-900"
                >
                  Previous
                </Link>
              )}
              {services.length === pageSize && (
                <Link
                  href={`/services?page=${page + 1}`}
                  className="text-sm text-gray-700 underline hover:text-gray-900"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </SentryErrorBoundaryClass>
  )
}
