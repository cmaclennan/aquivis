'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, MapPin, Phone, Mail, User, Trash2 } from 'lucide-react'
import Link from 'next/link'

type PropertyType = 'residential' | 'commercial' | 'resort' | 'body_corporate'

export default function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Unwrap params for Next.js 15
  const { id: propertyId } = use(params)
  
  const router = useRouter()
  const supabase = createClient()
  
  // Form state
  const [name, setName] = useState('')
  const [propertyType, setPropertyType] = useState<PropertyType>('residential')
  const [hasIndividualUnits, setHasIndividualUnits] = useState(false)
  const [address, setAddress] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [notes, setNotes] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load property data
  useEffect(() => {
    async function loadProperty() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single()

        if (!profile?.company_id) throw new Error('No company found')

        const { data: property, error: propertyError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', propertyId)
          .eq('company_id', profile.company_id)
          .single()

        if (propertyError) throw propertyError

        // Populate form
        setName(property.name)
        setPropertyType(property.property_type)
        setHasIndividualUnits(property.has_individual_units || false)
        setAddress(property.address || '')
        setContactName(property.contact_name || '')
        setContactEmail(property.contact_email || '')
        setContactPhone(property.contact_phone || '')
        setNotes(property.notes || '')
      } catch (err: any) {
        setError(err.message || 'Failed to load property')
      } finally {
        setLoading(false)
      }
    }
    loadProperty()
  }, [propertyId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('properties')
        .update({
          name: name.trim(),
          property_type: propertyType,
          has_individual_units: hasIndividualUnits,
          address: address.trim() || null,
          contact_name: contactName.trim() || null,
          contact_email: contactEmail.trim() || null,
          contact_phone: contactPhone.trim() || null,
          notes: notes.trim() || null,
        })
        .eq('id', propertyId)

      if (updateError) throw updateError

      // Success - redirect to property detail page
      router.push(`/properties/${propertyId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to update property')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this property? This will also delete all pools/spas associated with it. This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    setError(null)

    try {
      // Delete property (cascade will delete units)
      const { error: deleteError } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId)

      if (deleteError) throw deleteError

      // Success - redirect to properties list
      router.push('/properties')
    } catch (err: any) {
      setError(err.message || 'Failed to delete property')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading property...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/properties/${propertyId}`}
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Property</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Property</h1>
        <p className="mt-2 text-gray-600">
          Update property details and contact information
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

          {/* Property Name */}
          <div className="mb-6">
            <label htmlFor="name" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Building2 className="h-4 w-4" />
              <span>Property Name *</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="e.g., Sheraton Grand Mirage, 123 Smith Street"
              required
            />
          </div>

          {/* Property Type */}
          <div className="mb-6">
            <label htmlFor="type" className="mb-2 block text-sm font-medium text-gray-700">
              Property Type *
            </label>
            <select
              id="type"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as PropertyType)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="resort">Resort</option>
              <option value="body_corporate">Body Corporate / Strata</option>
            </select>
          </div>

          {/* Has Individual Units */}
          <div className="mb-6">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={hasIndividualUnits}
                onChange={(e) => setHasIndividualUnits(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Property has individual units
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  Check this if the property has privately owned units (e.g., condos, villas, hotel rooms) with their own pools/spas. 
                  Leave unchecked for properties with only shared facilities.
                </p>
              </div>
            </label>
          </div>

          {/* Address */}
          <div className="mb-6">
            <label htmlFor="address" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
              <MapPin className="h-4 w-4" />
              <span>Address</span>
            </label>
            <textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="123 Main Street, Suburb, QLD 4000"
            />
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Contact Information</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="contactName" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <User className="h-4 w-4" />
                  <span>Contact Name</span>
                </label>
                <input
                  type="text"
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="Property manager or owner name"
                />
              </div>

              <div>
                <label htmlFor="contactEmail" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <Mail className="h-4 w-4" />
                  <span>Contact Email</span>
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="contact@example.com"
                />
              </div>

              <div>
                <label htmlFor="contactPhone" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <Phone className="h-4 w-4" />
                  <span>Contact Phone</span>
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="0400 000 000"
                />
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
              placeholder="Any special instructions or notes about this property"
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
              <span>{deleting ? 'Deleting...' : 'Delete Property'}</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <Link
                href={`/properties/${propertyId}`}
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

