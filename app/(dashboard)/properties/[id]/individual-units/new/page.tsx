'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Droplets, Hash, Gauge, Building2, User, CreditCard } from 'lucide-react'
import Link from 'next/link'

type UnitType = 'rooftop_spa' | 'plunge_pool' | 'villa_pool'
type WaterType = 'saltwater' | 'freshwater' | 'bromine'
type ServiceFrequency = 'daily_when_occupied' | 'daily' | 'twice_weekly' | 'weekly' | 'biweekly' | 'monthly' | 'custom'
type BillingEntity = 'unit_owner' | 'hotel' | 'body_corporate'

interface Customer {
  id: string
  name: string
  customer_type: string
}

export default function NewIndividualUnitPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const [propertyId, setPropertyId] = useState<string>('')
  
  // Form state
  const [unitType, setUnitType] = useState<UnitType>('rooftop_spa')
  const [name, setName] = useState('')
  const [unitNumber, setUnitNumber] = useState('')
  const [waterType, setWaterType] = useState<WaterType>('bromine')
  const [volumeLitres, setVolumeLitres] = useState('')
  const [depthMeters, setDepthMeters] = useState('')
  const [serviceFrequency, setServiceFrequency] = useState<ServiceFrequency>('daily_when_occupied')
  const [lastServiceWarningDays, setLastServiceWarningDays] = useState('7')
  const [billingEntity, setBillingEntity] = useState<BillingEntity>('unit_owner')
  const [customerId, setCustomerId] = useState('')
  const [riskCategory, setRiskCategory] = useState<'low' | 'medium' | 'high'>('high')
  const [notes, setNotes] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [property, setProperty] = useState<any>(null)
  const [customers, setCustomers] = useState<Customer[]>([])

  const loadData = useCallback(async (resolvedPropertyId: string) => {
    try {
      const propRes = await fetch(`/api/properties/${resolvedPropertyId}`)
      const propJson = await propRes.json().catch(() => ({}))
      if (!propRes.ok || propJson?.error) throw new Error(propJson?.error || 'Failed to load property')
      setProperty(propJson.property)

      const custRes = await fetch('/api/customers')
      const custJson = await custRes.json().catch(() => ({}))
      if (!custRes.ok || custJson?.error) throw new Error(custJson?.error || 'Failed to load customers')
      setCustomers(custJson.customers || [])
    } catch (err: any) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    // Resolve params Promise
    params.then((resolvedParams) => {
      setPropertyId(resolvedParams.id)
      loadData(resolvedParams.id)
    })
  }, [loadData, params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          unit_type: unitType,
          name: name || null,
          unit_number: unitNumber || null,
          water_type: waterType,
          volume_litres: volumeLitres ? parseInt(volumeLitres) : null,
          depth_meters: depthMeters ? parseFloat(depthMeters) : null,
          service_frequency: serviceFrequency,
          last_service_warning_days: parseInt(lastServiceWarningDays),
          billing_entity: billingEntity,
          customer_id: customerId || null,
          risk_category: riskCategory,
          notes: notes || null,
          is_active: true
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to create unit')

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
            <h1 className="text-3xl font-bold text-gray-900">Add Individual Unit</h1>
            <p className="mt-2 text-gray-600">
              Add a private pool or spa for {property.name}
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
              <span>Unit Type *</span>
            </label>
            <select
              id="unitType"
              value={unitType}
              onChange={(e) => setUnitType(e.target.value as UnitType)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="rooftop_spa">Rooftop Spa</option>
              <option value="plunge_pool">Plunge Pool (Villa)</option>
              <option value="villa_pool">Villa Pool</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Private facilities owned by individual customers
            </p>
          </div>

          {/* Name */}
          <div className="mb-6">
            <label htmlFor="name" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Hash className="h-4 w-4" />
              <span>Unit Name *</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="e.g., Unit 203 Rooftop Spa, Villa 5 Plunge Pool"
              required
            />
          </div>

          {/* Unit Number */}
          <div className="mb-6">
            <label htmlFor="unitNumber" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Hash className="h-4 w-4" />
              <span>Unit Number *</span>
            </label>
            <input
              type="text"
              id="unitNumber"
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="e.g., 203, Villa 5, Room 301"
              required
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
              placeholder="e.g., 500 (for spa), 15000 (for plunge pool)"
            />
            <p className="mt-1 text-xs text-gray-500">
              Approximate volume in litres
            </p>
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
              <option value="daily_when_occupied">Daily (When Occupied)</option>
              <option value="daily">Daily</option>
              <option value="twice_weekly">Twice Weekly</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom Schedule</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              "Daily (When Occupied)" is recommended for hotel units
            </p>
          </div>

          {/* Billing Entity */}
          <div className="mb-6">
            <label htmlFor="billingEntity" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
              <CreditCard className="h-4 w-4" />
              <span>Billing Entity *</span>
            </label>
            <select
              id="billingEntity"
              value={billingEntity}
              onChange={(e) => setBillingEntity(e.target.value as BillingEntity)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="unit_owner">Individual Unit Owner</option>
              <option value="hotel">Hotel / Letting Pool</option>
              <option value="body_corporate">Body Corporate</option>
            </select>
          </div>

          {/* Customer Selection */}
          {billingEntity === 'unit_owner' && (
            <div className="mb-6">
              <label htmlFor="customerId" className="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-700">
                <User className="h-4 w-4" />
                <span>Customer *</span>
              </label>
              <select
                id="customerId"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                required
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.customer_type})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Select the customer who owns this unit
              </p>
            </div>
          )}

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
              placeholder="Any special notes about this unit..."
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
              {loading ? 'Creating...' : 'Create Individual Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
