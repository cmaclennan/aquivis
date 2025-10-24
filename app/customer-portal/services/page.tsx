import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { Calendar, Droplets, CheckCircle2, Clock, FileText } from 'lucide-react'

export default async function CustomerServicesPage() {
  // Get user data from middleware headers
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const userEmail = headersList.get('x-user-email')

  if (!userId) {
    redirect('/customer-portal/login')
  }

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('id', userId)
    .single()

  // Get customer IDs for this user
  const { data: emailCustomer } = await supabase
    .from('customers')
    .select('id, name')
    .eq('email', profile?.email || '')
    .maybeSingle()

  const { data: linked } = await supabase
    .from('customer_user_links')
    .select('customer_id, customers:customers(id, name)')
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

  let services: any[] = []
  if (allowedCustomerIds.length > 0) {
    const orServices = allowedCustomerIds.map(id => 
      `units.customer_id.eq.${id},units.properties.customer_id.eq.${id}`
    ).join(',')
    
    const { data: s } = await supabase
      .from('services')
      .select(`
        id,
        service_date,
        service_type,
        status,
        notes,
        units!inner(
          name,
          properties!inner(name, customer_id),
          customer_id
        ),
        water_tests(
          id,
          ph,
          chlorine,
          alkalinity,
          calcium_hardness,
          cyanuric_acid,
          phosphates,
          salt,
          temperature
        )
      `)
      .or(orServices)
      .order('service_date', { ascending: false })
      .limit(100)
    
    services = s || []
  }

  // Group services by month
  const servicesByMonth: Record<string, any[]> = {}
  services.forEach(service => {
    const date = new Date(service.service_date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!servicesByMonth[monthKey]) {
      servicesByMonth[monthKey] = []
    }
    servicesByMonth[monthKey].push(service)
  })

  const months = Object.keys(servicesByMonth).sort().reverse()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Service History</h1>
        <p className="text-gray-600 text-sm">View all services performed on your properties</p>
      </div>

      {allowedCustomerIds.length === 0 ? (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-sm text-yellow-800">
            No customer record matched your email yet. Please contact your service provider.
          </p>
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-lg bg-white p-8 shadow text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No services found</p>
        </div>
      ) : (
        <div className="space-y-8">
          {months.map(monthKey => {
            const [year, month] = monthKey.split('-')
            const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })
            const monthServices = servicesByMonth[monthKey]

            return (
              <div key={monthKey}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{monthName}</h2>
                <div className="space-y-3">
                  {monthServices.map((service: any) => {
                    const hasWaterTest = service.water_tests && service.water_tests.length > 0
                    const waterTest = hasWaterTest ? service.water_tests[0] : null

                    return (
                      <Link
                        key={service.id}
                        href={`/customer-portal/services/${service.id}`}
                        className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {new Date(service.service_date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            
                            <div className="text-sm text-gray-600 mb-2">
                              {service.units?.properties?.name} • {service.units?.name}
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                {(service.service_type || 'service').replace('_', ' ')}
                              </span>

                              {service.status && (
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  service.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  service.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {service.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                                  {service.status === 'in_progress' && <Clock className="h-3 w-3" />}
                                  {service.status}
                                </span>
                              )}

                              {hasWaterTest && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                  <Droplets className="h-3 w-3" />
                                  Water Test
                                </span>
                              )}

                              {service.notes && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                  <FileText className="h-3 w-3" />
                                  Notes
                                </span>
                              )}
                            </div>

                            {hasWaterTest && waterTest && (
                              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                {waterTest.ph && (
                                  <div className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                                    <span className="text-gray-600">pH:</span>
                                    <span className="font-medium text-gray-900">{waterTest.ph}</span>
                                  </div>
                                )}
                                {waterTest.chlorine && (
                                  <div className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                                    <span className="text-gray-600">Chlorine:</span>
                                    <span className="font-medium text-gray-900">{waterTest.chlorine}</span>
                                  </div>
                                )}
                                {waterTest.alkalinity && (
                                  <div className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                                    <span className="text-gray-600">Alkalinity:</span>
                                    <span className="font-medium text-gray-900">{waterTest.alkalinity}</span>
                                  </div>
                                )}
                                {waterTest.calcium_hardness && (
                                  <div className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                                    <span className="text-gray-600">Hardness:</span>
                                    <span className="font-medium text-gray-900">{waterTest.calcium_hardness}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="ml-4">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

