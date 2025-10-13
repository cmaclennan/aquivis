import { createClient } from '@/lib/supabase/server'

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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Services</h2>
          {services && services.length > 0 ? (
            <div className="space-y-3">
              {services.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{s.units?.name}</div>
                    <div className="text-xs text-gray-600">{s.units?.properties?.name} • {new Date(s.service_date).toLocaleString()}</div>
                  </div>
                  <div className="text-sm text-gray-700 capitalize">{(s.service_type || '').replace('_',' ')}</div>
                </div>
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


