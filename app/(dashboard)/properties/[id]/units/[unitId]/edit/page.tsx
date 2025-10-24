'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Droplets, Hash, Gauge, Trash2, Calendar as CalIcon } from 'lucide-react'
import Link from 'next/link'
import ScheduleBuilder from '@/components/scheduling/ScheduleBuilder'

type UnitType = 'residential_pool' | 'main_pool' | 'kids_pool' | 'main_spa' | 'rooftop_spa' | 'plunge_pool' | 'villa_pool'
type WaterType = 'saltwater' | 'freshwater' | 'bromine'

export default function EditUnitPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>
}) {
  // Unwrap params for Next.js 15
  const { id: propertyId, unitId } = use(params)

  const { data: session } = useSession()
  const router = useRouter()
  const supabase = createClient()
  
  const [propertyName, setPropertyName] = useState('')
  const [customers, setCustomers] = useState<Array<{id: string, name: string, customer_type: string}>>([])
  
  // Form state
  const [unitNumber, setUnitNumber] = useState('')
  const [name, setName] = useState('')
  const [unitType, setUnitType] = useState<UnitType>('residential_pool')
  const [waterType, setWaterType] = useState<WaterType>('saltwater')
  const [volumeLitres, setVolumeLitres] = useState('')
  const [billingEntity, setBillingEntity] = useState<'property' | 'unit_owner' | 'hotel' | 'body_corporate'>('property')
  const [customerId, setCustomerId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [showScheduleBuilder, setShowScheduleBuilder] = useState(false)
  const [hasBookings, setHasBookings] = useState(false)
  const [customSchedule, setCustomSchedule] = useState<any>(null)
  const [oldVolume, setOldVolume] = useState<number | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load unit data
  useEffect(() => {
    if (!session?.user?.company_id) return

    async function loadUnit() {
      try {

        // Load property name
        const { data: property } = await supabase
          .from('properties')
          .select('name')
          .eq('id', propertyId)
          .eq('company_id', session.user.company_id)
          .single()

        if (property) {
          setPropertyName(property.name)
        }

        // Load customers for dropdown
        const { data: customersData } = await supabase
          .from('customers')
          .select('id, name, customer_type')
          .eq('company_id', session.user.company_id)
          .eq('is_active', true)
          .order('name')

        if (customersData) {
          setCustomers(customersData)
        }

        // Load unit
        const { data: unit, error: unitError } = await supabase
          .from('units')
          .select('*, property:properties!inner(company_id), service_frequency')
          .eq('id', unitId)
          .eq('property_id', propertyId)
          .single()

        if (unitError) throw unitError
        if (unit.property.company_id !== profile.company_id) throw new Error('Unauthorized')

        // Populate form
        setUnitNumber(unit.unit_number || '')
        setName(unit.name || '')
        setUnitType(unit.unit_type)
        setWaterType(unit.water_type)
        setVolumeLitres(unit.volume_litres ? unit.volume_litres.toString() : '')
        setBillingEntity(unit.billing_entity || 'property')
        setCustomerId(unit.customer_id || '')
        setOldVolume(unit.volume_litres)
        setNotes(unit.notes || '')

        // Detect if property/units use bookings (simple heuristic: any bookings exist for unit)
        const { data: bookingExists } = await supabase
          .from('bookings')
          .select('id')
          .eq('unit_id', unitId)
          .limit(1)

        setHasBookings(!!(bookingExists && bookingExists.length))

        // Load existing custom schedule if service_frequency is custom
        if (unit.service_frequency === 'custom') {
          const { data: existingSchedule } = await supabase
            .from('custom_schedules')
            .select('schedule_type, schedule_config, service_types, name, description')
            .eq('unit_id', unitId)
            .eq('is_active', true)
            .single()
          if (existingSchedule) setCustomSchedule(existingSchedule)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load unit')
      } finally {
        setLoading(false)
      }
    }
    loadUnit()
  }, [propertyId, unitId, supabase, session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const newVolume = volumeLitres ? parseInt(volumeLitres) : null

      // Update unit
      const { error: updateError } = await supabase
        .from('units')
        .update({
          unit_number: unitNumber.trim() || null,
          name: name.trim() || null,
          unit_type: unitType,
          water_type: waterType,
          volume_litres: newVolume,
          billing_entity: billingEntity,
          customer_id: customerId || null,
          notes: notes.trim() || null,
        })
        .eq('id', unitId)

      if (updateError) throw updateError

      // Update property total volume if volume changed
      if (oldVolume !== newVolume) {
        const { data: property } = await supabase
          .from('properties')
          .select('total_volume_litres')
          .eq('id', propertyId)
          .single()

        if (property) {
          const currentTotal = property.total_volume_litres || 0
          const volumeDiff = (newVolume || 0) - (oldVolume || 0)
          const newTotal = Math.max(0, currentTotal + volumeDiff)

          await supabase
            .from('properties')
            .update({ total_volume_litres: newTotal })
            .eq('id', propertyId)
        }
      }

      // Success - redirect to unit detail page
      router.push(`/properties/${propertyId}/units/${unitId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to update unit')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this pool/spa? This will also delete all associated service records. This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    setError(null)

    try {
      // Update property total volume
      if (oldVolume) {
        const { data: property } = await supabase
          .from('properties')
          .select('total_volume_litres')
          .eq('id', propertyId)
          .single()

        if (property) {
          const newTotal = Math.max(0, (property.total_volume_litres || 0) - oldVolume)
          await supabase
            .from('properties')
            .update({ total_volume_litres: newTotal })
            .eq('id', propertyId)
        }
      }

      // Delete unit (cascade will delete related records)
      const { error: deleteError } = await supabase
        .from('units')
        .delete()
        .eq('id', unitId)

      if (deleteError) throw deleteError

      // Success - redirect to property detail page
      router.push(`/properties/${propertyId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to delete unit')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading pool/spa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/properties/${propertyId}/units/${unitId}`}
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to {name || 'Pool/Spa'}</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Pool/Spa</h1>
        <p className="mt-2 text-gray-600">
          Update details for this pool or spa at {propertyName}
        </p>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowScheduleBuilder(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600"
          >
            <CalIcon className="h-4 w-4 mr-2" /> Manage Schedule
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow">
          {error && (
            <div className="mb-6 rounded-lg bg-error-light p-4 text-sm text-error">
              {error}
            </div>
          )}

          {/* Unit Type */}
          <div className="mb-6">
            <label htmlFor="unitType" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Droplets className="h-4 w-4" />
              <span>Unit Type *</span>
            </label>
            <select
              id="unitType"
              value={unitType}
              onChange={(e) => setUnitType(e.target.value as UnitType)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="residential_pool">Residential Pool</option>
              <option value="main_pool">Main Pool (Resort)</option>
              <option value="kids_pool">Kids Pool (Resort)</option>
              <option value="main_spa">Main Spa (Resort)</option>
              <option value="rooftop_spa">Rooftop Spa</option>
              <option value="plunge_pool">Plunge Pool (Villa)</option>
              <option value="villa_pool">Villa Pool</option>
            </select>
          </div>

          {/* Name - Primary identifier */}
          <div className="mb-6">
            <label htmlFor="name" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Hash className="h-4 w-4" />
              <span>Pool/Spa Name</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="e.g., Main Pool, Rooftop Spa, Villa 5 Plunge Pool"
            />
            <p className="mt-1 text-xs text-gray-500">
              Descriptive name for this pool or spa
            </p>
          </div>

          {/* Unit Number (optional) */}
          <div className="mb-6">
            <label htmlFor="unitNumber" className="mb-2 block text-sm font-medium text-gray-700">
              Unit/Room Number (Optional)
            </label>
            <input
              type="text"
              id="unitNumber"
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="e.g., 201, Building A"
            />
            <p className="mt-1 text-xs text-gray-500">
              For properties with unit numbers (condos, hotels, villas). Leave blank if not applicable.
            </p>
          </div>

          {/* Water Type */}
          <div className="mb-6">
            <label htmlFor="waterType" className="mb-2 block text-sm font-medium text-gray-700">
              Water Type *
            </label>
            <select
              id="waterType"
              value={waterType}
              onChange={(e) => setWaterType(e.target.value as WaterType)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="saltwater">Saltwater (Chlorinated)</option>
              <option value="freshwater">Freshwater (Chlorinated)</option>
              <option value="bromine">Bromine</option>
            </select>
          </div>

          {/* Volume */}
          <div className="mb-6">
            <label htmlFor="volume" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Gauge className="h-4 w-4" />
              <span>Volume (Litres)</span>
            </label>
            <input
              type="number"
              id="volume"
              value={volumeLitres}
              onChange={(e) => setVolumeLitres(e.target.value)}
              min="0"
              step="1"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="e.g., 50000"
            />
            <p className="mt-1 text-xs text-gray-500">
              Water volume in litres (used for chemical dosing calculations)
            </p>
          </div>

          {/* Billing & Ownership */}
          <div className="mb-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Billing & Ownership</h3>
            
            <div className="space-y-4">
              {/* Billing Entity */}
              <div>
                <label htmlFor="billingEntity" className="mb-2 block text-sm font-medium text-gray-700">
                  Bill To
                </label>
                <select
                  id="billingEntity"
                  value={billingEntity}
                  onChange={(e) => setBillingEntity(e.target.value as typeof billingEntity)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                >
                  <option value="property">Property Owner</option>
                  <option value="unit_owner">Individual Unit Owner</option>
                  <option value="hotel">Hotel / Letting Pool</option>
                  <option value="body_corporate">Body Corporate</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Who pays for services on this pool/spa
                </p>
              </div>

              {/* Customer Assignment */}
              <div>
                <label htmlFor="customer" className="mb-2 block text-sm font-medium text-gray-700">
                  Assign to Customer
                </label>
                <select
                  id="customer"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                >
                  <option value="">No customer assigned</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.customer_type.replace('_', ' ')})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Link this pool/spa to a specific customer for billing.{' '}
                  {customers.length === 0 && (
                    <Link href="/customers/new" className="text-primary hover:text-primary-600">
                      Add a customer →
                    </Link>
                  )}
                </p>
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
              placeholder="Any special instructions or notes about this unit"
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
              <span>{deleting ? 'Deleting...' : 'Delete Pool/Spa'}</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <Link
                href={`/properties/${propertyId}/units/${unitId}`}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving || deleting}
                className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Schedule Builder Modal */}
      {showScheduleBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <ScheduleBuilder
              unitId={unitId}
              propertyId={propertyId}
              context="unit"
              unitType={unitType}
              hasBookings={hasBookings}
              initialSchedule={customSchedule}
              onCancel={() => setShowScheduleBuilder(false)}
              onSave={async (schedule) => {
                // Upsert custom schedule and mark unit as custom frequency
                // Avoid onConflict for portability; do a delete+insert
                await supabase
                  .from('custom_schedules')
                  .delete()
                  .eq('unit_id', unitId)

                const { error: upsertError } = await supabase
                  .from('custom_schedules')
                  .insert({
                    unit_id: unitId,
                    schedule_type: schedule.schedule_type,
                    schedule_config: schedule.schedule_config,
                    service_types: schedule.service_types,
                    name: schedule.name,
                    description: schedule.description,
                    is_active: true
                  })

                if (!upsertError) {
                  await supabase
                    .from('units')
                    .update({ service_frequency: 'custom' })
                    .eq('id', unitId)
                  setCustomSchedule(schedule)
                  setShowScheduleBuilder(false)
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

