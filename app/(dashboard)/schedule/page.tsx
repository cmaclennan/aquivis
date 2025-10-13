'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  
  const supabase = createClient()

  useEffect(() => {
    // Load persisted property filter
    const stored = typeof window !== 'undefined' ? localStorage.getItem('schedule.selectedProperty') : null
    if (stored) setSelectedPropertyId(stored)
  }, [])

  useEffect(() => {
    loadSchedule()
  }, [selectedDate, selectedPropertyId])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('schedule.selectedProperty', selectedPropertyId)
    }
  }, [selectedPropertyId])

  const loadSchedule = async () => {
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

      // Get all properties for the company
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id, name')
        .eq('company_id', profile.company_id)

      if (propertiesError) throw propertiesError

      const scheduledTasks: ScheduledTask[] = []
      setPropertiesState(properties || [])

      // Load technicians (profiles) for filter
      const { data: techs } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, company_id')
        .eq('company_id', profile.company_id)
      setTechnicians(
        (techs || [])
          .filter((p: any) => ['technician', 'tech', 'staff'].includes((p.role || '').toLowerCase()))
          .map((p: any) => ({ id: p.id, name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Technician' }))
      )

      // Get regular service schedules
      for (const property of (properties || []).filter(p => selectedPropertyId === 'all' || p.id === selectedPropertyId)) {
        // Fetch active property-level scheduling rules (if any)
        const { data: propertyRules } = await supabase
          .from('property_scheduling_rules')
          .select('id, rule_name, rule_type, rule_config, target_units, target_water_types, target_unit_types, priority, is_active')
          .eq('property_id', property.id)
          .eq('is_active', true)

        // Get units with regular service schedules
        const { data: units, error: unitsError } = await supabase
          .from('units')
          .select('id, name, unit_type, service_frequency, water_type')
          .eq('property_id', property.id)
          .eq('is_active', true)

        if (unitsError) throw unitsError

        const propertyHasActiveRules = !!(propertyRules && propertyRules.length)
        const sharedFacilityTypes = new Set(['main_pool', 'kids_pool', 'main_spa'])

        for (const unit of units || []) {
          // If property-level rules are active, skip unit-level schedules for shared facilities
          if (propertyHasActiveRules && sharedFacilityTypes.has((unit.unit_type || '').toString())) {
            continue
          }
          // Check if unit is occupied (has active booking)
          const { data: activeBooking } = await supabase
            .from('bookings')
            .select('check_in_date, check_out_date')
            .eq('unit_id', unit.id)
            .lte('check_in_date', selectedDate)
            .gte('check_out_date', selectedDate)
            .maybeSingle()

          // Check if today is an arrival for this unit
          const { data: arrivalToday } = await supabase
            .from('bookings')
            .select('id')
            .eq('unit_id', unit.id)
            .eq('check_in_date', selectedDate)
            .limit(1)

          // If unit uses custom schedule, evaluate that first
          if (unit.service_frequency === 'custom') {
            const { data: customSchedule } = await supabase
              .from('custom_schedules')
              .select('schedule_type, schedule_config, service_types, name')
              .eq('unit_id', unit.id)
              .eq('is_active', true)
              .maybeSingle()

            if (customSchedule) {
              const customTasks = generateTasksFromCustomSchedule(
                customSchedule,
                unit,
                property,
                selectedDate,
                !!activeBooking
              )

              for (const t of customTasks) {
                scheduledTasks.push({
                  ...t,
                  status: 'pending',
                  priority: activeBooking ? 'high' : 'medium',
                  is_occupied: !!activeBooking,
                  booking_source: undefined,
                })
              }

              // Occupancy rules
              const occ = customSchedule.schedule_config?.occupancy_rules
              if (occ) {
                // Arrival task
                if (occ.on_arrival && arrivalToday && arrivalToday.length) {
                  scheduledTasks.push({
                    id: `arrival-${unit.id}-${selectedDate}`,
                    type: 'service',
                    unit_id: unit.id,
                    property_id: property.id,
                    property_name: property.name,
                    unit_name: unit.name,
                    unit_type: unit.unit_type,
                    service_type: (customSchedule.service_types?.daily?.[0]) || 'full_service',
                    scheduled_time: customSchedule.schedule_config?.time_preference || '09:00',
                    status: 'pending',
                    priority: 'high',
                    is_occupied: !!activeBooking,
                    booking_source: undefined,
                  })
                }
                // Weekly minimum
                if (occ.weekly_minimum) {
                  const weekStart = getWeekStart(selectedDate)
                  const weekEnd = getWeekEnd(selectedDate)
                  const already = await unitHasServiceBetween(unit.id, weekStart, weekEnd)
                  if (!already && isDay(selectedDate, occ.weekly_day)) {
                    scheduledTasks.push({
                      id: `weeklymin-${unit.id}-${selectedDate}`,
                      type: 'service',
                      unit_id: unit.id,
                      property_id: property.id,
                      property_name: property.name,
                      unit_name: unit.name,
                      unit_type: unit.unit_type,
                      service_type: 'full_service',
                      scheduled_time: '10:00',
                      status: 'pending',
                      priority: activeBooking ? 'high' : 'medium',
                      is_occupied: !!activeBooking,
                      booking_source: undefined,
                    })
                  }
                }
                // Bi-weekly minimum
                if (occ.biweekly_minimum) {
                  const period = getBiWeeklyPeriod(selectedDate)
                  const already = await unitHasServiceBetween(unit.id, period.start, period.end)
                  if (!already && isDay(selectedDate, occ.biweekly_day)) {
                    scheduledTasks.push({
                      id: `biweeklymin-${unit.id}-${selectedDate}`,
                      type: 'service',
                      unit_id: unit.id,
                      property_id: property.id,
                      property_name: property.name,
                      unit_name: unit.name,
                      unit_type: unit.unit_type,
                      service_type: 'full_service',
                      scheduled_time: '10:00',
                      status: 'pending',
                      priority: activeBooking ? 'high' : 'medium',
                      is_occupied: !!activeBooking,
                      booking_source: undefined,
                    })
                  }
                }
              }
              continue // Skip default frequency handling for this unit
            }
          }

          // Fallback to basic frequency handling
          const needsService = shouldServiceToday(unit.service_frequency as string, selectedDate, !!activeBooking)
          if (needsService) {
            scheduledTasks.push({
              id: `service-${unit.id}-${selectedDate}`,
              type: 'service',
              unit_id: unit.id,
              property_id: property.id,
              property_name: property.name,
              unit_name: unit.name,
              unit_type: unit.unit_type,
              service_type: 'full_service',
              scheduled_time: '09:00',
              status: 'pending',
              priority: activeBooking ? 'high' : 'medium',
              is_occupied: !!activeBooking,
              booking_source: undefined,
            })
          }
        }

        // Apply property-level rules (e.g., random selection)
        if (propertyRules && propertyRules.length && units && units.length) {
          const ruleTasks = generateTasksFromPropertyRules(
            propertyRules,
            units,
            property,
            selectedDate
          )
          for (const t of ruleTasks) {
            scheduledTasks.push({ ...t, status: 'pending', priority: 'high' })
          }
        }

        // Get plant rooms that need checks
        const { data: plantRooms, error: plantRoomsError } = await supabase
          .from('plant_rooms')
          .select('id, name, check_frequency, check_times, check_days')
          .eq('property_id', property.id)
          .eq('is_active', true)

        if (plantRoomsError) throw plantRoomsError

        for (const plantRoom of plantRooms || []) {
          // Check if this plant room needs checking today
          const days = Array.isArray(plantRoom.check_days) ? plantRoom.check_days : undefined
          const needsCheck = shouldCheckToday(plantRoom.check_frequency, selectedDate, days)
          
          if (needsCheck) {
            const checkTimes = plantRoom.check_times || ['09:00', '15:00']
            
            for (const time of checkTimes) {
              scheduledTasks.push({
                id: `plant-${plantRoom.id}-${selectedDate}-${time}`,
                type: 'plant_check',
                plant_room_id: plantRoom.id,
                property_id: property.id,
                property_name: property.name,
                plant_room_name: plantRoom.name,
                scheduled_time: time,
                status: 'pending',
                priority: 'high'
              })
            }
          }
        }

        // Equipment maintenance tasks
        const equipTasks = await generateEquipmentTasks(property.id, property.name, selectedDate)
        for (const t of equipTasks) {
          scheduledTasks.push(t)
        }
      }

      // De-duplicate tasks (prefer higher priority), then sort by priority and time
      const dedupedMap = new Map<string, ScheduledTask>()
      for (const t of scheduledTasks) {
        const key = t.type === 'plant_check'
          ? `plant:${t.plant_room_id}:${t.scheduled_time}:${selectedDate}`
          : `svc:${t.unit_id}:${t.service_type}:${t.scheduled_time}:${selectedDate}`
        const existing = dedupedMap.get(key)
        if (!existing) {
          dedupedMap.set(key, t)
        } else {
          const order = { high: 3, medium: 2, low: 1 } as const
          dedupedMap.set(key, (order[t.priority] >= order[existing.priority]) ? t : existing)
        }
      }
      const dedupedTasks = Array.from(dedupedMap.values())

      dedupedTasks.sort((a, b) => {
        if (a.priority !== b.priority) {
          const priorityOrder = { high: 0, medium: 1, low: 2 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }
        return (a.scheduled_time || '').localeCompare(b.scheduled_time || '')
      })

      setTasks(dedupedTasks)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Generate tasks from a unit's custom schedule
  const generateTasksFromCustomSchedule = (
    customSchedule: any,
    unit: any,
    property: any,
    date: string,
    isOccupied: boolean
  ): ScheduledTask[] => {
    const tasks: ScheduledTask[] = []
    const scheduleType = customSchedule.schedule_type as 'simple' | 'complex' | 'random_selection'
    const cfg = customSchedule.schedule_config || {}

    if (scheduleType === 'simple') {
      const frequency = cfg.frequency as string
      const time = cfg.time_preference || '09:00'
      const dayPref = cfg.day_preference as string | undefined
      const specificDays = cfg.specific_days as string[] | undefined
      if (matchesFrequency(frequency, date, dayPref, specificDays, isOccupied)) {
        const serviceType = (customSchedule.service_types?.[frequency]?.[0]) || 'full_service'
        tasks.push({
          id: `custom-${unit.id}-${date}-${time}`,
          type: 'service',
          unit_id: unit.id,
          property_id: property.id,
          property_name: property.name,
          unit_name: unit.name,
          unit_type: unit.unit_type,
          service_type: serviceType,
          scheduled_time: time,
          status: 'pending',
          priority: 'medium',
        })
      }
    } else if (scheduleType === 'complex') {
      const entries = (cfg.schedules || []) as Array<any>
      for (const entry of entries) {
        const frequency = entry.frequency as string
        const time = entry.time || '09:00'
        const days: string[] | undefined = entry.days
        if (matchesFrequency(frequency, date, undefined, days, isOccupied)) {
          const serviceType = (entry.service_types?.[0]) || 'full_service'
          tasks.push({
            id: `custom-${unit.id}-${date}-${time}-${serviceType}`,
            type: 'service',
            unit_id: unit.id,
            property_id: property.id,
            property_name: property.name,
            unit_name: unit.name,
            unit_type: unit.unit_type,
            service_type: serviceType,
            scheduled_time: time,
            status: 'pending',
            priority: 'medium',
          })
        }
      }
    }

    // random_selection is handled via property rules, not per-unit
    return tasks
  }

  // Generate tasks based on property-level rules
  const generateTasksFromPropertyRules = (
    rules: any[],
    units: any[],
    property: any,
    date: string
  ): ScheduledTask[] => {
    const tasks: ScheduledTask[] = []
    for (const rule of rules) {
        if (rule.rule_type === 'random_selection') {
        const cfg = rule.rule_config || {}
        const frequency = cfg.frequency as string
        if (!matchesFrequency(frequency, date)) continue

        const selectionCount = Math.max(1, Math.min(50, Number(cfg.selection_count) || 1))
        const time = cfg.time_preference || '09:00'
        const allowedServiceTypes = (cfg.service_types?.[frequency]) || ['test_only']
        const serviceType = allowedServiceTypes[0] || 'test_only'

        // Filter units by targets (support top-level or nested in rule_config)
        let candidateUnits = [...units]
        const targetUnitTypes: string[] = (rule.target_unit_types && rule.target_unit_types.length)
          ? rule.target_unit_types
          : (cfg.target_unit_types || [])
        const targetWaterTypes: string[] = (rule.target_water_types && rule.target_water_types.length)
          ? rule.target_water_types
          : (cfg.target_water_types || [])
        if (targetUnitTypes.length) {
          candidateUnits = candidateUnits.filter((u) => targetUnitTypes.includes(u.unit_type))
        }
        if (targetWaterTypes.length) {
          candidateUnits = candidateUnits.filter((u) => targetWaterTypes.includes(u.water_type))
        }
        if (rule.target_units || cfg.target_units) {
          try {
            const tu = (rule.target_units ?? cfg.target_units)
            const targetIds: string[] = Array.isArray(tu)
              ? tu
              : ((tu && tu.ids) as string[]) || []
            if (targetIds.length) {
              candidateUnits = candidateUnits.filter((u) => targetIds.includes(u.id))
            }
          } catch {}
        }

        if (candidateUnits.length === 0) continue

        // Deterministic selection for a given date
        const rng = seededRng(`${property.id}-${date}`)
        const chosen = pickRandomDistinct(candidateUnits, selectionCount, rng)

        for (const u of chosen) {
          tasks.push({
            id: `rule-${rule.id}-${u.id}-${date}-${time}`,
            type: 'service',
            unit_id: u.id,
            property_id: property.id,
            property_name: property.name,
            unit_name: u.name,
            unit_type: u.unit_type,
            service_type: serviceType,
            scheduled_time: time,
            status: 'pending',
            priority: 'high',
          })
        }
      }
    }
    return tasks
  }

  // Equipment maintenance tasks
  const generateEquipmentTasks = async (
    propertyId: string,
    propertyName: string,
    date: string
  ): Promise<ScheduledTask[]> => {
    const tasks: ScheduledTask[] = []
    const { data: equipment } = await supabase
      .from('equipment')
      .select('id, name, unit_id, plant_room_id, maintenance_frequency, maintenance_times, measurement_config, maintenance_scheduled')
      .eq('property_id', propertyId)
      .eq('is_active', true)
    for (const eq of equipment || []) {
      if (!eq.measurement_config) continue
      // Only generate tasks if explicitly flagged for scheduling and frequency set
      if (!eq.maintenance_scheduled || !eq.maintenance_frequency) continue
      if (!shouldCheckToday(eq.maintenance_frequency, date)) continue
      const times: string[] = eq.maintenance_times || ['11:00']
      for (const time of times) {
        tasks.push({
          id: `equip-${eq.id}-${date}-${time}`,
          type: 'service',
          unit_id: eq.unit_id || undefined,
          equipment_id: eq.id,
          property_id: propertyId,
          property_name: propertyName,
          unit_name: eq.name,
          unit_type: 'equipment',
          service_type: 'equipment_check',
          scheduled_time: time,
          status: 'pending',
          priority: 'medium',
        })
      }
    }
    return tasks
  }

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
    const { data } = await supabase
      .from('services')
      .select('id')
      .eq('unit_id', unitId)
      .gte('service_date', start)
      .lte('service_date', end)
      .limit(1)
    return !!(data && data.length)
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
