import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Plus, Users, Mail, Phone } from 'lucide-react'
import Link from 'next/link'

export default async function CustomersPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
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

  // Pagination - await searchParams
  const params = await searchParams
  const pageParam = (params?.page as string) || '1'
  const page = Math.max(1, Number(pageParam) || 1)
  const pageSize = 24
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Use optimized view for aggregates
  const { data: customers = [] } = await supabase
    .from('customers_optimized')
    .select('id, name, email, phone, customer_type, company_id, unit_count, service_count')
    .eq('company_id', profile.company_id)
    .order('name')
    .range(from, to)

  const hasCustomers = customers.length > 0
  const hasMore = customers.length === pageSize

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="mt-2 text-gray-600">
            Manage billing contacts and property owners
          </p>
        </div>
        <Link
          href="/customers/new"
          className="inline-flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-600 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Customer</span>
        </Link>
      </div>

      {/* Customers List */}
      {hasCustomers ? (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer: any) => (
              <Link
                key={customer.id}
                href={`/customers/${customer.id}`}
                className="group block rounded-xl border border-[#bbc3c4] bg-white p-6 shadow-md hover:border-primary hover:shadow-lg transition-all"
              >
                {/* Customer Icon & Name */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-50">
                      <Users className="h-6 w-6 text-accent-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {customer.name}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {String(customer.customer_type || '').replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mb-4 space-y-2">
                  {customer.email && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">{customer.unit_count || 0}</span>
                    <span className="text-gray-500"> units</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">{customer.service_count || 0}</span>
                    <span className="text-gray-500"> services</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4 mt-8">
            {page > 1 && (
              <Link href={`/customers?page=${page - 1}`} className="text-sm text-gray-700 underline">
                Previous
              </Link>
            )}
            {hasMore && (
              <Link href={`/customers?page=${page + 1}`} className="text-sm text-gray-700 underline">
                Next
              </Link>
            )}
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-50">
              <Users className="h-8 w-8 text-accent-700" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              No customers yet
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              Add customers to track who you bill for services
            </p>
            <Link
              href="/customers/new"
              className="inline-flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add Your First Customer</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

