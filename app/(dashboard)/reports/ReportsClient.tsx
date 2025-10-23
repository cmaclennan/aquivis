'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { BarChart3, TrendingUp, Calendar, Filter, Download, X } from 'lucide-react'

interface Service {
  id: string
  service_date: string
  service_type: string
  status: string
  units: {
    name: string
    unit_type: string
    properties: {
      name: string
    }
  }
  technician_id: string | null
}

interface Filters {
  dateRange: '7d' | '30d' | '90d' | 'custom'
  startDate: string
  endDate: string
  serviceType: string
  unitType: string
  property: string
  status: string
}

export default function ReportsClient() {
  const [services, setServices] = useState<Service[]>([])
  const [chemTotals, setChemTotals] = useState<Record<string, { quantity: number; unit: string }>>({})
  const [properties, setProperties] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState<'services' | 'equipment'>('services')
  const [equipmentLogs, setEquipmentLogs] = useState<any[]>([])
  const [includeTechCsv, setIncludeTechCsv] = useState(false)
  const [includeActionDetailsCsv, setIncludeActionDetailsCsv] = useState(false)

  const [filters, setFilters] = useState<Filters>({
    dateRange: '30d',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    serviceType: '',
    unitType: '',
    property: '',
    status: ''
  })

  const { data: session } = useSession()

  const loadData = useCallback(async () => {
    if (!session?.user?.company_id) return

    try {
      setLoading(true)

      // Load lookups (properties, customers)
      const lookupsRes = await fetch('/api/reports/lookups', { method: 'GET' })
      const lookups = await lookupsRes.json().catch(() => ({}))
      if (!lookupsRes.ok || lookups?.error) throw new Error(lookups?.error || 'Failed to load lookups')
      setProperties(lookups.properties || [])
      setCustomers(lookups.customers || [])

      // Load services
      const servicesRes = await fetch('/api/reports/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange: filters.dateRange,
          startDate: filters.startDate,
          endDate: filters.endDate,
          serviceType: filters.serviceType,
          unitType: filters.unitType,
          property: filters.property,
          status: filters.status,
        }),
      })
      const servicesJson = await servicesRes.json().catch(() => ({}))
      if (!servicesRes.ok || servicesJson?.error) throw new Error(servicesJson?.error || 'Failed to load services')
      setServices(servicesJson.services || [])

      // Load chemical totals
      const chemRes = await fetch('/api/reports/chemicals/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange: filters.dateRange,
          startDate: filters.startDate,
          endDate: filters.endDate,
        }),
      })
      const chemJson = await chemRes.json().catch(() => ({}))
      if (!chemRes.ok || chemJson?.error) throw new Error(chemJson?.error || 'Failed to load chemical totals')
      setChemTotals(chemJson.totals || {})
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters, session])

  const loadEquipmentData = useCallback(async () => {
    if (!session?.user?.company_id) return

    try {
      setLoading(true)

      const res = await fetch('/api/reports/equipment/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: filters.startDate,
          endDate: filters.endDate,
          property: filters.property,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to load equipment logs')
      setEquipmentLogs(json.logs || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters, session])

  useEffect(() => {
    if (!session?.user?.company_id) return

    if (activeTab === 'services') {
      loadData()
    } else {
      loadEquipmentData()
    }
  }, [filters, activeTab, loadData, loadEquipmentData, session])

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value }
      
      // Auto-update date range
      if (key === 'dateRange' && value !== 'custom') {
        const days = value === '7d' ? 7 : value === '30d' ? 30 : 90
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        newFilters.startDate = startDate.toISOString().split('T')[0]
        newFilters.endDate = new Date().toISOString().split('T')[0]
      }
      
      return newFilters
    })
  }

  const clearFilters = () => {
    setFilters({
      dateRange: '30d',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      serviceType: '',
      unitType: '',
      property: '',
      status: ''
    })
  }

  const exportCsv = () => {
    const rows = [
      ['Date', 'Service Type', 'Status', 'Unit', 'Unit Type', 'Property'],
      ...services.map(s => [
        new Date(s.service_date).toISOString(),
        getServiceTypeLabel(s.service_type),
        s.status,
        s.units?.name || '',
        s.units?.unit_type || '',
        s.units?.properties?.name || ''
      ])
    ]
    const csv = rows.map(r => r.map(String).map(v => '"' + v.replaceAll('"', '""') + '"').join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `services_${filters.startDate}_${filters.endDate}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportBillingCsv = async () => {
    // Build a grouped billing export by customer and property for chemicals
    // and append Jobs (existing customers + one-off)
    if (!session?.user?.company_id) return

    try {
      const res = await fetch('/api/reports/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: filters.startDate, endDate: filters.endDate }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to build billing data')

      const chemicals = (json.chemicals || []) as Array<{ customer: string; property: string; chemical: string; unit: string; quantity: number; cost: number }>
      const jobsExisting = (json.jobsExisting || []) as Array<{ customer: string; property: string; title: string; status: string; price: number }>
      const jobsOneOff = (json.jobsOneOff || []) as Array<{ contactName: string; contactEmail: string; contactPhone: string; title: string; status: string; price: number }>

      const rows = [
        ['Customer', 'Property', 'Chemical', 'Quantity', 'Unit', 'Cost'],
        ...chemicals.map(g => [g.customer, g.property, g.chemical, g.quantity.toFixed(2), g.unit, g.cost.toFixed(2)]),
      ]

      rows.push([])
      rows.push(['Jobs (Existing Customers)'])
      rows.push(['Customer', 'Property', 'Title', 'Status', 'Price'])
      jobsExisting.forEach((j) => {
        rows.push([j.customer, j.property, j.title, j.status, j.price.toFixed(2)])
      })

      rows.push([])
      rows.push(['Jobs (One-off)'])
      rows.push(['Contact', 'Email', 'Phone', 'Title', 'Status', 'Price'])
      jobsOneOff.forEach((j) => {
        rows.push([j.contactName, j.contactEmail, j.contactPhone, j.title, j.status, j.price.toFixed(2)])
      })
      const csv = rows.map(r => r.map(String).map(v => '"' + v.replaceAll('"', '""') + '"').join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `billing_${filters.startDate}_${filters.endDate}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError('Billing export failed: ' + (e as Error).message)
    }
  }

  const exportEquipmentCsv = async () => {
    if (!session?.user?.company_id) return

    try {
      const logs = equipmentLogs

      // Map technician names if requested
      let techNameById: Record<string, string> = {}
      if (includeTechCsv) {
        const ids = Array.from(new Set(((logs || []) as any[]).map((r: any) => r.performed_by).filter(Boolean)))
        if (ids.length) {
          const res = await fetch('/api/reports/technicians', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
          })
          const json = await res.json().catch(() => ({}))
          if (res.ok && json?.map) {
            techNameById = json.map as Record<string, string>
          }
        }
      }

      const header = ['Date', 'Time', 'Equipment', 'Property']
      if (includeTechCsv) header.push('Technician')
      header.push('Actions')
      if (includeActionDetailsCsv) header.push('Action Details')
      header.push('Notes')

      const rows = [
        header,
        ...((logs || []) as any[]).map((row: any) => {
          const base = [
            row.maintenance_date,
            row.maintenance_time,
            row.equipment?.name || '',
            row.equipment?.properties?.name || ''
          ] as any[]
          if (includeTechCsv) base.push(techNameById[row.performed_by as string] || '')
          const actionsSummary = Object.keys(row.actions || {}).filter((k) => (row.actions || {})[k]).join('; ')
          base.push(actionsSummary)
          if (includeActionDetailsCsv) base.push(JSON.stringify(row.actions || {}))
          base.push(row.notes || '')
          return base
        })
      ]
      const csv = rows.map(r => r.map(String).map(v => '"' + v.replaceAll('"', '""') + '"').join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `equipment_maintenance_${filters.startDate}_${filters.endDate}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError('Equipment export failed: ' + (e as Error).message)
    }
  }

  const getServiceTypes = () => {
    const types = [...new Set(services.map(s => s.service_type))]
    return types
  }

  const getUnitTypes = () => {
    const types = [...new Set(services.map(s => s.units.unit_type))]
    return types
  }

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'test_only':
        return 'Water Test Only'
      case 'full_service':
        return 'Full Service'
      case 'equipment_check':
        return 'Equipment Check'
      case 'plant_room_check':
        return 'Plant Room Check'
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  const getUnitTypeLabel = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Calculate statistics
  const totalServices = services.length
  const avgServicesPerDay = totalServices / (filters.dateRange === '7d' ? 7 : filters.dateRange === '30d' ? 30 : 90)
  
  const serviceTypes = services.reduce((acc: any, service) => {
    const type = service.service_type || 'Other'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

  const unitTypes = services.reduce((acc: any, service) => {
    const type = service.units?.unit_type || 'Unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading reports...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="mt-2 text-gray-600">
              Track your service performance and business metrics
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
            {activeTab === 'services' && (
              <>
                <button onClick={exportCsv} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
                <button onClick={exportBillingCsv} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                  <Download className="h-4 w-4 mr-2" />
                  Billing CSV
                </button>
              </>
            )}
            {activeTab === 'equipment' && (
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={includeTechCsv} onChange={(e) => setIncludeTechCsv(e.target.checked)} />
                  <span>Technician</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={includeActionDetailsCsv} onChange={(e) => setIncludeActionDetailsCsv(e.target.checked)} />
                  <span>Action details</span>
                </label>
                <button onClick={exportEquipmentCsv} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-800">
                  <Download className="h-4 w-4 mr-2" />
                  Equipment CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-2">
        <button onClick={() => setActiveTab('services')} className={`px-3 py-1.5 rounded border text-sm ${activeTab === 'services' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Services</button>
        <button onClick={() => setActiveTab('equipment')} className={`px-3 py-1.5 rounded border text-sm ${activeTab === 'equipment' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Equipment</button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-8 rounded-lg bg-white p-6 shadow border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="custom">Custom range</option>
              </select>
            </div>

            {filters.dateRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Service Type</label>
              <select
                value={filters.serviceType}
                onChange={(e) => handleFilterChange('serviceType', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="">All types</option>
                {getServiceTypes().map(type => (
                  <option key={type} value={type}>
                    {getServiceTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Unit Type</label>
              <select
                value={filters.unitType}
                onChange={(e) => handleFilterChange('unitType', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="">All types</option>
                {getUnitTypes().map(type => (
                  <option key={type} value={type}>
                    {getUnitTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Property</label>
              <select
                value={filters.property}
                onChange={(e) => handleFilterChange('property', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="">All properties</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="">All statuses</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="scheduled">Scheduled</option>
                <option value="skipped">Skipped</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear all filters
            </button>
            <div className="text-sm text-gray-600">
              {totalServices} services found
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Summary Cards - Services Tab */}
      {activeTab === 'services' && (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4 mb-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Services</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{totalServices}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Services/Day</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{avgServicesPerDay.toFixed(1)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Service Types</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{Object.keys(serviceTypes).length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Filter className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unit Types</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{Object.keys(unitTypes).length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>
      )}

      {activeTab === 'services' && (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Service Types Breakdown */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Service Types</h2>
            <button onClick={exportCsv} className="flex items-center space-x-2 text-sm text-primary hover:text-primary-600">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {Object.entries(serviceTypes).map(([type, count]: [string, any]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{getServiceTypeLabel(type)}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${totalServices > 0 ? (count / totalServices) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unit Types Breakdown */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Unit Types</h2>
            <button onClick={exportCsv} className="flex items-center space-x-2 text-sm text-primary hover:text-primary-600">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {Object.entries(unitTypes).map(([type, count]: [string, any]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{getUnitTypeLabel(type)}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${totalServices > 0 ? (count / totalServices) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chemicals Summary */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Chemicals Summary</h2>
            <button onClick={() => {
              const rows = [
                ['Chemical', 'Total Quantity', 'Unit'],
                ...Object.entries(chemTotals).map(([code, v]) => [code, String(v.quantity), v.unit])
              ]
              const csv = rows.map(r => r.map(String).map(v => '"' + v.replaceAll('"', '""') + '"').join(',')).join('\n')
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = `chemicals_${filters.startDate}_${filters.endDate}.csv`
              link.click()
              URL.revokeObjectURL(url)
            }} className="flex items-center space-x-2 text-sm text-primary hover:text-primary-600">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>

          {Object.keys(chemTotals).length === 0 ? (
            <div className="text-sm text-gray-600">No chemical additions found for the selected period.</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(chemTotals).map(([code, v]) => (
                <div key={code} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{code.replace('_',' ')}</span>
                  <span className="text-sm text-gray-700">{v.quantity.toFixed(2)} {v.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Services Table */}
      {activeTab === 'services' && (
      <div className="mt-8 rounded-lg bg-white shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Services</h2>
            <button onClick={exportCsv} className="flex items-center space-x-2 text-sm text-primary hover:text-primary-600">
              <Download className="h-4 w-4" />
              <span>Export All</span>
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.slice(0, 50).map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(service.service_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getServiceTypeLabel(service.service_type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {service.units?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {service.units?.properties?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      service.status === 'completed' ? 'bg-green-100 text-green-800' :
                      service.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      service.status === 'scheduled' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {service.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Equipment Table */}
      {activeTab === 'equipment' && (
        <div className="mt-8 rounded-lg bg-white shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Equipment Maintenance Logs</h2>
              <button onClick={exportEquipmentCsv} className="flex items-center space-x-2 text-sm text-primary hover:text-primary-600">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {equipmentLogs.slice(0, 100).map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(row.maintenance_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.maintenance_time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.equipment?.name || ''}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.equipment?.properties?.name || ''}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{Object.keys(row.actions || {}).filter((k) => row.actions[k]).join('; ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.notes || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'services' && totalServices === 0 && (
        <div className="mt-8 text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No services found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters or start logging services to see your analytics.
          </p>
          <div className="mt-6">
            <Link
              href="/services/new-guided"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600"
            >
              Log Your First Service
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

