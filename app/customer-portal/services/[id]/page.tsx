import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Calendar, MapPin, Droplets, FileText, CheckCircle2, AlertTriangle, Camera } from 'lucide-react'

export default async function CustomerServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: serviceId } = await params

  // Get user data from middleware headers
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const userEmail = headersList.get('x-user-email')

  if (!userId) {
    redirect('/customer-portal/login')
  }

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('id', userId)
    .single()

  // Get customer IDs for this user
  const { data: emailCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('email', profile?.email || '')
    .maybeSingle()

  const { data: linked } = await supabase
    .from('customer_user_links')
    .select('customer_id')
    .eq('user_id', userId)

  const allowedCustomerIds: string[] = []
  if (emailCustomer) allowedCustomerIds.push(emailCustomer.id)
  if (linked) {
    linked.forEach((l: any) => {
      if (l.customer_id && !allowedCustomerIds.includes(l.customer_id)) {
        allowedCustomerIds.push(l.customer_id)
      }
    })
  }

  // Fetch service details
  const { data: service, error } = await supabase
    .from('services')
    .select(`
      id,
      service_date,
      service_type,
      status,
      notes,
      units!inner(
        name,
        properties!inner(name, address, customer_id),
        customer_id
      ),
      water_tests(
        id,
        ph,
        chlorine,
        total_chlorine,
        free_chlorine,
        alkalinity,
        calcium_hardness,
        cyanuric_acid,
        phosphates,
        salt,
        temperature,
        tds,
        notes
      ),
      service_chemicals(
        id,
        chemical_name,
        amount,
        unit
      ),
      service_photos(
        id,
        photo_url,
        caption,
        created_at
      )
    `)
    .eq('id', serviceId)
    .single()

  if (error || !service) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-600">
          Service not found or access denied
        </div>
      </div>
    )
  }

  // Verify customer access
  const serviceCustomerId = service.units?.customer_id || service.units?.properties?.customer_id
  if (!serviceCustomerId || !allowedCustomerIds.includes(serviceCustomerId)) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-600">
          Access denied
        </div>
      </div>
    )
  }

  const waterTest = service.water_tests && service.water_tests.length > 0 ? service.water_tests[0] : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link 
          href="/customer-portal/services"
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Services
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Service Details</h1>
      </div>

      {/* Service Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Service Date</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(service.service_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="text-sm font-medium text-gray-900">{service.units?.properties?.name}</p>
              <p className="text-sm text-gray-600">{service.units?.name}</p>
              {service.units?.properties?.address && (
                <p className="text-xs text-gray-500 mt-1">{service.units.properties.address}</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600">Service Type</p>
            <span className="inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
              {(service.service_type || 'service').replace('_', ' ')}
            </span>
          </div>

          {service.status && (
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                service.status === 'completed' ? 'bg-green-100 text-green-700' :
                service.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {service.status === 'completed' && <CheckCircle2 className="inline h-4 w-4 mr-1" />}
                {service.status}
              </span>
            </div>
          )}
        </div>

        {service.notes && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-start gap-2">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Service Notes</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{service.notes}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Water Test Results */}
      {waterTest && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Droplets className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">Water Test Results</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {waterTest.ph && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">pH Level</p>
                <p className="text-lg font-semibold text-gray-900">{waterTest.ph}</p>
                <p className="text-xs text-gray-500">Target: 7.2-7.8</p>
              </div>
            )}

            {waterTest.chlorine && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Chlorine</p>
                <p className="text-lg font-semibold text-gray-900">{waterTest.chlorine} ppm</p>
                <p className="text-xs text-gray-500">Target: 1-3 ppm</p>
              </div>
            )}

            {waterTest.alkalinity && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Alkalinity</p>
                <p className="text-lg font-semibold text-gray-900">{waterTest.alkalinity} ppm</p>
                <p className="text-xs text-gray-500">Target: 80-120 ppm</p>
              </div>
            )}

            {waterTest.calcium_hardness && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Calcium Hardness</p>
                <p className="text-lg font-semibold text-gray-900">{waterTest.calcium_hardness} ppm</p>
                <p className="text-xs text-gray-500">Target: 200-400 ppm</p>
              </div>
            )}

            {waterTest.cyanuric_acid && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Cyanuric Acid</p>
                <p className="text-lg font-semibold text-gray-900">{waterTest.cyanuric_acid} ppm</p>
                <p className="text-xs text-gray-500">Target: 30-50 ppm</p>
              </div>
            )}

            {waterTest.phosphates !== null && waterTest.phosphates !== undefined && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Phosphates</p>
                <p className="text-lg font-semibold text-gray-900">{waterTest.phosphates} ppb</p>
                <p className="text-xs text-gray-500">Target: &lt;100 ppb</p>
              </div>
            )}

            {waterTest.salt && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Salt</p>
                <p className="text-lg font-semibold text-gray-900">{waterTest.salt} ppm</p>
              </div>
            )}

            {waterTest.temperature && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Temperature</p>
                <p className="text-lg font-semibold text-gray-900">{waterTest.temperature}°</p>
              </div>
            )}
          </div>

          {waterTest.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium text-gray-900 mb-1">Test Notes</p>
              <p className="text-sm text-gray-600">{waterTest.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Chemicals Added */}
      {service.service_chemicals && service.service_chemicals.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Chemicals Added</h2>
          <div className="space-y-2">
            {service.service_chemicals.map((chemical: any) => (
              <div key={chemical.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm font-medium text-gray-900">{chemical.chemical_name}</span>
                <span className="text-sm text-gray-600">
                  {chemical.amount} {chemical.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Service Photos */}
      {service.service_photos && service.service_photos.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Service Photos</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {service.service_photos.map((photo: any) => (
              <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={photo.photo_url}
                  alt={photo.caption || 'Service photo'}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover"
                  loading="lazy"
                />
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2">
                    {photo.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

