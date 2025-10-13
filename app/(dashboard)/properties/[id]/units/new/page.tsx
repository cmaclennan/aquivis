'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Droplets, Hash, Gauge, Calendar as CalIcon } from 'lucide-react'
import ScheduleBuilder from '@/components/scheduling/ScheduleBuilder'
import Link from 'next/link'

type UnitType = 'residential_pool' | 'main_pool' | 'kids_pool' | 'main_spa' | 'rooftop_spa' | 'plunge_pool' | 'villa_pool'
type WaterType = 'saltwater' | 'freshwater' | 'bromine'

export default function NewUnitPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Unwrap params Promise for Next.js 15
  const { id: propertyId } = use(params)
  
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
  const [pendingSchedule, setPendingSchedule] = useState<any | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load property name and customers
  useEffect(() => {
    async function loadData() {
      // Load property name
      const { data: property } = await supabase
        .from('properties')
        .select('name')
        .eq('id', propertyId)
        .single()
      
      if (property) {
        setPropertyName(property.name)
      }

      // Load company customers for dropdown
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single()

        if (profile) {
          const { data: customersData } = await supabase
            .from('customers')
            .select('id, name, customer_type')
            .eq('company_id', profile.company_id)
            .eq('is_active', true)
            .order('name')

          if (customersData) {
            setCustomers(customersData)
          }
        }
      }
    }
    loadData()
  }, [propertyId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Get current user and company
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!profile?.company_id) throw new Error('No company found')

      // Verify property belongs to company
      const { data: property } = await supabase
        .from('properties')
        .select('id, total_volume_litres')
        .eq('id', propertyId)
        .eq('company_id', profile.company_id)
        .single()

      if (!property) throw new Error('Property not found')

      // Parse volume
      const volume = volumeLitres ? parseInt(volumeLitres) : null

      // Create unit
      const { data: unit, error: unitError } = await supabase
        .from('units')
        .insert({
          property_id: propertyId,
          unit_number: unitNumber.trim() || null,
          name: name.trim() || null,
          unit_type: unitType,
          water_type: waterType,
          volume_litres: volume,
          billing_entity: billingEntity,
          customer_id: customerId || null,
          notes: notes.trim() || null,
        })
        .select()
        .single()

      if (unitError) throw unitError

      // Update property total volume if volume was provided
      if (volume) {
        const newTotal = (property.total_volume_litres || 0) + volume
        await supabase
          .from('properties')
          .update({ total_volume_litres: newTotal })
          .eq('id', propertyId)
      }

      // If a pending custom schedule exists, save it now and set unit to custom
      if (pendingSchedule) {
        await supabase
          .from('custom_schedules')
          .insert({
            unit_id: unit.id,
            schedule_type: pendingSchedule.schedule_type,
            schedule_config: pendingSchedule.schedule_config,
            service_types: pendingSchedule.service_types,
            name: pendingSchedule.name,
            description: pendingSchedule.description,
            is_active: true
          })
        await supabase
          .from('units')
          .update({ service_frequency: 'custom' })
          .eq('id', unit.id)
      }

      // Success - redirect to unit detail page
      router.push(`/properties/${propertyId}/units/${unit.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create unit')
    } finally {
      setLoading(false)
    }
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
          <span>Back to {propertyName || 'Property'}</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Add Pool/Spa</h1>
        <p className="mt-2 text-gray-600">
          Add a pool, spa, or other body of water to track and service
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
          <div className="flex items-center justify-end space-x-3 border-t border-gray-200 pt-6">
            <Link
              href={`/properties/${propertyId}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={() => setShowScheduleBuilder(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600"
            >
              <CalIcon className="h-4 w-4 mr-2" /> Configure Custom Schedule
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Unit'}
            </button>
          </div>
        </form>
      </div>
      {/* Schedule Builder Modal */}
      {showScheduleBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <ScheduleBuilder
              propertyId={propertyId}
              context="unit"
              unitType={unitType}
              hasBookings={false}
              onCancel={() => setShowScheduleBuilder(false)}
              onSave={(schedule) => {
                setPendingSchedule(schedule)
                setShowScheduleBuilder(false)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

