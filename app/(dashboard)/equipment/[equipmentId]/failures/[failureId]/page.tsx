'use client'

import { use } from 'react'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, DollarSign, Clock } from 'lucide-react'
import { logger } from '@/lib/logger'

interface Failure {
  id: string
  equipment_id: string
  failure_date: string
  failure_type: string
  severity: string
  description: string
  resolved: boolean
  resolved_date: string
  resolved_by: string
  resolution_notes: string
  parts_cost: number
  labor_cost: number
  total_cost: number
  downtime_hours: number
  reported_by: string
  equipment?: { name: string }
  profiles?: { full_name: string }
}

export default function FailureDetailPage({ params }: { params: Promise<{ equipmentId: string; failureId: string }> }) {
  const { equipmentId, failureId } = use(params)
  const { data: session } = useSession()
  const router = useRouter()

  const [failure, setFailure] = useState<Failure | null>(null)
  const [editing, setEditing] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [partsCost, setPartsCost] = useState('')
  const [laborCost, setLaborCost] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        // Load equipment name for header
        const eqRes = await fetch(`/api/equipment/${equipmentId}`)
        const eqJson = await eqRes.json()
        if (!eqRes.ok) throw new Error(eqJson.error || 'Failed to load equipment')
        const equipmentName = eqJson.equipment?.name

        // Load failures for this equipment then pick by id
        const fRes = await fetch(`/api/equipment/${equipmentId}/failures`)
        const fJson = await fRes.json()
        if (!fRes.ok) throw new Error(fJson.error || 'Failed to load failures')
        const f = (fJson.failures || []).find((x: any) => x.id === failureId)
        if (!f) throw new Error('Failure not found')
        setFailure({ ...f, equipment: { name: equipmentName } } as any)
        setResolutionNotes(f.resolution_notes || '')
        setPartsCost(f.parts_cost?.toString() || '')
        setLaborCost(f.labor_cost?.toString() || '')
      } catch (e: any) {
        logger.error('Failed to load failure details', e)
        setError(e.message)
      }
    })()
  }, [equipmentId, failureId])

  const handleResolve = async () => {
    if (!session?.user?.id) return

    try {
      setSaving(true)
      setError(null)

      const res = await fetch(`/api/equipment/${equipmentId}/failures/${failureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolved: true,
          resolved_date: new Date().toISOString(),
          resolved_by: session.user.id,
          resolution_notes: resolutionNotes.trim() || null,
          parts_cost: partsCost ? parseFloat(partsCost) : 0,
          labor_cost: laborCost ? parseFloat(laborCost) : 0,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to resolve failure')

      logger.success('Failure marked as resolved')
      router.push(`/equipment/${equipmentId}`)
    } catch (e: any) {
      logger.error('Failed to resolve failure', e)
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    try {
      setSaving(true)
      setError(null)

      const res = await fetch(`/api/equipment/${equipmentId}/failures/${failureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution_notes: resolutionNotes.trim() || null,
          parts_cost: partsCost ? parseFloat(partsCost) : 0,
          labor_cost: laborCost ? parseFloat(laborCost) : 0,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to update failure')

      logger.success('Failure updated successfully')
      setEditing(false)
      
      // Reload data quickly
      const fRes = await fetch(`/api/equipment/${equipmentId}/failures`)
      const fJson = await fRes.json()
      if (fRes.ok) {
        const equipmentName = (failure as any)?.equipment?.name
        const f = (fJson.failures || []).find((x: any) => x.id === failureId)
        if (f) setFailure({ ...f, equipment: { name: equipmentName } } as any)
      }
    } catch (e: any) {
      logger.error('Failed to update failure', e)
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (!failure) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const severityColor = 
    failure.severity === 'critical' ? 'bg-red-100 text-red-700 border-red-200' :
    failure.severity === 'major' ? 'bg-orange-100 text-orange-700 border-orange-200' :
    'bg-yellow-100 text-yellow-700 border-yellow-200'

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
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Failure Details</h1>
            <p className="text-gray-600">{failure.equipment?.name}</p>
          </div>
          {!failure.resolved && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600"
            >
              Edit & Resolve
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Status Banner */}
      {failure.resolved ? (
        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
          <div>
            <p className="font-medium text-green-900">Resolved</p>
            <p className="text-sm text-green-700">
              {new Date(failure.resolved_date).toLocaleDateString()} at {new Date(failure.resolved_date).toLocaleTimeString()}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 flex items-center gap-3">
          <div className="h-6 w-6 rounded-full bg-red-500 animate-pulse" />
          <div>
            <p className="font-medium text-red-900">Unresolved</p>
            <p className="text-sm text-red-700">This failure requires attention</p>
          </div>
        </div>
      )}

      {/* Failure Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Failure Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Failure Date</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(failure.failure_date).toLocaleDateString()} at {new Date(failure.failure_date).toLocaleTimeString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Reported By</p>
            <p className="text-sm font-medium text-gray-900">{failure.profiles?.full_name || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Failure Type</p>
            <p className="text-sm font-medium text-gray-900 capitalize">{failure.failure_type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Severity</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${severityColor}`}>
              {failure.severity}
            </span>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-1">Description</p>
          <p className="text-sm text-gray-900">{failure.description}</p>
        </div>
      </div>

      {/* Cost & Downtime */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            <p className="text-sm font-medium text-gray-700">Parts Cost</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">${failure.parts_cost?.toFixed(2) || '0.00'}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            <p className="text-sm font-medium text-gray-700">Labor Cost</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">${failure.labor_cost?.toFixed(2) || '0.00'}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <p className="text-sm font-medium text-gray-700">Downtime</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{failure.downtime_hours?.toFixed(1) || '0'} hrs</p>
        </div>
      </div>

      {/* Resolution Section */}
      {(editing || failure.resolved) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resolution Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution Notes
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={4}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50"
                placeholder="Describe what was done to resolve the failure..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parts Cost ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={partsCost}
                  onChange={(e) => setPartsCost(e.target.value)}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Labor Cost ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50"
                  placeholder="0.00"
                />
              </div>
            </div>

            {editing && (
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                {!failure.resolved ? (
                  <button
                    onClick={handleResolve}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Resolving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Mark as Resolved
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleUpdate}
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                  >
                    {saving ? 'Updating...' : 'Update Details'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

