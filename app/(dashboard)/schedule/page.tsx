'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Calendar, Clock, User, Home, Droplets, Settings, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface ScheduledTask {
  id: string
  type: 'service' | 'plant_check'
  unit_id?: string
  plant_room_id?: string
  equipment_id?: string
  property_id: string
  property_name: string
  unit_name?: string
  plant_room_name?: string
  unit_type?: string
  service_type?: string
  scheduled_time?: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  priority: 'high' | 'medium' | 'low'
  is_occupied?: boolean
  booking_source?: string
}

interface Props {}

export default function SchedulePage({}: Props) {
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [propertiesState, setPropertiesState] = useState<Array<{ id: string; name: string }>>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all')
  const [technicians, setTechnicians] = useState<Array<{ id: string; name: string }>>([])
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('all')

  const { data: session } = useSession()

  useEffect(() => {
    // Load persisted property filter
    const stored = typeof window !== 'undefined' ? localStorage.getItem('schedule.selectedProperty') : null
    if (stored) setSelectedPropertyId(stored)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('schedule.selectedProperty', selectedPropertyId)
    }
  }, [selectedPropertyId])

  const loadSchedule = useCallback(async () => {
    if (!session?.user?.company_id) return

    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('date', selectedDate)
      if (selectedPropertyId && selectedPropertyId !== 'all') params.set('propertyId', selectedPropertyId)
      const res = await fetch(`/api/schedule?${params.toString()}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to load schedule')
      setPropertiesState(json.properties || [])
      setTechnicians(json.technicians || [])
      setTasks(json.tasks || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [selectedDate, selectedPropertyId, session])

  useEffect(() => {
    if (!session?.user?.company_id) return
    loadSchedule()
  }, [loadSchedule, session])

  // Generate tasks from a unit's custom schedule
  const generateTasksFromCustomSchedule = (
    _customSchedule: any,
    _unit: any,
    _property: any,
    _date: string,
    _isOccupied: boolean
  ): ScheduledTask[] => { return [] }

  // Generate tasks based on property-level rules
  const generateTasksFromPropertyRules = (
    _rules: any[], _units: any[], _property: any, _date: string
  ): ScheduledTask[] => { return [] }

  // Equipment maintenance tasks
  const generateEquipmentTasks = async (
    _propertyId: string,
    _propertyName: string,
    _date: string
  ): Promise<ScheduledTask[]> => { return [] }

  // Frequency matching with optional preferred day or explicit days list
  const matchesFrequency = (
    frequency: string,
    date: string,
    preferredDay?: string,
    explicitDays?: string[],
    isOccupied?: boolean
  ): boolean => {
    const today = new Date(date)
    const dow = today.getDay() // 0=Sun..6=Sat
    const dayMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    }

    if (explicitDays && explicitDays.length) {
      const target = explicitDays.map((d) => (dayMap[d?.toLowerCase?.()] ?? -1))
      return target.includes(dow)
    }

    switch (frequency) {
      case 'daily_when_occupied':
        return !!isOccupied
      case 'daily':
        return true
      case 'twice_weekly':
        return dow === 1 || dow === 4
      case 'weekly':
        if (preferredDay && dayMap[preferredDay?.toLowerCase?.()] !== undefined) {
          return dayMap[preferredDay.toLowerCase()] === dow
        }
        return dow === 1
      case 'biweekly':
        return dow === 1 && Math.floor(today.getDate() / 7) % 2 === 0
      case 'monthly':
        return today.getDate() === 1
      case 'specific_days':
        // Already handled by explicitDays check above
        return false
      default:
        return false
    }
  }

  // Helpers for occupancy rules
  const getWeekStart = (dateStr: string) => {
    const d = new Date(dateStr)
    const day = d.getDay()
    const diff = (day + 6) % 7
    const start = new Date(d)
    start.setDate(d.getDate() - diff)
    start.setHours(0,0,0,0)
    return start.toISOString().slice(0,10)
  }
  const getWeekEnd = (dateStr: string) => {
    const start = new Date(getWeekStart(dateStr))
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23,59,59,999)
    return end.toISOString().slice(0,10)
  }
  const getBiWeeklyPeriod = (dateStr: string) => {
    const start = new Date(getWeekStart(dateStr))
    const end = new Date(start)
    end.setDate(start.getDate() + 13)
    end.setHours(23,59,59,999)
    return { start: start.toISOString().slice(0,10), end: end.toISOString().slice(0,10) }
  }
  const isDay = (dateStr: string, dayName: string) => {
    const d = new Date(dateStr)
    const map: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 }
    return map[(dayName || '').toLowerCase()] === d.getDay()
  }
  const unitHasServiceBetween = async (unitId: string, start: string, end: string) => {
    try {
      const params = new URLSearchParams()
      params.set('unitId', unitId)
      params.set('startDate', start)
      params.set('endDate', end)
      params.set('limit', '1')
      const res = await fetch(`/api/services?${params.toString()}`)
      const json = await res.json().catch(() => ({}))
      return !!(res.ok && !json?.error && Array.isArray(json.services) && json.services.length > 0)
    } catch {
      return false
    }
  }

  // Deterministic RNG from seed
  const seededRng = (seed: string) => {
    let h = 2166136261 >>> 0
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    return () => {
      // xorshift*
      h += 0x6D2B79F5
      let t = Math.imul(h ^ (h >>> 15), 1 | h)
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }

  const pickRandomDistinct = (arr: any[], count: number, rng: () => number) => {
    const n = Math.min(count, arr.length)
    const result: any[] = []
    const used = new Set<number>()
    while (result.length < n) {
      const idx = Math.floor(rng() * arr.length)
      if (!used.has(idx)) {
        used.add(idx)
        result.push(arr[idx])
      }
    }
    return result
  }

  const shouldServiceToday = (frequency: string, date: string, isOccupied: boolean): boolean => {
    const today = new Date(date)
    const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    switch (frequency) {
      case 'daily_when_occupied':
        return isOccupied // Only service when occupied (Sea Temple logic)
      case 'daily':
        return true
      case 'twice_weekly':
        return dayOfWeek === 1 || dayOfWeek === 4 // Monday and Thursday
      case 'weekly':
        return dayOfWeek === 1 // Monday
      case 'biweekly':
        return dayOfWeek === 1 && Math.floor(today.getDate() / 7) % 2 === 0 // Every other Monday
      case 'monthly':
        return today.getDate() === 1 // First of the month
      default:
        return false
    }
  }

  const shouldCheckToday = (frequency: string, date: string, checkDays?: number[] | string[]): boolean => {
    const today = new Date(date)
    const dayOfWeek = today.getDay()
    
    switch (frequency) {
      case 'daily':
        return true
      case '2x_daily':
        return true
      case '3x_daily':
        return true
      case 'every_other_day':
        return Math.floor(today.getTime() / (1000 * 60 * 60 * 24)) % 2 === 0
      case 'weekly':
        return dayOfWeek === 1
      case 'specific_days': {
        if (!checkDays || !Array.isArray(checkDays) || checkDays.length === 0) return false
        const first = checkDays[0]
        if (typeof first === 'number') {
          return (checkDays as number[]).includes(dayOfWeek)
        }
        const map: Record<string, number> = { sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6 }
        const ints = (checkDays as string[]).map(d => map[d] ?? -1)
        return ints.includes(dayOfWeek)
      }
      default:
        return false
    }
  }

  const getTaskIcon = (task: ScheduledTask) => {
    if (task.type === 'plant_check') {
      return <Settings className="h-5 w-5 text-[#e28743]" />
    }
    if (task.service_type === 'equipment_check' || task.unit_type === 'equipment') {
      return <Settings className="h-5 w-5 text-gray-600" />
    }
    return <Droplets className="h-5 w-5 text-primary" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'skipped':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50'
      case 'low':
        return 'border-gray-200 bg-gray-50'
      default:
        return 'border-gray-200 bg-white'
    }
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading schedule...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Daily Schedule</h1>
            <p className="mt-2 text-gray-600">
              Today's tasks and service schedule
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/templates" className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 bg-white hover:bg-gray-50">Templates</Link>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              aria-label="Filter by property"
            >
              <option value="all">All Properties</option>
              {propertiesState.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={selectedTechnicianId}
              onChange={(e) => setSelectedTechnicianId(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              aria-label="Filter by technician"
            >
              <option value="all">All Technicians</option>
              <option value="unassigned">Unassigned</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Today
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Schedule Summary */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Tasks</dt>
                  <dd className="text-lg font-medium text-gray-900">{tasks.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {tasks.filter(t => t.status === 'completed').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {tasks.filter(t => t.status === 'pending').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Home className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Occupied</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {tasks.filter(t => t.is_occupied).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks
          .filter((t) => selectedPropertyId === 'all' || t.property_id === selectedPropertyId)
          .filter((t) => {
            if (selectedTechnicianId === 'all') return true
            if (selectedTechnicianId === 'unassigned') return !(t as any).assigned_user_id
            return (t as any).assigned_user_id === selectedTechnicianId
          })
          .map((task) => (
          <div key={task.id} className={`bg-white shadow rounded-lg p-6 border-l-4 ${getPriorityColor(task.priority)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {getTaskIcon(task)}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {task.type === 'plant_check' 
                      ? `Plant Room Check - ${task.plant_room_name}`
                      : `${getServiceTypeLabel(task.service_type || '')} - ${task.unit_name}`
                    }
                  </h3>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Home className="h-4 w-4" />
                      <span>{task.property_name}</span>
                    </div>
                    {task.scheduled_time && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{task.scheduled_time}</span>
                      </div>
                    )}
                    {task.is_occupied && (
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>Occupied ({task.booking_source})</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(task.status)}
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {task.type === 'plant_check' ? (
                    <Link
                      href={`/properties/${task.property_id}/plant-rooms/${task.plant_room_id}/check`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90"
                      style={{ backgroundColor: '#e28743' }}
                    >
                      Start Check
                    </Link>
                  ) : task.unit_type === 'equipment' ? (
                    <Link
                      href={`/equipment/${task.equipment_id}/maintain`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-800"
                    >
                      Log Maintenance
                    </Link>
                  ) : (
                    <Link
                      href={`/services/new-guided?unitId=${task.unit_id}&serviceType=${task.service_type}`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600"
                    >
                      Start Service
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks scheduled</h3>
          <p className="mt-1 text-sm text-gray-500">
            No services or checks are scheduled for {new Date(selectedDate).toLocaleDateString()}.
          </p>
        </div>
      )}
    </div>
  )
}
