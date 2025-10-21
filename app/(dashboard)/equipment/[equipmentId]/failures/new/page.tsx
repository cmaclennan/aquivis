'use client'

import { use } from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { logger } from '@/lib/logger'

export default function ReportFailurePage({ params }: { params: Promise<{ equipmentId: string }> }) {
  const { equipmentId } = use(params)
  const supabase = createClient()
  const router = useRouter()

  const [equipment, setEquipment] = useState<any>(null)
  const [failureType, setFailureType] = useState('mechanical')
  const [severity, setSeverity] = useState('minor')
  const [description, setDescription] = useState('')
  const [downtimeHours, setDowntimeHours] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const { data, error: eqError } = await supabase
          .from('equipment')
          .select('id, name, properties(name), units(name, properties(name)), plant_rooms(name, properties(name))')
          .eq('id', equipmentId)
          .single()

        if (eqError) throw eqError
        setEquipment(data)
      } catch (e: any) {
        logger.error('Failed to load equipment', e)
        setError(e.message)
      }
    })()
  }, [equipmentId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!description.trim()) {
      setError('Please provide a description of the failure')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()

      const { error: insertError } = await supabase
        .from('equipment_failures')
        .insert({
          equipment_id: equipmentId,
          failure_type: failureType,
          severity,
          description: description.trim(),
          downtime_hours: downtimeHours ? parseFloat(downtimeHours) : null,
          reported_by: user?.id,
          resolved: false
        })

      if (insertError) throw insertError

      logger.success('Failure reported successfully')
      router.push(`/equipment/${equipmentId}`)
    } catch (e: any) {
      logger.error('Failed to report failure', e)
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (!equipment) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const propertyName = equipment.properties?.name || 
                       equipment.units?.properties?.name || 
                       equipment.plant_rooms?.properties?.name || 
                       'Unknown Property'

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link 
          href={`/equipment/${equipmentId}`}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Equipment
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          Report Equipment Failure
        </h1>
        <p className="text-gray-600">{equipment.name} • {propertyName}</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl">
        {/* Failure Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Failure Type *
          </label>
          <select
            value={failureType}
            onChange={(e) => setFailureType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          >
            <option value="mechanical">Mechanical</option>
            <option value="electrical">Electrical</option>
            <option value="leak">Leak</option>
            <option value="performance">Performance</option>
            <option value="wear">Wear & Tear</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Severity */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Severity *
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSeverity('minor')}
              className={`p-4 rounded-lg border-2 transition-all ${
                severity === 'minor'
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">⚠️</div>
                <div className="text-sm font-medium">Minor</div>
                <div className="text-xs text-gray-500">Can wait</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSeverity('major')}
              className={`p-4 rounded-lg border-2 transition-all ${
                severity === 'major'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">🔶</div>
                <div className="text-sm font-medium">Major</div>
                <div className="text-xs text-gray-500">Needs attention</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSeverity('critical')}
              className={`p-4 rounded-lg border-2 transition-all ${
                severity === 'critical'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">🔴</div>
                <div className="text-sm font-medium">Critical</div>
                <div className="text-xs text-gray-500">Urgent</div>
              </div>
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Describe the failure, symptoms, and any relevant details..."
            required
          />
        </div>

        {/* Downtime Hours */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estimated Downtime (hours)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={downtimeHours}
            onChange={(e) => setDowntimeHours(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="e.g., 2.5"
          />
          <p className="text-xs text-gray-500 mt-1">
            How long is/was the equipment out of service?
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/equipment/${equipmentId}`}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Reporting...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                Report Failure
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

