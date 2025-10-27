import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Helpers (server-side)
function matchesFrequency(
  frequency: string,
  date: string,
  preferredDay?: string,
  explicitDays?: string[],
  isOccupied?: boolean
): boolean {
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
      return false
    default:
      return false
  }
}

function shouldCheckToday(
  frequency: string,
  date: string,
  checkDays?: number[] | string[]
): boolean {
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
      const first = checkDays[0] as any
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

function seededRng(seed: string) {
  let h = 2166136261 >>> 0
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h += 0x6D2B79F5
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickRandomDistinct<T>(arr: T[], count: number, rng: () => number) {
  const n = Math.min(count, arr.length)
  const result: T[] = []
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

export async function GET(req: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const url = new URL(req.url)
    const date = (url.searchParams.get('date') || new Date().toISOString().slice(0,10))
    const propertyId = url.searchParams.get('propertyId') || ''

    const supabase = createAdminClient() as any

    const { data: prof } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', userId)
      .single()

    const companyId = prof?.company_id
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    const [{ data: props }, { data: techs }] = await Promise.all([
      supabase.from('properties' as any).select('id, name').eq('company_id', companyId).order('name'),
      supabase.from('profiles' as any).select('id, first_name, last_name, role').eq('company_id', companyId),
    ])

    const properties = (props || []) as Array<{ id: string; name: string }>
    const targetProperties = properties.filter(p => !propertyId || propertyId === 'all' || p.id === propertyId)

    const technicians = (techs || [])
      .filter((t: any) => ['technician', 'tech', 'staff'].includes((t.role || '').toLowerCase()))
      .map((t: any) => ({ id: t.id, name: `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Technician' }))

    type Task = {
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

    const tasks: Task[] = []

    for (const prop of targetProperties) {
      // Load units
      const { data: units } = await supabase
        .from('units' as any)
        .select('id, name, unit_type, service_frequency, water_type')
        .eq('property_id', prop.id)
        .eq('is_active', true)

      // Active property rules
      const { data: propertyRules } = await supabase
        .from('property_scheduling_rules' as any)
        .select('id, rule_name, rule_type, rule_config, target_units, target_water_types, target_unit_types, priority, is_active')
        .eq('property_id', prop.id)
        .eq('is_active', true)

      // Occupancy: active bookings and arrivals today
      const { data: activeBookings } = await supabase
        .from('bookings' as any)
        .select('id, unit_id, check_in_date, check_out_date, units!inner(property_id)')
        .eq('units.property_id', prop.id)
        .lte('check_in_date', date)
        .gte('check_out_date', date)

      const { data: arrivals } = await supabase
        .from('bookings' as any)
        .select('id, unit_id, check_in_date, units!inner(property_id)')
        .eq('units.property_id', prop.id)
        .eq('check_in_date', date)

      const occupiedSet = new Set((activeBookings || []).map((b: any) => b.unit_id))
      const arrivalSet = new Set((arrivals || []).map((b: any) => b.unit_id))

      // Custom schedules for units
      const customUnitIds = (units || []).filter((u: any) => u.service_frequency === 'custom').map((u: any) => u.id)
      const { data: customSchedules } = customUnitIds.length
        ? await supabase
            .from('custom_schedules' as any)
            .select('unit_id, schedule_type, schedule_config, service_types, name')
            .in('unit_id', customUnitIds)
        : { data: [] as any[] }
      const customByUnit = new Map<string, any>((customSchedules || []).map((c: any) => [c.unit_id, c]))

      const propertyHasActiveRules = !!(propertyRules && propertyRules.length)
      const sharedFacilityTypes = new Set(['main_pool', 'kids_pool', 'main_spa'])

      for (const unit of units || []) {
        const isOccupied = occupiedSet.has(unit.id)
        const arrivalToday = arrivalSet.has(unit.id)

        // Skip unit schedule when property rules active for shared facilities
        if (propertyHasActiveRules && sharedFacilityTypes.has(String(unit.unit_type || ''))) {
          // still allow arrival task via custom occupancy if present
          const cs = customByUnit.get(unit.id)
          const scheduleCfg = (cs?.schedule_config || {}) as any
          const occ = scheduleCfg?.occupancy_rules
          if (arrivalToday && occ?.on_arrival) {
            const allowed = (cs?.service_types?.daily) || ['full_service']
            tasks.push({
              id: `arrival-${unit.id}-${date}`,
              type: 'service',
              unit_id: unit.id,
              property_id: prop.id,
              property_name: prop.name,
              unit_name: unit.name,
              unit_type: unit.unit_type,
              service_type: allowed[0] || 'full_service',
              scheduled_time: scheduleCfg.time_preference || '09:00',
              status: 'pending',
              priority: 'high',
              is_occupied: isOccupied,
            })
          }
          continue
        }

        // Custom schedule handling
        if (unit.service_frequency === 'custom') {
          const cs = customByUnit.get(unit.id)
          if (cs) {
            const cfg = cs.schedule_config || {}
            const scheduleType = cs.schedule_type as 'simple' | 'complex'
            if (scheduleType === 'simple') {
              const frequency = cfg.frequency as string
              const time = cfg.time_preference || '09:00'
              const dayPref = cfg.day_preference as string | undefined
              const specificDays = cfg.specific_days as string[] | undefined
              if (matchesFrequency(frequency, date, dayPref, specificDays, isOccupied)) {
                const serviceType = (cs.service_types?.[frequency]?.[0]) || 'full_service'
                tasks.push({
                  id: `custom-${unit.id}-${date}-${time}`,
                  type: 'service',
                  unit_id: unit.id,
                  property_id: prop.id,
                  property_name: prop.name,
                  unit_name: unit.name,
                  unit_type: unit.unit_type,
                  service_type: serviceType,
                  scheduled_time: time,
                  status: 'pending',
                  priority: isOccupied ? 'high' : 'medium',
                  is_occupied: isOccupied,
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
                    property_id: prop.id,
                    property_name: prop.name,
                    unit_name: unit.name,
                    unit_type: unit.unit_type,
                    service_type: serviceType,
                    scheduled_time: time,
                    status: 'pending',
                    priority: isOccupied ? 'high' : 'medium',
                    is_occupied: isOccupied,
                  })
                }
              }
            }

            // Occupancy arrival task
            const scheduleCfg = (cs?.schedule_config || {}) as any
            const occ = scheduleCfg.occupancy_rules
            if (occ?.on_arrival && arrivalToday) {
              tasks.push({
                id: `arrival-${unit.id}-${date}`,
                type: 'service',
                unit_id: unit.id,
                property_id: prop.id,
                property_name: prop.name,
                unit_name: unit.name,
                unit_type: unit.unit_type,
                service_type: (cs.service_types?.daily?.[0]) || 'full_service',
                scheduled_time: scheduleCfg.time_preference || '09:00',
                status: 'pending',
                priority: 'high',
                is_occupied: isOccupied,
              })
            }
            continue
          }
        }

        // Fallback default frequency
        const defaultFreq = String(unit.service_frequency || '')
        if (defaultFreq && matchesFrequency(defaultFreq, date, undefined, undefined, isOccupied)) {
          tasks.push({
            id: `service-${unit.id}-${date}`,
            type: 'service',
            unit_id: unit.id,
            property_id: prop.id,
            property_name: prop.name,
            unit_name: unit.name,
            unit_type: unit.unit_type,
            service_type: 'full_service',
            scheduled_time: '09:00',
            status: 'pending',
            priority: isOccupied ? 'high' : 'medium',
            is_occupied: isOccupied,
          })
        }
      }

      // Property-level rules
      if (propertyRules && propertyRules.length && units && units.length) {
        for (const rule of propertyRules) {
          if (rule.rule_type === 'random_selection') {
            const cfg = rule.rule_config || {}
            const frequency = cfg.frequency as string
            if (!matchesFrequency(frequency, date)) continue

            const selectionCount = Math.max(1, Math.min(50, Number(cfg.selection_count) || 1))
            const time = cfg.time_preference || '09:00'
            const allowedServiceTypes = (cfg.service_types?.[frequency]) || ['test_only']
            const serviceType = allowedServiceTypes[0] || 'test_only'

            let candidateUnits = [...(units as any[])]
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
                const targetIds: string[] = Array.isArray(tu) ? tu : ((tu && (tu as any).ids) as string[]) || []
                if (targetIds.length) {
                  candidateUnits = candidateUnits.filter((u) => targetIds.includes(u.id))
                }
              } catch {}
            }
            if (candidateUnits.length === 0) continue

            const rng = seededRng(`${prop.id}-${date}`)
            const chosen = pickRandomDistinct(candidateUnits, selectionCount, rng)
            for (const u of chosen) {
              tasks.push({
                id: `rule-${rule.id}-${u.id}-${date}-${time}`,
                type: 'service',
                unit_id: u.id,
                property_id: prop.id,
                property_name: prop.name,
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
      }

      // Plant room checks
      const { data: plantRooms } = await supabase
        .from('plant_rooms' as any)
        .select('id, name, check_frequency, check_times, check_days')
        .eq('property_id', prop.id)
        .eq('is_active', true)

      for (const pr of plantRooms || []) {
        const days = Array.isArray(pr.check_days) ? pr.check_days : undefined
        if (shouldCheckToday(String(pr.check_frequency || ''), date, days)) {
          const times: string[] = pr.check_times || ['09:00', '15:00']
          for (const time of times) {
            tasks.push({
              id: `plant-${pr.id}-${date}-${time}`,
              type: 'plant_check',
              plant_room_id: pr.id,
              property_id: prop.id,
              property_name: prop.name,
              plant_room_name: pr.name,
              scheduled_time: time,
              status: 'pending',
              priority: 'high',
            })
          }
        }
      }

      // Equipment maintenance tasks
      const { data: equipment } = await supabase
        .from('equipment' as any)
        .select('id, name, unit_id, maintenance_frequency, maintenance_times, measurement_config, maintenance_scheduled')
        .eq('property_id', prop.id)
        .eq('is_active', true)
      for (const eq of equipment || []) {
        if (!eq.measurement_config || !eq.maintenance_scheduled || !eq.maintenance_frequency) continue
        if (!shouldCheckToday(String(eq.maintenance_frequency || ''), date)) continue
        const times: string[] = eq.maintenance_times || ['11:00']
        for (const time of times) {
          tasks.push({
            id: `equip-${eq.id}-${date}-${time}`,
            type: 'service',
            unit_id: eq.unit_id || undefined,
            equipment_id: eq.id,
            property_id: prop.id,
            property_name: prop.name,
            unit_name: eq.name,
            unit_type: 'equipment',
            service_type: 'equipment_check',
            scheduled_time: time,
            status: 'pending',
            priority: 'medium',
          })
        }
      }
    }

    // De-duplicate and sort tasks
    const deduped = new Map<string, Task>()
    for (const t of tasks) {
      const key = t.type === 'plant_check'
        ? `plant:${t.plant_room_id}:${t.scheduled_time}:${date}`
        : `svc:${t.unit_id}:${t.service_type}:${t.scheduled_time}:${date}`
      const existing = deduped.get(key)
      if (!existing) deduped.set(key, t)
      else {
        const order = { high: 3, medium: 2, low: 1 } as const
        deduped.set(key, (order[t.priority] >= order[existing.priority]) ? t : existing)
      }
    }
    const sorted = Array.from(deduped.values())
    sorted.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 0, medium: 1, low: 2 } as any
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      return (a.scheduled_time || '').localeCompare(b.scheduled_time || '')
    })

    return NextResponse.json({ properties, technicians, tasks: sorted })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
