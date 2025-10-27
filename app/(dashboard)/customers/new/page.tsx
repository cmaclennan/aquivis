'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, Mail, Phone, MapPin, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { customerSchema, type CustomerFormData } from '@/lib/validations/schemas'

export default function NewCustomerPage() {
  const router = useRouter()
  const { data: session } = useSession()

  // Form with validation
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      customer_type: 'property_owner',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: 'QLD',
      postal_code: '',
      billing_email: '',
      payment_terms: 'Net 30',
      notes: '',
    }
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: CustomerFormData) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
          customer_type: data.customer_type,
          email: data.email?.trim() || null,
          phone: data.phone?.trim() || null,
          address: data.address?.trim() || null,
          city: data.city?.trim() || null,
          state: data.state?.trim() || null,
          postal_code: data.postal_code?.trim() || null,
          billing_email: data.billing_email?.trim() || null,
          payment_terms: data.payment_terms || 'Net 30',
          notes: data.notes?.trim() || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to create customer')
      router.push(`/customers/${json.customer.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create customer')
    } finally {
      setLoading(false)
    }
  }

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
        <h1 className="text-3xl font-bold text-gray-900">Add Customer</h1>
        <p className="mt-2 text-gray-600">
          Add a new customer for billing and property management
        </p>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="rounded-lg bg-white p-6 shadow">
          {error && (
            <div className="mb-6 rounded-lg bg-error-light p-4 text-sm text-error">
              {error}
            </div>
          )}

          {/* Customer Name */}
          <div className="mb-6">
            <label htmlFor="name" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Users className="h-4 w-4" />
              <span>Customer Name *</span>
            </label>
            <input
              type="text"
              id="name"
              {...form.register('name')}
              className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                form.formState.errors.name 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-primary focus:ring-primary-200'
              }`}
              placeholder="e.g., Accor Hotels, John Smith, Sea Temple Body Corporate"
            />
            {form.formState.errors.name && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Customer Type */}
          <div className="mb-6">
            <label htmlFor="type" className="mb-2 block text-sm font-medium text-gray-700">
              Customer Type *
            </label>
            <select
              id="type"
              {...form.register('customer_type')}
              className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                form.formState.errors.customer_type 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-primary focus:ring-primary-200'
              }`}
            >
              <option value="property_owner">Property Owner</option>
              <option value="body_corporate">Body Corporate</option>
              <option value="hotel">Hotel / Letting Pool</option>
              <option value="property_manager">Property Manager</option>
              <option value="b2b_wholesale">B2B Wholesale</option>
            </select>
            {form.formState.errors.customer_type && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.customer_type.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Determines billing structure and reporting
            </p>
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Contact Information</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </label>
                <input
                  type="email"
                  id="email"
                  {...form.register('email')}
                  className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                    form.formState.errors.email 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:border-primary focus:ring-primary-200'
                  }`}
                  placeholder="contact@example.com"
                />
                {form.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <Phone className="h-4 w-4" />
                  <span>Phone</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  {...form.register('phone')}
                  className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                    form.formState.errors.phone 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:border-primary focus:ring-primary-200'
                  }`}
                  placeholder="0400 000 000"
                />
                {form.formState.errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.phone.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="mb-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Address</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="address" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <MapPin className="h-4 w-4" />
                  <span>Street Address</span>
                </label>
            <input
              type="text"
              id="address"
              {...form.register('address')}
              className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                form.formState.errors.address 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-primary focus:ring-primary-200'
              }`}
              placeholder="123 Main Street"
            />
            {form.formState.errors.address && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.address.message}</p>
            )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label htmlFor="city" className="mb-2 block text-sm font-medium text-gray-700">
                    City/Suburb
                  </label>
                  <input
                    type="text"
                    id="city"
                    {...form.register('city')}
                    className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                      form.formState.errors.city 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-primary focus:ring-primary-200'
                    }`}
                    placeholder="Brisbane"
                  />
                  {form.formState.errors.city && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="state" className="mb-2 block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    {...form.register('state')}
                    className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                      form.formState.errors.state 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-primary focus:ring-primary-200'
                    }`}
                    placeholder="QLD"
                  />
                  {form.formState.errors.state && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.state.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="postalCode" className="mb-2 block text-sm font-medium text-gray-700">
                  Postal Code
                </label>
                <input
                  type="text"
                  id="postalCode"
                  {...form.register('postal_code')}
                  className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                    form.formState.errors.postal_code 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:border-primary focus:ring-primary-200'
                  }`}
                  placeholder="4000"
                />
                {form.formState.errors.postal_code && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.postal_code.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Billing Information */}
          <div className="mb-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Billing Information</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="billingEmail" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <CreditCard className="h-4 w-4" />
                  <span>Billing Email</span>
                </label>
                <input
                  type="email"
                  id="billingEmail"
                  {...form.register('billing_email')}
                  className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                    form.formState.errors.billing_email 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:border-primary focus:ring-primary-200'
                  }`}
                  placeholder="billing@example.com (defaults to contact email if blank)"
                />
                {form.formState.errors.billing_email && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.billing_email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="paymentTerms" className="mb-2 block text-sm font-medium text-gray-700">
                  Payment Terms
                </label>
                <select
                  id="paymentTerms"
                  {...form.register('payment_terms')}
                  className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                    form.formState.errors.payment_terms 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:border-primary focus:ring-primary-200'
                  }`}
                >
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Net 7">Net 7 Days</option>
                  <option value="Net 14">Net 14 Days</option>
                  <option value="Net 30">Net 30 Days</option>
                  <option value="Net 60">Net 60 Days</option>
                </select>
                {form.formState.errors.payment_terms && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.payment_terms.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label htmlFor="notes" className="mb-2 block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              {...form.register('notes')}
              rows={3}
              className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                form.formState.errors.notes 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-primary focus:ring-primary-200'
              }`}
              placeholder="Any special billing instructions or notes"
            />
            {form.formState.errors.notes && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.notes.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 border-t border-gray-200 pt-6">
            <Link
              href="/customers"
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

