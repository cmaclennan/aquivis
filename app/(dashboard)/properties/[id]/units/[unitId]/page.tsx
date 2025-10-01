import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Droplets, Gauge, Beaker, Wrench, ClipboardList, Calendar } from 'lucide-react'

export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>
}) {
  // Await params for Next.js 15
  const { id: propertyId, unitId } = await params
  
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get user's company
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user!.id)
    .single()

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

  // TODO: Get latest service and equipment count
  // For now, these are placeholders
  const latestService = null
  const equipmentCount = 0

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
          <Link
            href={`/properties/${propertyId}/units/${unitId}/edit`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Edit Unit
          </Link>
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
              <div>
                {/* TODO: Service list */}
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
            
            {equipmentCount > 0 ? (
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
    </div>
  )
}

