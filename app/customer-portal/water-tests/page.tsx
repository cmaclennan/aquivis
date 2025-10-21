import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Droplets, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default async function CustomerWaterTestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/customer-portal/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('id', user.id)
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
    .eq('user_id', user.id)

  const allowedCustomerIds: string[] = []
  if (emailCustomer) allowedCustomerIds.push(emailCustomer.id)
  if (linked) {
    linked.forEach((l: any) => {
      if (l.customer_id && !allowedCustomerIds.includes(l.customer_id)) {
        allowedCustomerIds.push(l.customer_id)
      }
    })
  }

  let waterTests: any[] = []
  if (allowedCustomerIds.length > 0) {
    const orServices = allowedCustomerIds.map(id => 
      `service.units.customer_id.eq.${id},service.units.properties.customer_id.eq.${id}`
    ).join(',')
    
    const { data: tests } = await supabase
      .from('water_tests')
      .select(`
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
        notes,
        created_at,
        service:services!inner(
          id,
          service_date,
          units!inner(
            name,
            properties!inner(name, customer_id),
            customer_id
          )
        )
      `)
      .or(orServices)
      .order('created_at', { ascending: false })
      .limit(50)
    
    waterTests = tests || []
  }

  // Helper function to check if value is in range
  const checkRange = (value: number | null, min: number, max: number) => {
    if (value === null || value === undefined) return 'unknown'
    if (value < min) return 'low'
    if (value > max) return 'high'
    return 'good'
  }

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'low':
        return <TrendingDown className="h-4 w-4 text-yellow-500" />
      case 'high':
        return <TrendingUp className="h-4 w-4 text-yellow-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-50 border-green-200'
      case 'low':
      case 'high':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Water Test Results</h1>
        <p className="text-gray-600 text-sm">View all water chemistry test results for your pools</p>
      </div>

      {allowedCustomerIds.length === 0 ? (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-sm text-yellow-800">
            No customer record matched your email yet. Please contact your service provider.
          </p>
        </div>
      ) : waterTests.length === 0 ? (
        <div className="rounded-lg bg-white p-8 shadow text-center">
          <Droplets className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No water test results found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {waterTests.map((test: any) => {
            const phStatus = checkRange(test.ph, 7.2, 7.8)
            const chlorineStatus = checkRange(test.chlorine, 1, 3)
            const alkalinityStatus = checkRange(test.alkalinity, 80, 120)
            const hardnessStatus = checkRange(test.calcium_hardness, 200, 400)

            const hasIssues = [phStatus, chlorineStatus, alkalinityStatus, hardnessStatus].some(
              s => s === 'low' || s === 'high'
            )

            return (
              <Link
                key={test.id}
                href={`/customer-portal/services/${test.service.id}`}
                className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Droplets className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold text-gray-900">
                        {test.service?.units?.properties?.name} • {test.service?.units?.name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(test.service?.service_date || test.created_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  {hasIssues && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                      <AlertTriangle className="h-3 w-3" />
                      Needs Attention
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* pH */}
                  {test.ph && (
                    <div className={`rounded-lg border p-3 ${getStatusColor(phStatus)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">pH</span>
                        {getStatusIcon(phStatus)}
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{test.ph}</p>
                      <p className="text-xs text-gray-600">Target: 7.2-7.8</p>
                    </div>
                  )}

                  {/* Chlorine */}
                  {test.chlorine && (
                    <div className={`rounded-lg border p-3 ${getStatusColor(chlorineStatus)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">Chlorine</span>
                        {getStatusIcon(chlorineStatus)}
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{test.chlorine}</p>
                      <p className="text-xs text-gray-600">Target: 1-3 ppm</p>
                    </div>
                  )}

                  {/* Alkalinity */}
                  {test.alkalinity && (
                    <div className={`rounded-lg border p-3 ${getStatusColor(alkalinityStatus)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">Alkalinity</span>
                        {getStatusIcon(alkalinityStatus)}
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{test.alkalinity}</p>
                      <p className="text-xs text-gray-600">Target: 80-120 ppm</p>
                    </div>
                  )}

                  {/* Calcium Hardness */}
                  {test.calcium_hardness && (
                    <div className={`rounded-lg border p-3 ${getStatusColor(hardnessStatus)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">Hardness</span>
                        {getStatusIcon(hardnessStatus)}
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{test.calcium_hardness}</p>
                      <p className="text-xs text-gray-600">Target: 200-400 ppm</p>
                    </div>
                  )}

                  {/* Cyanuric Acid */}
                  {test.cyanuric_acid && (
                    <div className="rounded-lg border p-3 bg-gray-50 border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">CYA</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{test.cyanuric_acid}</p>
                      <p className="text-xs text-gray-600">Target: 30-50 ppm</p>
                    </div>
                  )}

                  {/* Phosphates */}
                  {test.phosphates !== null && test.phosphates !== undefined && (
                    <div className="rounded-lg border p-3 bg-gray-50 border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">Phosphates</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{test.phosphates}</p>
                      <p className="text-xs text-gray-600">Target: &lt;100 ppb</p>
                    </div>
                  )}

                  {/* Salt */}
                  {test.salt && (
                    <div className="rounded-lg border p-3 bg-gray-50 border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">Salt</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{test.salt}</p>
                      <p className="text-xs text-gray-600">ppm</p>
                    </div>
                  )}

                  {/* Temperature */}
                  {test.temperature && (
                    <div className="rounded-lg border p-3 bg-gray-50 border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">Temp</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{test.temperature}°</p>
                    </div>
                  )}
                </div>

                {test.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600">{test.notes}</p>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

