import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, Droplets, Gauge, Beaker, Wrench, ClipboardList, Calendar } from 'lucide-react'
import ServiceHistory from '@/components/ServiceHistory'
import WaterQualityChart from '@/components/WaterQualityChart'

export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>
}) {
  // Await params for Next.js 15
  const { id: propertyId, unitId } = await params

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

  // Get unit with property info
  const { data: unit, error } = await supabase
    .from('units')
    .select(`
      *,
      property:properties!inner(
        id,
        name,
        company_id
      )
    `)
    .eq('id', unitId)
    .eq('property_id', propertyId)
    .single()

  if (error || !unit || unit.property.company_id !== profile!.company_id) {
    notFound()
  }

  // Load current custom schedule if applicable
  let customSchedule: any = null
  if (unit.service_frequency === 'custom') {
    const { data } = await supabase
      .from('custom_schedules')
      .select('schedule_type, schedule_config, service_types, name, description')
      .eq('unit_id', unitId)
      .eq('is_active', true)
      .maybeSingle()
    customSchedule = data
  }

  // Get latest service and equipment count
  const { data: latestService } = await supabase
    .from('services')
    .select('id, service_date, service_type, status, technician_name')
    .eq('unit_id', unitId)
    .order('service_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { count: equipmentCount } = await supabase
    .from('equipment')
    .select('*', { count: 'exact', head: true })
    .eq('unit_id', unitId)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/properties/${propertyId}`}
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to {unit.property.name}</span>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-50">
                <Droplets className="h-6 w-6 text-accent-700" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {unit.name || unit.unit_number || `${unit.unit_type} Unit`}
                </h1>
                <p className="text-gray-600 capitalize">
                  {unit.unit_type.replace('_', ' ')} • {unit.water_type} water
                </p>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/services/new-guided?unit=${unitId}`}
              className="inline-flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-600 transition-colors"
            >
              <Droplets className="h-4 w-4" />
              <span>Add Service</span>
            </Link>
            <Link
              href={`/properties/${propertyId}/units/${unitId}/edit`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Edit Unit
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Unit Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Information Card */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Unit Information</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {unit.unit_number && (
                <div>
                  <p className="text-sm text-gray-600">Unit Number</p>
                  <p className="text-base font-medium text-gray-900">{unit.unit_number}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="text-base font-medium text-gray-900 capitalize">
                  {unit.unit_type.replace('_', ' ')}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Water Type</p>
                <p className="text-base font-medium text-gray-900 capitalize">
                  {unit.water_type}
                </p>
              </div>

              {unit.volume_litres && (
                <div>
                  <p className="text-sm text-gray-600">Volume</p>
                  <p className="text-base font-medium text-gray-900">
                    {unit.volume_litres.toLocaleString()} L
                  </p>
                </div>
              )}
            </div>

            {unit.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Notes</p>
                <p className="text-sm text-gray-900 whitespace-pre-line">{unit.notes}</p>
              </div>
            )}
          </div>

          {/* Service History (Placeholder) */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Services</h2>
              <Link
                href={`/properties/${propertyId}/units/${unitId}/service`}
                className="text-sm text-primary hover:text-primary-600"
              >
                Log Service →
              </Link>
            </div>
            
            {latestService ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {latestService.service_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(latestService.service_date).toLocaleDateString('en-AU')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    latestService.status === 'completed' ? 'bg-green-100 text-green-800' :
                    latestService.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {latestService.status.replace('_', ' ')}
                  </span>
                </div>
                <Link
                  href={`/services/${latestService.id}`}
                  className="block text-sm text-primary hover:text-primary-600"
                >
                  View Details →
                </Link>
              </div>
            ) : (
              <div className="flex min-h-[150px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                <div className="text-center">
                  <ClipboardList className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-600">No services logged yet</p>
                  <Link
                    href={`/properties/${propertyId}/units/${unitId}/service`}
                    className="mt-2 inline-block text-sm text-primary hover:text-primary-600"
                  >
                    Log your first service →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Quick Actions</h3>
            
            <div className="space-y-2">
              <Link
                href={`/properties/${propertyId}/units/${unitId}/service`}
                className="flex items-center space-x-3 rounded-lg border border-gray-200 p-3 hover:border-primary hover:bg-primary-50 transition-all"
              >
                <Beaker className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Log Service</span>
              </Link>

              <Link
                href={`/properties/${propertyId}/units/${unitId}/equipment`}
                className="flex items-center space-x-3 rounded-lg border border-gray-200 p-3 hover:border-primary hover:bg-primary-50 transition-all"
              >
                <Wrench className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Manage Equipment</span>
              </Link>

              <Link
                href={`/properties/${propertyId}/units/${unitId}/history`}
                className="flex items-center space-x-3 rounded-lg border border-gray-200 p-3 hover:border-primary hover:bg-primary-50 transition-all"
              >
                <Calendar className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">View History</span>
              </Link>
            </div>
          </div>

          {/* Equipment Summary (Placeholder) */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Equipment</h3>
            
            {(equipmentCount || 0) > 0 ? (
              <div>
                <p className="text-2xl font-bold text-gray-900">{equipmentCount}</p>
                <p className="text-sm text-gray-600">pieces of equipment</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <Wrench className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-600">No equipment added</p>
                <Link
                  href={`/properties/${propertyId}/units/${unitId}/equipment`}
                  className="mt-2 inline-block text-sm text-primary hover:text-primary-600"
                >
                  Add equipment →
                </Link>
              </div>
            )}
          </div>

          {/* Schedule Summary */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Current Schedule</h3>
            <div className="text-sm text-gray-800">
              <p className="mb-2">
                <span className="font-medium">Service Frequency:</span>{' '}
                {unit.service_frequency === 'custom' ? 'Custom' : (unit.service_frequency || 'Not set')}
              </p>
              {unit.service_frequency === 'custom' ? (
                customSchedule ? (
                  <div className="space-y-2">
                    {customSchedule.name && (
                      <p><span className="font-medium">Name:</span> {customSchedule.name}</p>
                    )}
                    <p>
                      <span className="font-medium">Type:</span>{' '}
                      {(customSchedule.schedule_type || 'complex').replace('_', ' ')}
                    </p>
                    {customSchedule.schedule_config?.occupancy_rules ? (
                      <div className="text-gray-700">
                        <p className="font-medium">Occupancy Rules</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          {customSchedule.schedule_config.occupancy_rules.on_arrival && (
                            <li>Service on arrival</li>
                          )}
                          {customSchedule.schedule_config.occupancy_rules.weekly_minimum && (
                            <li>Weekly minimum on {customSchedule.schedule_config.occupancy_rules.weekly_day}</li>
                          )}
                          {customSchedule.schedule_config.occupancy_rules.biweekly_minimum && (
                            <li>Bi-weekly minimum on {customSchedule.schedule_config.occupancy_rules.biweekly_day}</li>
                          )}
                        </ul>
                      </div>
                    ) : (
                      <div className="text-gray-700">
                        <p className="font-medium">Frequencies</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          {Array.isArray(customSchedule.schedule_config?.schedules)
                            ? customSchedule.schedule_config.schedules.map((s: any, i: number) => (
                                <li key={i}>
                                  {s.name || s.frequency} — {s.time || 'time N/A'}
                                </li>
                              ))
                            : Object.keys(customSchedule.service_types || {}).map((freq) => (
                                <li key={freq}>{freq}</li>
                              ))}
                        </ul>
                      </div>
                    )}
                    <div className="pt-3">
                      <Link href={`/properties/${propertyId}/units/${unitId}/edit`} className="text-primary hover:text-primary-600">
                        Manage Schedule →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-600">
                    No custom schedule found.
                    <div className="pt-3">
                      <Link href={`/properties/${propertyId}/units/${unitId}/edit`} className="text-primary hover:text-primary-600">
                        Set up schedule →
                      </Link>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-gray-600">
                  Using default frequency.
                  <div className="pt-3">
                    <Link href={`/properties/${propertyId}/units/${unitId}/edit`} className="text-primary hover:text-primary-600">
                      Change schedule →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Statistics</h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Total Services</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">Last Service</p>
                <p className="text-sm text-gray-700">Never</p>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm text-gray-700">
                  {new Date(unit.created_at).toLocaleDateString('en-AU')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service History & Analytics */}
      <div className="space-y-6">
        {/* Service History */}
        <ServiceHistory unitId={unitId} />
        
        {/* Water Quality Trends */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <WaterQualityChart unitId={unitId} parameter="ph" />
          <WaterQualityChart unitId={unitId} parameter="chlorine" />
        </div>
      </div>
    </div>
  )
}

