import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, Edit, Calendar, User, Droplets, AlertTriangle, CheckCircle, Building2 } from 'lucide-react'

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: serviceId } = await params

  // Get user data from middleware headers
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const companyId = headersList.get('x-user-company-id')

  if (!userId) {
    redirect('/login')
  }

  if (!companyId) {
    redirect('/onboarding')
  }

  const supabase = createAdminClient()

  // Get service with all related data
  const { data: service, error } = await supabase
    .from('services')
    .select(`
      *,
      technician:profiles!services_technician_id_fkey(first_name, last_name),
      unit:units(name, unit_type, water_type, volume_litres),
      property:properties(name),
      water_tests(*)
    `)
    .eq('id', serviceId)
    .eq('property.company_id', companyId)
    .single()

  if (error || !service) {
    notFound()
  }

  const waterTest = service.water_tests?.[0]
  // Correct unit type classification
  const isSpa = service.unit?.unit_type === 'rooftop_spa' || service.unit?.unit_type === 'main_spa'

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'in_progress':
        return <Droplets className="h-5 w-5 text-blue-600" />
      case 'scheduled':
        return <Calendar className="h-5 w-5 text-gray-600" />
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
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

  const formatParameter = (value: number | null, unit: string = '') => {
    if (value === null || value === undefined) return 'Not tested'
    return `${value}${unit}`
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/services"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Services</span>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{getServiceTypeLabel(service.service_type)}</h1>
            <p className="mt-2 text-gray-600">
              {service.property?.name} - {service.unit?.name}
            </p>
          </div>
          <Link
            href={`/services/${serviceId}/edit`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Edit Service
          </Link>
        </div>
      </div>

      {/* Service Details */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Info Card */}
        <div className="lg:col-span-2 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Service Information</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Property</p>
                <p className="text-sm text-gray-600">{service.property?.name}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Droplets className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Unit</p>
                <p className="text-sm text-gray-600">
                  {service.unit?.name} ({service.unit?.unit_type.replace('_', ' ')})
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Technician</p>
                <p className="text-sm text-gray-600">
                  {service.technician ? `${service.technician.first_name} ${service.technician.last_name}` : 'Unassigned'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Service Date</p>
                <p className="text-sm text-gray-600">
                  {new Date(service.service_date).toLocaleDateString('en-AU')}
                </p>
              </div>
            </div>

            {service.notes && (
              <div className="flex items-start space-x-3 pt-4 border-t border-gray-200">
                <div className="w-full">
                  <p className="text-sm font-medium text-gray-700 mb-2">Notes</p>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{service.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Card */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {getStatusIcon(service.status)}
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(service.status)}`}>
                {service.status.replace('_', ' ')}
              </span>
            </div>
            
            {waterTest && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  {waterTest.all_parameters_ok ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm text-gray-700">
                    Water test: {waterTest.all_parameters_ok ? 'All parameters OK' : 'Issues detected'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Water Test Results */}
      {waterTest && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Water Test Results</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* pH */}
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">pH Level</span>
                <span className="text-sm text-gray-600">Target: 7.2-7.8</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatParameter(waterTest.ph)}
              </div>
            </div>

            {/* Chlorine or Bromine */}
            {!isSpa && waterTest.chlorine !== null && (
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Free Chlorine</span>
                  <span className="text-sm text-gray-600">Target: ≥1.0 mg/L</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatParameter(waterTest.chlorine, ' mg/L')}
                </div>
              </div>
            )}

            {isSpa && waterTest.bromine !== null && (
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Bromine</span>
                  <span className="text-sm text-gray-600">Target: 6.0-8.0 mg/L</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatParameter(waterTest.bromine, ' mg/L')}
                </div>
              </div>
            )}

            {/* Salt (for saltwater pools) */}
            {waterTest.salt !== null && (
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Salt</span>
                  <span className="text-sm text-gray-600">Target: 2500-3500 ppm</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatParameter(waterTest.salt, ' ppm')}
                </div>
              </div>
            )}

            {/* Alkalinity */}
            {waterTest.alkalinity !== null && (
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Total Alkalinity</span>
                  <span className="text-sm text-gray-600">Target: 80-200 mg/L</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatParameter(waterTest.alkalinity, ' mg/L')}
                </div>
              </div>
            )}

            {/* Calcium */}
            {waterTest.calcium !== null && (
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Calcium Hardness</span>
                  <span className="text-sm text-gray-600">Target: 200-400 mg/L</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatParameter(waterTest.calcium, ' mg/L')}
                </div>
              </div>
            )}

            {/* Cyanuric Acid */}
            {waterTest.cyanuric !== null && (
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Cyanuric Acid</span>
                  <span className="text-sm text-gray-600">Target: ≤50 mg/L</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatParameter(waterTest.cyanuric, ' mg/L')}
                </div>
              </div>
            )}

            {/* Turbidity */}
            {waterTest.turbidity !== null && (
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Turbidity</span>
                  <span className="text-sm text-gray-600">Target: ≤1.0 NTU</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatParameter(waterTest.turbidity, ' NTU')}
                </div>
              </div>
            )}

            {/* Temperature */}
            {waterTest.temperature !== null && (
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Temperature</span>
                  <span className="text-sm text-gray-600">°C</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatParameter(waterTest.temperature, '°C')}
                </div>
              </div>
            )}
          </div>

          {/* Spa Equipment Checks */}
          {isSpa && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="mb-4 text-md font-medium text-gray-900">Equipment Checks</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex items-center space-x-3">
                  {waterTest.is_pump_running ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="text-sm text-gray-700">Pump running</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  {waterTest.is_water_warm ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="text-sm text-gray-700">Water warm</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  {waterTest.is_filter_cleaned ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="text-sm text-gray-700">Filter cleaned</span>
                </div>
              </div>
            </div>
          )}

          {/* Test Notes */}
          {waterTest.notes && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="mb-2 text-md font-medium text-gray-900">Test Notes</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">{waterTest.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
