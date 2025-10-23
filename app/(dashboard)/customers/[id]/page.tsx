import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, Users, MapPin, Phone, Mail, CreditCard, Building2, Droplets } from 'lucide-react'

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string }
}) {
  // Params
  const { id: customerId } = params

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

  // companyId is guaranteed above; profile fetch unnecessary here

  // Get customer with related data
  const { data: customer, error } = await supabase
    .from('customers')
    .select(`
      *,
      properties:properties(id, name),
      units:units(id, name, unit_number, unit_type)
    `)
    .eq('id', customerId)
    .eq('company_id', companyId)
    .single()

  if (error || !customer) {
    notFound()
  }

  const properties = customer.properties || []
  const units = customer.units || []

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/customers"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Customers</span>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
            <p className="mt-2 text-gray-600 capitalize">
              {customer.customer_type.replace('_', ' ')}
            </p>
          </div>
          <Link
            href={`/customers/${customerId}/edit`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Edit Customer
          </Link>
        </div>
      </div>

      {/* Customer Details Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Contact & Billing Info */}
        <div className="lg:col-span-2 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Contact & Billing Information</h2>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Contact */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Contact</h3>
              
              {customer.email && (
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <a href={`mailto:${customer.email}`} className="text-sm text-primary hover:text-primary-600">
                      {customer.email}
                    </a>
                  </div>
                </div>
              )}

              {customer.phone && (
                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone</p>
                    <a href={`tel:${customer.phone}`} className="text-sm text-primary hover:text-primary-600">
                      {customer.phone}
                    </a>
                  </div>
                </div>
              )}

              {customer.address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Address</p>
                    <p className="text-sm text-gray-600">
                      {customer.address}
                      {customer.city && <><br />{customer.city}, {customer.state} {customer.postal_code}</>}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Billing */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Billing</h3>
              
              <div className="flex items-start space-x-3">
                <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Billing Email</p>
                  <a href={`mailto:${customer.billing_email || customer.email}`} className="text-sm text-primary hover:text-primary-600">
                    {customer.billing_email || customer.email || 'Not set'}
                  </a>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Payment Terms</p>
                <p className="text-sm text-gray-600">{customer.payment_terms}</p>
              </div>
            </div>
          </div>

          {customer.notes && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Notes</p>
              <p className="text-sm text-gray-600 whitespace-pre-line">{customer.notes}</p>
            </div>
          )}
        </div>

        {/* Stats Card */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Statistics</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Properties</p>
              <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Units Managed</p>
              <p className="text-2xl font-bold text-gray-900">{units.length}</p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-sm text-gray-700">
                {customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-AU') : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Section */}
      {properties.length > 0 && (
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Properties</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {properties.map((property: any) => (
              <Link
                key={property.id}
                href={`/properties/${property.id}`}
                className="flex items-center space-x-3 rounded-lg border border-gray-200 p-3 hover:border-primary hover:bg-primary-50 transition-all"
              >
                <Building2 className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">{property.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Units Section */}
      {units.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Units Managed</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {units.map((unit: any) => (
              <div
                key={unit.id}
                className="flex items-center space-x-3 rounded-lg border border-gray-200 p-3"
              >
                <Droplets className="h-5 w-5 text-accent-700" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {unit.name || unit.unit_number || 'Unnamed Unit'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {unit.unit_type.replace('_', ' ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

