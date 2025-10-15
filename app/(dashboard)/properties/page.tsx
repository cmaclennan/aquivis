import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Plus, Building2, MapPin } from 'lucide-react'
import { formatLitresShort } from '@/lib/utils'
import Link from 'next/link'

export default async function PropertiesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Get user's company
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) {
    redirect('/onboarding')
  }

  // Get all properties for this company
  const { data: properties } = await supabase
    .from('properties')
    .select(`
      *,
      units:units(volume_litres)
    `)
    .eq('company_id', profile.company_id)
    .order('name')

  const hasProperties = properties && properties.length > 0

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
          <p className="mt-2 text-gray-600">
            Manage your pool service locations
          </p>
        </div>
        <Link
          href="/properties/new"
          className="inline-flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-600 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Property</span>
        </Link>
      </div>

      {/* Properties Grid */}
      {hasProperties ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Link
              key={property.id}
              href={`/properties/${property.id}`}
              className="group block rounded-xl border border-[#bbc3c4] bg-white p-6 shadow-md hover:border-primary hover:shadow-lg transition-all"
            >
              {/* Property Icon & Name */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                      {property.name}
                    </h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {property.property_type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address */}
              {property.address && (
                <div className="mb-4 flex items-start space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{property.address}</span>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="text-sm">
                  <span className="font-medium text-gray-900">
                    {(property.units?.length) || 0}
                  </span>
                  <span className="text-gray-500"> units</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-900">
                    {(() => {
                      const total = property.total_volume_litres ?? 0
                      const summed = Array.isArray(property.units)
                        ? property.units.reduce((acc: number, u: any) => acc + (u?.volume_litres || 0), 0)
                        : 0
                      const display = Math.max(total || 0, summed || 0)
                      return formatLitresShort(display)
                    })()}
                  </span>
                  <span className="text-gray-500"> L</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              No properties yet
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              Get started by adding your first property
            </p>
            <Link
              href="/properties/new"
              className="inline-flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add Your First Property</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

