'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Droplets, Hash, Gauge, Building2 } from 'lucide-react'
import Link from 'next/link'
import ScheduleBuilder from '@/components/scheduling/ScheduleBuilder'

type UnitType = 'residential_pool' | 'main_pool' | 'kids_pool' | 'main_spa' | 'splash_park'
type WaterType = 'saltwater' | 'freshwater' | 'bromine'
type ServiceFrequency = 'daily' | 'twice_weekly' | 'weekly' | 'biweekly' | 'monthly' | 'custom'

export default function NewSharedFacilityPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const supabase = createClient()
  const [propertyId, setPropertyId] = useState<string>('')
  
  // Form state
  const [unitType, setUnitType] = useState<UnitType>('main_pool')
  const [name, setName] = useState('')
  const [unitNumber, setUnitNumber] = useState('')
  const [waterType, setWaterType] = useState<WaterType>('saltwater')
  const [volumeLitres, setVolumeLitres] = useState('')
  const [depthMeters, setDepthMeters] = useState('')
  const [serviceFrequency, setServiceFrequency] = useState<ServiceFrequency>('weekly')
  const [lastServiceWarningDays, setLastServiceWarningDays] = useState('7')
  const [showScheduleBuilder, setShowScheduleBuilder] = useState(false)
  const [customSchedule, setCustomSchedule] = useState<any>(null)
  const [riskCategory, setRiskCategory] = useState<'low' | 'medium' | 'high'>('medium')
  const [notes, setNotes] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [property, setProperty] = useState<any>(null)

  const loadProperty = useCallback(async (resolvedPropertyId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!profile?.company_id) throw new Error('No company found')

      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('id, name, property_type')
        .eq('id', resolvedPropertyId)
        .eq('company_id', profile.company_id)
        .single()

      if (propertyError) throw propertyError
      setProperty(propertyData)
    } catch (err: any) {
      setError(err.message)
    }
  }, [supabase])

  useEffect(() => {
    // Resolve params Promise
    params.then((resolvedParams) => {
      setPropertyId(resolvedParams.id)
      loadProperty(resolvedParams.id)
    })
  }, [loadProperty, params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!profile?.company_id) throw new Error('No company found')

      // Create shared facility
      const { data: unit, error: unitError } = await supabase
        .from('units')
        .insert({
          property_id: propertyId,
          unit_type: unitType,
          name: name || null,
          unit_number: unitNumber || null,
          water_type: waterType,
          volume_litres: volumeLitres ? parseInt(volumeLitres) : null,
          depth_meters: depthMeters ? parseFloat(depthMeters) : null,
          service_frequency: serviceFrequency,
          last_service_warning_days: parseInt(lastServiceWarningDays),
          billing_entity: 'property', // Always property for shared facilities
          risk_category: riskCategory,
          notes: notes || null,
          is_active: true
        })
        .select()
        .single()

      if (unitError) throw unitError

      // Create custom schedule if one was configured
      if (serviceFrequency === 'custom' && customSchedule) {
        const { error: scheduleError } = await supabase
          .from('custom_schedules')
          .insert({
            unit_id: unit.id,
            schedule_type: customSchedule.schedule_type,
            schedule_config: customSchedule.schedule_config,
            service_types: customSchedule.service_types,
            name: customSchedule.name,
            description: customSchedule.description,
            is_active: true
          })

        if (scheduleError) throw scheduleError
      }

      // Redirect to property detail page
      router.push(`/properties/${propertyId}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-gray-600">Loading property...</p>
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
          <span>Back to {property.name}</span>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add Shared Facility</h1>
            <p className="mt-2 text-gray-600">
              Add a shared pool or spa for {property.name}
            </p>
          </div>
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
              <span>Facility Type *</span>
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
              <option value="splash_park">Splash Park</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Shared facilities available to all property users
            </p>
          </div>

          {/* Name */}
          <div className="mb-6">
            <label htmlFor="name" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Hash className="h-4 w-4" />
              <span>Facility Name *</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="e.g., Main Pool, Kids Pool, Spa"
              required
            />
          </div>

          {/* Unit Number (optional) */}
          <div className="mb-6">
            <label htmlFor="unitNumber" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Hash className="h-4 w-4" />
              <span>Facility Number (optional)</span>
            </label>
            <input
              type="text"
              id="unitNumber"
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="e.g., Pool 1, Spa A"
            />
          </div>

          {/* Water Type */}
          <div className="mb-6">
            <label htmlFor="waterType" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Droplets className="h-4 w-4" />
              <span>Water Type *</span>
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
            <label htmlFor="volumeLitres" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Gauge className="h-4 w-4" />
              <span>Volume (litres)</span>
            </label>
            <input
              type="number"
              id="volumeLitres"
              value={volumeLitres}
              onChange={(e) => setVolumeLitres(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="e.g., 450000"
            />
            <p className="mt-1 text-xs text-gray-500">
              Approximate volume in litres
            </p>
          </div>

          {/* Depth */}
          <div className="mb-6">
            <label htmlFor="depthMeters" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Gauge className="h-4 w-4" />
              <span>Depth (meters)</span>
            </label>
            <input
              type="number"
              step="0.1"
              id="depthMeters"
              value={depthMeters}
              onChange={(e) => setDepthMeters(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="e.g., 1.5"
            />
          </div>

          {/* Service Frequency */}
          <div className="mb-6">
            <label htmlFor="serviceFrequency" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Building2 className="h-4 w-4" />
              <span>Service Frequency *</span>
            </label>
            <select
              id="serviceFrequency"
              value={serviceFrequency}
              onChange={(e) => setServiceFrequency(e.target.value as ServiceFrequency)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="daily">Daily</option>
              <option value="twice_weekly">Twice Weekly</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom Schedule</option>
            </select>
            {serviceFrequency === 'custom' && (
              <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-600 mb-3">
                  Custom schedules allow you to create complex scheduling patterns. Click "Configure Custom Schedule" to set up advanced scheduling options.
                </p>
                <button
                  type="button"
                  onClick={() => setShowScheduleBuilder(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                >
                  Configure Custom Schedule
                </button>
              </div>
            )}
          </div>

          {/* Risk Category */}
          <div className="mb-6">
            <label htmlFor="riskCategory" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Building2 className="h-4 w-4" />
              <span>Risk Category *</span>
            </label>
            <select
              id="riskCategory"
              value={riskCategory}
              onChange={(e) => setRiskCategory(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              QLD Health compliance risk category
            </p>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label htmlFor="notes" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
              <span>Notes (optional)</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="Any special notes about this facility..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href={`/properties/${propertyId}`}
              className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Shared Facility'}
            </button>
          </div>
        </form>
      </div>

      {/* Schedule Builder Modal */}
      {showScheduleBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <ScheduleBuilder
              unitId={undefined} // This is for a new unit
              propertyId={propertyId}
              context="shared"
              hasBookings={false}
              onSave={(schedule) => {
                setCustomSchedule(schedule)
                setShowScheduleBuilder(false)
              }}
              onCancel={() => setShowScheduleBuilder(false)}
              initialSchedule={customSchedule}
            />
          </div>
        </div>
      )}
    </div>
  )
}
