import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, MapPin, Phone, Mail, User, Plus, Droplets } from 'lucide-react'

export default async function PropertyDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get user's company
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user!.id)
    .single()

  // Get property with units
  const { data: property, error } = await supabase
    .from('properties')
    .select(`
      *,
      units:units(*)
    `)
    .eq('id', params.id)
    .eq('company_id', profile!.company_id)
    .single()

  if (error || !property) {
    notFound()
  }

  const units = property.units || []
  const hasUnits = units.length > 0

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/properties"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Properties</span>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
            <p className="mt-2 text-gray-600 capitalize">
              {property.property_type.replace('_', ' ')}
            </p>
          </div>
          <Link
            href={`/properties/${property.id}/edit`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Edit Property
          </Link>
        </div>
      </div>

      {/* Property Details */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Info Card */}
        <div className="lg:col-span-2 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Property Information</h2>
          
          <div className="space-y-4">
            {property.address && (
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Address</p>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{property.address}</p>
                </div>
              </div>
            )}

            {property.contact_name && (
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Contact</p>
                  <p className="text-sm text-gray-600">{property.contact_name}</p>
                </div>
              </div>
            )}

            {property.contact_email && (
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <a href={`mailto:${property.contact_email}`} className="text-sm text-primary hover:text-primary-600">
                    {property.contact_email}
                  </a>
                </div>
              </div>
            )}

            {property.contact_phone && (
              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Phone</p>
                  <a href={`tel:${property.contact_phone}`} className="text-sm text-primary hover:text-primary-600">
                    {property.contact_phone}
                  </a>
                </div>
              </div>
            )}

            {property.notes && (
              <div className="flex items-start space-x-3 pt-4 border-t border-gray-200">
                <div className="w-full">
                  <p className="text-sm font-medium text-gray-700 mb-2">Notes</p>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{property.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Card */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Statistics</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Total Units</p>
              <p className="text-2xl font-bold text-gray-900">{units.length}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Total Volume</p>
              <p className="text-2xl font-bold text-gray-900">
                {property.total_volume_litres 
                  ? `${(property.total_volume_litres / 1000).toFixed(1)}k L`
                  : '0 L'
                }
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">Last updated</p>
              <p className="text-sm text-gray-700">
                {new Date(property.updated_at).toLocaleDateString('en-AU')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Units Section */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Pools & Units</h2>
            <p className="text-sm text-gray-600">Manage pools, spas, and villas at this property</p>
          </div>
          <Link
            href={`/properties/${property.id}/units/new`}
            className="inline-flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-600 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Unit</span>
          </Link>
        </div>

        {hasUnits ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {units.map((unit) => (
              <Link
                key={unit.id}
                href={`/properties/${property.id}/units/${unit.id}`}
                className="group rounded-lg border border-gray-200 p-4 hover:border-primary hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50">
                      <Droplets className="h-5 w-5 text-accent-700" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                        {unit.name || unit.unit_number}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {unit.unit_type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </div>

                {unit.volume_litres && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{unit.volume_litres.toLocaleString()}</span> L
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-50">
                <Droplets className="h-6 w-6 text-accent-700" />
              </div>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">
                No units yet
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                Add your first pool, spa, or unit to get started
              </p>
              <Link
                href={`/properties/${property.id}/units/new`}
                className="inline-flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Unit</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

