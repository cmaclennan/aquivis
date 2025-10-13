'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
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
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    serviceType: '',
    unitType: '',
    property: '',
    status: ''
  })

  const supabase = createClient()

  useEffect(() => {
    if (activeTab === 'services') {
      loadData()
    } else {
      loadEquipmentData()
    }
  }, [filters, activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!profile?.company_id) throw new Error('No company found')

      // Load properties and customers
      const [{ data: propertiesData, error: propertiesError }, { data: customersData, error: customersError }] = await Promise.all([
        supabase.from('properties').select('id, name').eq('company_id', profile.company_id),
        supabase.from('customers').select('id, name').eq('company_id', profile.company_id)
      ])

      if (propertiesError) throw propertiesError
      if (customersError) throw customersError
      setProperties(propertiesData || [])
      setCustomers(customersData || [])

      // Build query
      let query = supabase
        .from('services')
        .select(`
          *,
          units!inner(
            name,
            unit_type,
            properties!inner(name, company_id)
          )
        `)
        .eq('units.properties.company_id', profile.company_id)

      // Apply date filter
      if (filters.dateRange === 'custom') {
        query = query
          .gte('service_date', `${filters.startDate}T00:00:00.000Z`)
          .lte('service_date', `${filters.endDate}T23:59:59.999Z`)
      } else {
        const days = filters.dateRange === '7d' ? 7 : filters.dateRange === '30d' ? 30 : 90
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        query = query.gte('service_date', startDate.toISOString())
      }

      // Apply other filters
      if (filters.serviceType) {
        query = query.eq('service_type', filters.serviceType)
      }
      if (filters.unitType) {
        query = query.eq('units.unit_type', filters.unitType)
      }
      if (filters.property) {
        query = query.eq('units.properties.id', filters.property)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query.order('service_date', { ascending: false })

      if (error) throw error
      setServices(data || [])

      // Load chemical totals using existing chemical_additions table
      let chemQuery = supabase
        .from('chemical_additions')
        .select(`chemical_type, unit_of_measure, quantity, services!inner(service_date, units!inner(properties!inner(company_id)))`)
        .eq('services.units.properties.company_id', profile.company_id)

      if (filters.dateRange === 'custom') {
        chemQuery = chemQuery
          .gte('services.service_date', `${filters.startDate}T00:00:00.000Z`)
          .lte('services.service_date', `${filters.endDate}T23:59:59.999Z`)
      } else {
        const days = filters.dateRange === '7d' ? 7 : filters.dateRange === '30d' ? 30 : 90
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        chemQuery = chemQuery.gte('services.service_date', startDate.toISOString())
      }

      const { data: chemData } = await chemQuery
      const grouped: Record<string, { quantity: number; unit: string }> = {}
      ;(chemData || []).forEach((row: any) => {
        const key = row.chemical_type || 'unknown'
        if (!grouped[key]) grouped[key] = { quantity: 0, unit: row.unit_of_measure || '' }
        grouped[key].quantity += Number(row.quantity || 0)
        grouped[key].unit = row.unit_of_measure || grouped[key].unit
      })
      setChemTotals(grouped)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadEquipmentData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()
      if (!profile?.company_id) throw new Error('No company found')

      // Date filter
      const startIso = `${filters.startDate}T00:00:00.000Z`
      const endIso = `${filters.endDate}T23:59:59.999Z`

      let eqQuery = supabase
        .from('equipment_maintenance_logs')
        .select('maintenance_date, maintenance_time, actions, notes, equipment:equipment_id(name, properties!inner(id, name, company_id))')
        .eq('equipment.properties.company_id', profile.company_id)
        .gte('maintenance_date', filters.startDate)
        .lte('maintenance_date', filters.endDate)
        .order('maintenance_date', { ascending: false })

      if (filters.property) {
        eqQuery = eqQuery.eq('equipment.properties.id', filters.property)
      }

      const { data, error } = await eqQuery
      if (error) throw error
      setEquipmentLogs(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()
      const startIso = `${filters.startDate}T00:00:00.000Z`
      const endIso = `${filters.endDate}T23:59:59.999Z`

      let rowsQuery = supabase
        .from('chemical_additions')
        .select(`quantity, unit_of_measure, chemical_type, services!inner(service_date, units!inner(id, customer_id, properties!inner(id, name, customer_id, company_id)))`)
        .eq('services.units.properties.company_id', profile!.company_id)
        .gte('services.service_date', startIso)
        .lte('services.service_date', endIso)

      const { data: chemRows, error } = await rowsQuery
      if (error) throw error

      // Load pricebook
      const { data: prices } = await supabase
        .from('company_chemical_prices')
        .select('chemical_code, unit, price_per_unit, property_id')
        .eq('company_id', profile!.company_id)

      const priceKey = (code: string, unit: string, propertyId?: string) => `${propertyId || 'all'}::${code}::${unit}`
      const priceMap: Record<string, number> = {}
      ;(prices || []).forEach((p: any) => { priceMap[priceKey(p.chemical_code, p.unit, p.property_id || undefined)] = Number(p.price_per_unit) })

      const customerNameById = new Map<string, string>(customers.map((c: any) => [c.id, c.name]))
      const propertyNameById = new Map<string, string>(properties.map((p: any) => [p.id, p.name]))

      type Key = string
      const grouped: Record<Key, { customer: string; property: string; chemical: string; unit: string; quantity: number; cost: number }>
        = {}
      ;(chemRows || []).forEach((r: any) => {
        const property = r.services?.units?.properties
        const custId = r.services?.units?.customer_id || property?.customer_id || ''
        const customerName = customerNameById.get(custId) || 'Unassigned'
        const chem = r.chemical_type || 'unknown'
        const unit = r.unit_of_measure || ''
        const key = `${customerName}||${property?.name || ''}||${chem}||${unit}`
        const qty = Number(r.quantity || 0)
        const unitPrice = priceMap[priceKey(chem, unit, property?.id)] ?? priceMap[priceKey(chem, unit)] ?? 0
        if (!grouped[key]) grouped[key] = { customer: customerName, property: property?.name || '', chemical: chem, unit, quantity: 0, cost: 0 }
        grouped[key].quantity += qty
        grouped[key].cost += qty * unitPrice
      })

      // Fetch jobs in range (completed or scheduled in window if not completed)
      const { data: jobsCompleted } = await supabase
        .from('jobs')
        .select('id, title, status, price_cents, completed_at, scheduled_at, customer_id, property_id, external_contact, company_id')
        .eq('company_id', profile!.company_id)
        .not('completed_at', 'is', null)
        .gte('completed_at', startIso)
        .lte('completed_at', endIso)

      const { data: jobsScheduled } = await supabase
        .from('jobs')
        .select('id, title, status, price_cents, completed_at, scheduled_at, customer_id, property_id, external_contact, company_id')
        .eq('company_id', profile!.company_id)
        .is('completed_at', null)
        .gte('scheduled_at', startIso)
        .lte('scheduled_at', endIso)

      const jobsAll = ([...(jobsCompleted || []), ...(jobsScheduled || [])] as any[])
      const jobsExisting = jobsAll.filter(j => !!j.customer_id)
      const jobsOneOff = jobsAll.filter(j => !j.customer_id)

      const rows = [
        ['Customer', 'Property', 'Chemical', 'Quantity', 'Unit', 'Cost'],
        ...Object.values(grouped).map(g => [g.customer, g.property, g.chemical, g.quantity.toFixed(2), g.unit, g.cost.toFixed(2)])
      ]

      rows.push([])
      rows.push(['Jobs (Existing Customers)'])
      rows.push(['Customer', 'Property', 'Title', 'Status', 'Price'])
      jobsExisting.forEach((j: any) => {
        const custName = customerNameById.get(j.customer_id) || 'Unknown'
        const propName = j.property_id ? (propertyNameById.get(j.property_id) || '') : ''
        const price = (Number(j.price_cents || 0) / 100).toFixed(2)
        rows.push([custName, propName, j.title || '', (j.status || '').replace('_',' '), price])
      })

      rows.push([])
      rows.push(['Jobs (One-off)'])
      rows.push(['Contact', 'Email', 'Phone', 'Title', 'Status', 'Price'])
      jobsOneOff.forEach((j: any) => {
        const c = j.external_contact || {}
        const price = (Number(j.price_cents || 0) / 100).toFixed(2)
        rows.push([c.name || '', c.email || '', c.phone || '', j.title || '', (j.status || '').replace('_',' '), price])
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
      console.error('Billing export failed', e)
    }
  }

  const exportEquipmentCsv = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()
      const startIso = `${filters.startDate}T00:00:00.000Z`
      const endIso = `${filters.endDate}T23:59:59.999Z`
      const { data: logs } = await supabase
        .from('equipment_maintenance_logs')
        .select('maintenance_date, maintenance_time, actions, notes, performed_by, equipment:equipment_id(name, properties!inner(name, company_id))')
        .eq('equipment.properties.company_id', profile!.company_id)
        .gte('maintenance_date', filters.startDate)
        .lte('maintenance_date', filters.endDate)
        .order('maintenance_date', { ascending: false })

      // Map technician names if requested
      let techNameById: Record<string, string> = {}
      if (includeTechCsv) {
        const ids = Array.from(new Set(((logs || []) as any[]).map(r => r.performed_by).filter(Boolean)))
        if (ids.length) {
          const { data: techs } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', ids as string[])
          ;(techs || []).forEach((t: any) => {
            const name = `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Technician'
            techNameById[t.id] = name
          })
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
      console.error('Equipment export failed', e)
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
            <a
              href="/services/new-guided"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600"
            >
              Log Your First Service
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

