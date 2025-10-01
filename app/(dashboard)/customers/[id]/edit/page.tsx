'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, Mail, Phone, MapPin, CreditCard, Trash2 } from 'lucide-react'
import Link from 'next/link'

type CustomerType = 'property_owner' | 'body_corporate' | 'hotel' | 'property_manager' | 'b2b_wholesale'

export default function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Unwrap params for Next.js 15
  const { id: customerId } = use(params)
  
  const router = useRouter()
  const supabase = createClient()
  
  // Form state
  const [name, setName] = useState('')
  const [customerType, setCustomerType] = useState<CustomerType>('property_owner')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [billingEmail, setBillingEmail] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('Net 30')
  const [notes, setNotes] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load customer data
  useEffect(() => {
    async function loadCustomer() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single()

        if (!profile?.company_id) throw new Error('No company found')

        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', customerId)
          .eq('company_id', profile.company_id)
          .single()

        if (customerError) throw customerError

        // Populate form
        setName(customer.name)
        setCustomerType(customer.customer_type)
        setEmail(customer.email || '')
        setPhone(customer.phone || '')
        setAddress(customer.address || '')
        setCity(customer.city || '')
        setState(customer.state || '')
        setPostalCode(customer.postal_code || '')
        setBillingEmail(customer.billing_email || '')
        setPaymentTerms(customer.payment_terms || 'Net 30')
        setNotes(customer.notes || '')
      } catch (err: any) {
        setError(err.message || 'Failed to load customer')
      } finally {
        setLoading(false)
      }
    }
    loadCustomer()
  }, [customerId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          name: name.trim(),
          customer_type: customerType,
          email: email.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          postal_code: postalCode.trim() || null,
          billing_email: billingEmail.trim() || null,
          payment_terms: paymentTerms,
          notes: notes.trim() || null,
        })
        .eq('id', customerId)

      if (updateError) throw updateError

      // Success - redirect to customer detail page
      router.push(`/customers/${customerId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to update customer')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this customer? Any units assigned to this customer will be unlinked (set to NULL). This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    setError(null)

    try {
      // Delete customer (units will have customer_id set to NULL due to ON DELETE SET NULL)
      const { error: deleteError } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)

      if (deleteError) throw deleteError

      // Success - redirect to customers list
      router.push('/customers')
    } catch (err: any) {
      setError(err.message || 'Failed to delete customer')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading customer...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/customers/${customerId}`}
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Customer</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Customer</h1>
        <p className="mt-2 text-gray-600">
          Update customer details and billing information
        </p>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow">
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="e.g., Accor Hotels, John Smith"
              required
            />
          </div>

          {/* Customer Type */}
          <div className="mb-6">
            <label htmlFor="type" className="mb-2 block text-sm font-medium text-gray-700">
              Customer Type *
            </label>
            <select
              id="type"
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value as CustomerType)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="property_owner">Property Owner</option>
              <option value="body_corporate">Body Corporate</option>
              <option value="hotel">Hotel / Letting Pool</option>
              <option value="property_manager">Property Manager</option>
              <option value="b2b_wholesale">B2B Wholesale</option>
            </select>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="contact@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <Phone className="h-4 w-4" />
                  <span>Phone</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="0400 000 000"
                />
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
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label htmlFor="city" className="mb-2 block text-sm font-medium text-gray-700">
                    City/Suburb
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder="Brisbane"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="mb-2 block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder="QLD"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="postalCode" className="mb-2 block text-sm font-medium text-gray-700">
                  Postal Code
                </label>
                <input
                  type="text"
                  id="postalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="4000"
                />
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
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="billing@example.com (defaults to contact email if blank)"
                />
              </div>

              <div>
                <label htmlFor="paymentTerms" className="mb-2 block text-sm font-medium text-gray-700">
                  Payment Terms
                </label>
                <select
                  id="paymentTerms"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                >
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Net 7">Net 7 Days</option>
                  <option value="Net 14">Net 14 Days</option>
                  <option value="Net 30">Net 30 Days</option>
                  <option value="Net 60">Net 60 Days</option>
                </select>
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="Any special billing instructions or notes"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="inline-flex items-center space-x-2 rounded-lg border border-error px-4 py-2 text-error hover:bg-error-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>{deleting ? 'Deleting...' : 'Delete Customer'}</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <Link
                href={`/customers/${customerId}`}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving || deleting || !name}
                className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

