'use client'

import { use } from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertTriangle, CheckCircle2, Clock, DollarSign, Wrench, Calendar, TrendingUp } from 'lucide-react'
import { logger } from '@/lib/logger'

interface Equipment {
  id: string
  name: string
  category: string
  equipment_type: string
  maintenance_frequency: string
  maintenance_scheduled: boolean
  is_active: boolean
  notes: string
  property_id: string
  unit_id: string
  plant_room_id: string
  properties?: { name: string }
  units?: { name: string; properties: { name: string } }
  plant_rooms?: { name: string; properties: { name: string } }
}

interface Failure {
  id: string
  failure_date: string
  failure_type: string
  severity: string
  description: string
  resolved: boolean
  resolved_date: string
  resolution_notes: string
  total_cost: number
  downtime_hours: number
}

interface MaintenanceLog {
  id: string
  maintenance_date: string
  maintenance_time: string
  actions: any
  notes: string
  performed_by: string
  profiles?: { full_name: string }
}

export default function EquipmentDetailPage({ params }: { params: Promise<{ equipmentId: string }> }) {
  const { equipmentId } = use(params)
  const router = useRouter()

  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [failures, setFailures] = useState<Failure[]>([])
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([])
  const [failureSummary, setFailureSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)

        // Fetch equipment details
        const eqRes = await fetch(`/api/equipment/${equipmentId}`)
        const eqJson = await eqRes.json()
        if (!eqRes.ok) throw new Error(eqJson.error || 'Failed to load equipment')
        setEquipment(eqJson.equipment)

        // Fetch failures
        const failuresRes = await fetch(`/api/equipment/${equipmentId}/failures`)
        const failuresJson = await failuresRes.json()
        if (!failuresRes.ok) throw new Error(failuresJson.error || 'Failed to load failures')
        setFailures(failuresJson.failures || [])

        // Fetch maintenance logs
        const logsRes = await fetch(`/api/equipment/${equipmentId}/maintenance`)
        const logsJson = await logsRes.json()
        if (!logsRes.ok) throw new Error(logsJson.error || 'Failed to load maintenance logs')
        setMaintenanceLogs(logsJson.logs || [])

        // Fetch failure summary
        const summaryRes = await fetch(`/api/equipment/${equipmentId}/failures/summary`)
        const summaryJson = await summaryRes.json()
        if (summaryRes.ok) {
          setFailureSummary(summaryJson.summary)
        } else {
          logger.warn('Failed to fetch failure summary', summaryJson.error)
        }

      } catch (e: any) {
        logger.error('Failed to load equipment details', e)
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [equipmentId])

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Loading equipment details...</div>
      </div>
    )
  }

  if (error || !equipment) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-600">
          {error || 'Equipment not found'}
        </div>
      </div>
    )
  }

  const propertyName = equipment.properties?.name || 
                       equipment.units?.properties?.name || 
                       equipment.plant_rooms?.properties?.name || 
                       'Unknown Property'

  const locationName = equipment.units?.name || equipment.plant_rooms?.name || 'Unknown Location'

  const unresolvedFailures = failures.filter(f => !f.resolved)
  const resolvedFailures = failures.filter(f => f.resolved)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => router.back()} 
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{equipment.name}</h1>
            <p className="text-gray-600">{propertyName} • {locationName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/equipment/${equipmentId}/failures/new`}
              className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Report Failure
            </Link>
            <Link
              href={`/equipment/${equipmentId}/maintain`}
              className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-600 flex items-center gap-2"
            >
              <Wrench className="h-4 w-4" />
              Log Maintenance
            </Link>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-semibold text-gray-900">
                {equipment.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
            {equipment.is_active ? (
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-gray-400" />
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unresolved Failures</p>
              <p className="text-lg font-semibold text-gray-900">{unresolvedFailures.length}</p>
            </div>
            <AlertTriangle className={`h-8 w-8 ${unresolvedFailures.length > 0 ? 'text-red-500' : 'text-gray-300'}`} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-lg font-semibold text-gray-900">
                ${failureSummary?.total_cost?.toFixed(2) || '0.00'}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Downtime</p>
              <p className="text-lg font-semibold text-gray-900">
                {failureSummary?.total_downtime_hours?.toFixed(1) || '0'} hrs
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Equipment Details */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Equipment Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Category</p>
            <p className="text-sm font-medium text-gray-900">{equipment.category || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Maintenance Frequency</p>
            <p className="text-sm font-medium text-gray-900">{equipment.maintenance_frequency || 'Not scheduled'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Maintenance Scheduled</p>
            <p className="text-sm font-medium text-gray-900">{equipment.maintenance_scheduled ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Notes</p>
            <p className="text-sm font-medium text-gray-900">{equipment.notes || 'None'}</p>
          </div>
        </div>
      </div>

      {/* Unresolved Failures */}
      {unresolvedFailures.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Unresolved Failures ({unresolvedFailures.length})
          </h2>
          <div className="space-y-3">
            {unresolvedFailures.map(failure => (
              <Link
                key={failure.id}
                href={`/equipment/${equipmentId}/failures/${failure.id}`}
                className="block p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        failure.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        failure.severity === 'major' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {failure.severity}
                      </span>
                      <span className="text-xs text-gray-500">{failure.failure_type}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{failure.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(failure.failure_date).toLocaleDateString()}
                    </p>
                  </div>
                  {failure.total_cost > 0 && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${failure.total_cost.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Maintenance */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Maintenance</h2>
        {maintenanceLogs.length === 0 ? (
          <p className="text-sm text-gray-600">No maintenance logs yet</p>
        ) : (
          <div className="space-y-3">
            {maintenanceLogs.map(log => (
              <div key={log.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(log.maintenance_date).toLocaleDateString()} at {log.maintenance_time}
                    </p>
                    {log.actions && (
                      <div className="flex gap-2 mt-1">
                        {log.actions.inspected && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Inspected</span>}
                        {log.actions.cleaned && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Cleaned</span>}
                        {log.actions.replaced_parts && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Parts Replaced</span>}
                      </div>
                    )}
                    {log.notes && <p className="text-sm text-gray-600 mt-1">{log.notes}</p>}
                  </div>
                  {log.profiles?.full_name && (
                    <p className="text-xs text-gray-500">{log.profiles.full_name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Failure History */}
      {resolvedFailures.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resolved Failures ({resolvedFailures.length})</h2>
          <div className="space-y-3">
            {resolvedFailures.slice(0, 5).map(failure => (
              <Link
                key={failure.id}
                href={`/equipment/${equipmentId}/failures/${failure.id}`}
                className="block p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-gray-500">{failure.failure_type}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{failure.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Failed: {new Date(failure.failure_date).toLocaleDateString()} • 
                      Resolved: {new Date(failure.resolved_date).toLocaleDateString()}
                    </p>
                  </div>
                  {failure.total_cost > 0 && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${failure.total_cost.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

