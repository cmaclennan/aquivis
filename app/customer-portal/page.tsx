import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CustomerPortalDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('id', user!.id)
    .single()

  // Resolve customer by email match (v1 mapping)
  const { data: emailCustomer } = await supabase
    .from('customers')
    .select('id, name')
    .eq('email', profile?.email || '')
    .maybeSingle()

  // Customers linked via customer_user_links
  const { data: linked } = await supabase
    .from('customer_user_links')
    .select('customer_id, customers:customers(id, name)')
    .eq('user_id', user!.id)

  const linkedCustomers = (linked || []).map((r: any) => r.customers).filter(Boolean)
  const allowedCustomerIds: string[] = []
  if (emailCustomer?.id) allowedCustomerIds.push(emailCustomer.id)
  for (const c of linkedCustomers) {
    if (c?.id && !allowedCustomerIds.includes(c.id)) allowedCustomerIds.push(c.id)
  }

  // Fetch properties/units attributed to this customer via properties.customer_id or units.customer_id
  let units: any[] = []
  let services: any[] = []
  if (allowedCustomerIds.length > 0) {
    const orUnits = allowedCustomerIds.map(id => `customer_id.eq.${id},properties.customer_id.eq.${id}`).join(',')
    const { data: u } = await supabase
      .from('units')
      .select('id, name, unit_type, properties!inner(id, name, customer_id), customer_id')
      .or(orUnits)
      .limit(200)
    units = u || []

    const orServices = allowedCustomerIds.map(id => `units.customer_id.eq.${id},units.properties.customer_id.eq.${id}`).join(',')
    const { data: s } = await supabase
      .from('services')
      .select('id, service_date, service_type, units!inner(name, properties!inner(name, customer_id), customer_id)')
      .or(orServices)
      .order('service_date', { ascending: false })
      .limit(50)
    services = s || []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome</h1>
        <p className="text-gray-600 text-sm">Your properties and recent services</p>
        {allowedCustomerIds.length === 0 && (
          <p className="text-xs text-red-600 mt-1">No customer record matched your email yet. Please contact your provider.</p>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/customer-portal/services"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-lg p-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Service History</h3>
              <p className="text-sm text-gray-600">View all services</p>
            </div>
          </div>
        </Link>

        <Link
          href="/customer-portal/water-tests"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 rounded-lg p-3">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Water Tests</h3>
              <p className="text-sm text-gray-600">View test results</p>
            </div>
          </div>
        </Link>

        <div className="bg-gray-50 rounded-lg shadow p-6 opacity-60">
          <div className="flex items-center gap-3">
            <div className="bg-gray-200 rounded-lg p-3">
              <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">Notifications</h3>
              <p className="text-sm text-gray-500">Coming soon</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Services</h2>
            <Link href="/customer-portal/services" className="text-sm text-blue-600 hover:text-blue-700">
              View all →
            </Link>
          </div>
          {services && services.length > 0 ? (
            <div className="space-y-3">
              {services.slice(0, 5).map((s: any) => (
                <Link
                  key={s.id}
                  href={`/customer-portal/services/${s.id}`}
                  className="flex items-center justify-between hover:bg-gray-50 p-2 rounded -mx-2"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">{s.units?.name}</div>
                    <div className="text-xs text-gray-600">{s.units?.properties?.name} • {new Date(s.service_date).toLocaleDateString()}</div>
                  </div>
                  <div className="text-sm text-gray-700 capitalize">{(s.service_type || '').replace('_',' ')}</div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-600">No recent services.</div>
          )}
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Assets</h2>
          {units && units.length > 0 ? (
            <ul className="space-y-2">
              {units.map((u: any) => (
                <li key={u.id} className="text-sm text-gray-800">
                  {u.name} <span className="text-gray-500">({u.unit_type?.replace('_',' ')})</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-600">No assets found.</div>
          )}
        </div>
      </div>
    </div>
  )
}


