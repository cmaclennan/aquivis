'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { BarChart3, Users, ClipboardList, Calendar, Filter, Download } from 'lucide-react'

interface KPI {
  totalServices: number
  completedToday: number
  pendingToday: number
  testsToday: number
}

export default function ManagementDashboardPage() {
  const { data: session } = useSession()
  const [kpi, setKpi] = useState<KPI>({ totalServices: 0, completedToday: 0, pendingToday: 0, testsToday: 0 })
  const [activities, setActivities] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    property: '',
    technician: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!session?.user?.company_id) return

    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('start', filters.startDate)
      params.set('end', filters.endDate)
      if (filters.property) params.set('propertyId', filters.property)
      if (filters.technician) params.set('technicianId', filters.technician)
      const res = await fetch(`/api/management/overview?${params.toString()}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to load management data')
      setProperties(json.properties || [])
      setTechnicians(json.technicians || [])
      setKpi(json.kpi || { totalServices: 0, completedToday: 0, pendingToday: 0, testsToday: 0 })
      setActivities(json.activities || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [filters, session])

  useEffect(() => {
    if (!session?.user?.company_id) return
    loadData()
  }, [loadData, session])

  const exportActivityCsv = () => {
    const rows = [
      ['Date', 'Type', 'Status', 'Unit', 'Property', 'Technician'],
      ...activities.map(a => [
        new Date(a.service_date).toISOString(),
        a.service_type,
        a.status,
        a.units?.name || '',
        a.units?.properties?.name || '',
        a.technician_id || ''
      ])
    ]
    const csv = rows.map(r => r.map(String).map(v => '"' + v.replaceAll('"', '""') + '"').join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `activity_${filters.startDate}_${filters.endDate}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Management Dashboard</h1>
          <p className="mt-2 text-gray-600">Overview of services, tests, and team activity</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow border">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start</label>
            <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End</label>
            <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Property</label>
            <select value={filters.property} onChange={(e) => setFilters({ ...filters, property: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm">
              <option value="">All</option>
              {properties.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Technician</label>
            <select value={filters.technician} onChange={(e) => setFilters({ ...filters, technician: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm">
              <option value="">All</option>
              {technicians.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={exportActivityCsv} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600">
              <Download className="h-4 w-4 mr-2" /> Export Activity
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4 mb-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Services</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{kpi.totalServices}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{kpi.completedToday}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <ClipboardList className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{kpi.pendingToday}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Water Tests</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{kpi.testsToday}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Technician Activity</h2>
        </div>

        {activities.length === 0 ? (
          <div className="text-sm text-gray-600">No activity found for the selected period.</div>
        ) : (
          <div className="space-y-3">
            {activities.map((a) => (
              <div key={a.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{a.units?.name}</div>
                  <div className="text-xs text-gray-600">{a.units?.properties?.name} • {new Date(a.service_date).toLocaleString()}</div>
                </div>
                <div className="text-sm text-gray-700 capitalize">{a.service_type.replace('_',' ')}</div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  a.status === 'completed' ? 'bg-green-100 text-green-800' :
                  a.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  a.status === 'scheduled' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {a.status.replace('_',' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}






