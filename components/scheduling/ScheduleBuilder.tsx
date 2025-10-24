'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Calendar, Clock, Settings, Shuffle, Plus, Trash2, Save, Home } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Types for schedule configuration
interface SimpleScheduleConfig {
  frequency: 'daily' | 'daily_when_occupied' | 'twice_weekly' | 'weekly' | 'biweekly' | 'monthly' | 'specific_days'
  service_type: string
  time_preference?: string
  day_preference?: string
  specific_days?: string[]
}

interface ComplexScheduleConfig {
  schedules: Array<{
    frequency: 'daily' | 'daily_when_occupied' | 'twice_weekly' | 'weekly' | 'biweekly' | 'monthly'
    days?: string[]
    service_types: string[]
    time: string
    name?: string
  }>
}

interface RandomSelectionConfig {
  frequency: 'daily' | 'twice_weekly' | 'weekly' | 'biweekly' | 'monthly'
  selection_count: number
  service_type: string
  time_preference?: string
  limit_to_shared_facilities?: boolean
  unit_type_filter?: string
  water_type_filter?: string
}

type ScheduleType = 'simple' | 'complex' | 'random_selection' | 'occupancy'

interface ScheduleBuilderProps {
  unitId?: string
  propertyId?: string
  context?: 'unit' | 'shared' | 'property'
  unitType?: string
  hasBookings?: boolean
  onSave: (schedule: any) => void
  onCancel: () => void
  initialSchedule?: any
}

export default function ScheduleBuilder({ 
  unitId, 
  propertyId, 
  context = 'shared',
  unitType,
  hasBookings = false,
  onSave, 
  onCancel, 
  initialSchedule 
}: ScheduleBuilderProps) {
  const normalizedContext = (context || 'shared').toString().trim()
  const sharedFacilityTypes = new Set(['main_pool', 'kids_pool', 'main_spa'])
  const occupancyEligible = normalizedContext === 'unit' && !sharedFacilityTypes.has((unitType || '').toString())
  const [scheduleType, setScheduleType] = useState<ScheduleType>('simple')
  const [scheduleName, setScheduleName] = useState('')
  const [scheduleDescription, setScheduleDescription] = useState('')
  const { data: session } = useSession()
  const supabase = useMemo(() => createClient(), [])
  const [companyId, setCompanyId] = useState<string>('')
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [templateName, setTemplateName] = useState<string>('')
  
  // Simple schedule state
  const [simpleConfig, setSimpleConfig] = useState<SimpleScheduleConfig>({
    frequency: 'weekly',
    service_type: 'full_service',
    time_preference: '09:00'
  })
  
  // Complex schedule state
  const [complexConfig, setComplexConfig] = useState<ComplexScheduleConfig>({
    schedules: [
      {
        frequency: 'daily',
        service_types: ['test_only'],
        time: '08:00',
        name: 'Daily Testing'
      }
    ]
  })
  
  // Random selection state
  const [randomConfig, setRandomConfig] = useState<RandomSelectionConfig>({
    frequency: 'daily',
    selection_count: 2,
    service_type: 'test_only',
    time_preference: '09:00',
    limit_to_shared_facilities: normalizedContext !== 'unit',
    unit_type_filter: '',
    water_type_filter: ''
  })

  // Occupancy rules (units with bookings)
  const [occupancyOnArrival, setOccupancyOnArrival] = useState(false)
  const [occupancyWeeklyMin, setOccupancyWeeklyMin] = useState(false)
  const [occupancyWeeklyDay, setOccupancyWeeklyDay] = useState('monday')
  const [occupancyBiweeklyMin, setOccupancyBiweeklyMin] = useState(false)
  const [occupancyBiweeklyDay, setOccupancyBiweeklyDay] = useState('monday')

  // Sanitize schedule type when context does not support occupancy
  useEffect(() => {
    if ((!occupancyEligible) && scheduleType === 'occupancy') {
      setScheduleType('random_selection')
    }
  }, [occupancyEligible, scheduleType])

  // Service type options
  const serviceTypeOptions = [
    { value: 'test_only', label: 'Test Only' },
    { value: 'full_service', label: 'Full Service (Test + Chemicals + Cleaning)' },
    { value: 'equipment_check', label: 'Equipment Check' },
    { value: 'plant_room_check', label: 'Plant Room Check' }
  ]

  // Frequency options
  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'daily_when_occupied', label: 'Daily (When Occupied)' },
    { value: 'twice_weekly', label: 'Twice Weekly' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'specific_days', label: 'Specific Days' }
  ]

  // Day options
  const dayOptions = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ]

  // Initialize with existing schedule if provided
  useEffect(() => {
    if (initialSchedule) {
      const type = initialSchedule.schedule_type || 'simple'
      const cfg = initialSchedule.schedule_config || {}

      setScheduleName(initialSchedule.name || '')
      setScheduleDescription(initialSchedule.description || '')

      // If schedule has occupancy rules saved under 'complex', map back to Occupancy for UI when eligible
      if (cfg.occupancy_rules && occupancyEligible) {
        setScheduleType('occupancy')
        const occ = cfg.occupancy_rules || {}
        setOccupancyOnArrival(!!occ.on_arrival)
        setOccupancyWeeklyMin(!!occ.weekly_minimum)
        setOccupancyWeeklyDay(occ.weekly_day || 'monday')
        setOccupancyBiweeklyMin(!!occ.biweekly_minimum)
        setOccupancyBiweeklyDay(occ.biweekly_day || 'monday')
        return
      }

      setScheduleType(type)
      if (type === 'simple') {
        setSimpleConfig(cfg)
      } else if (type === 'complex') {
        const schedules = Array.isArray(cfg.schedules) ? cfg.schedules : []
        setComplexConfig({ schedules })
      } else if (type === 'random_selection') {
        setRandomConfig(cfg)
      }
    }
  }, [initialSchedule, occupancyEligible])

  // Load company id and templates
  useEffect(() => {
    if (!session?.user?.company_id) return

    (async () => {
      try {
        setCompanyId(session.user.company_id)
        const { data: tpl } = await supabase
          .from('schedule_templates')
          .select('id, template_name, template_type, template_config')
          .eq('company_id', session.user.company_id)
          .eq('is_active', true)
          .order('template_name')
        setTemplates(tpl || [])
      } catch {}
    })()
  }, [supabase, session])

  // Handle simple schedule changes
  const updateSimpleConfig = (field: keyof SimpleScheduleConfig, value: any) => {
    setSimpleConfig(prev => ({ ...prev, [field]: value }))
  }

  // Handle complex schedule changes
  const addComplexSchedule = () => {
    setComplexConfig(prev => ({
      ...prev,
      schedules: [
        ...prev.schedules,
        {
          frequency: 'weekly',
          service_types: ['full_service'],
          time: '10:00',
          name: `Schedule ${prev.schedules.length + 1}`
        }
      ]
    }))
  }

  const updateComplexSchedule = (index: number, field: string, value: any) => {
    setComplexConfig(prev => ({
      ...prev,
      schedules: prev.schedules.map((schedule, i) => 
        i === index ? { ...schedule, [field]: value } : schedule
      )
    }))
  }

  const removeComplexSchedule = (index: number) => {
    setComplexConfig(prev => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index)
    }))
  }

  // Handle random selection changes
  const updateRandomConfig = (field: keyof RandomSelectionConfig, value: any) => {
    setRandomConfig(prev => ({ ...prev, [field]: value }))
  }

  // Handle save
  const handleSave = () => {
    let scheduleConfig: any = {}
    let serviceTypes: any = {}

    switch (scheduleType) {
      case 'simple': {
        scheduleConfig = simpleConfig
        serviceTypes = { [simpleConfig.frequency]: [simpleConfig.service_type] }
        break
      }
      case 'complex': {
        scheduleConfig = complexConfig
        complexConfig.schedules.forEach(schedule => {
          serviceTypes[schedule.frequency] = schedule.service_types
        })
        break
      }
      case 'random_selection': {
        scheduleConfig = randomConfig
        serviceTypes = { [randomConfig.frequency]: [randomConfig.service_type] }
        break
      }
      case 'occupancy': {
        scheduleConfig = {
          occupancy_rules: {
            on_arrival: occupancyOnArrival,
            weekly_minimum: occupancyWeeklyMin,
            weekly_day: occupancyWeeklyDay,
            biweekly_minimum: occupancyBiweeklyMin,
            biweekly_day: occupancyBiweeklyDay,
          },
        }
        serviceTypes = {}
        break
      }
    }

    const finalScheduleType = scheduleType === 'occupancy' ? 'complex' : scheduleType

    const schedule = {
      schedule_type: finalScheduleType,
      schedule_config: scheduleConfig,
      service_types: serviceTypes,
      name: scheduleName,
      description: scheduleDescription
    }

    onSave(schedule)
  }

  const applyTemplate = (templateId: string) => {
    const tpl = templates.find(t => t.id === templateId)
    if (!tpl) return
    setSelectedTemplateId(templateId)
    // Apply template config into builder state
    // Map unsupported types based on context
    const tplType = (tpl.template_type as ScheduleType)
    const mappedType = occupancyEligible ? tplType : (tplType === 'occupancy' ? 'random_selection' : tplType)
    setScheduleType(mappedType)
    setScheduleName(tpl.template_name || '')
    if (tpl.template_type === 'simple') {
      setSimpleConfig({
        frequency: tpl.template_config?.frequency || 'weekly',
        service_type: (Object.values(tpl.template_config?.service_types || {}) as any[])[0]?.[0] || 'full_service',
        time_preference: tpl.template_config?.time_preference || '09:00',
        day_preference: tpl.template_config?.day_preference,
      })
    } else if (tpl.template_type === 'complex') {
      setComplexConfig({ schedules: tpl.template_config?.schedules || [] })
    } else if (tpl.template_type === 'random_selection') {
      setRandomConfig({
        frequency: tpl.template_config?.frequency || 'daily',
        selection_count: tpl.template_config?.selection_count || 2,
        service_type: (Object.values(tpl.template_config?.service_types || {}) as any[])[0]?.[0] || 'test_only',
        time_preference: tpl.template_config?.time_preference || '09:00',
        limit_to_shared_facilities: tpl.template_config?.limit_to_shared_facilities ?? (normalizedContext !== 'unit'),
        unit_type_filter: tpl.template_config?.unit_type_filter || '',
        water_type_filter: tpl.template_config?.water_type_filter || '',
      })
    } else if (tpl.template_type === 'occupancy') {
      const occ = tpl.template_config?.occupancy_rules || {}
      setOccupancyOnArrival(!!occ.on_arrival)
      setOccupancyWeeklyMin(!!occ.weekly_minimum)
      setOccupancyWeeklyDay(occ.weekly_day || 'monday')
      setOccupancyBiweeklyMin(!!occ.biweekly_minimum)
      setOccupancyBiweeklyDay(occ.biweekly_day || 'monday')
    }
  }

  const saveAsTemplate = async () => {
    if (!companyId) return
    const name = templateName.trim()
    if (!name) return
    // Reuse current handleSave logic to assemble config/types without calling onSave
    let scheduleConfig: any
    let serviceTypes: any
    switch (scheduleType) {
      case 'simple':
        scheduleConfig = simpleConfig
        serviceTypes = { [simpleConfig.frequency]: [simpleConfig.service_type] }
        break
      case 'complex':
        scheduleConfig = complexConfig
        serviceTypes = {}
        complexConfig.schedules.forEach(s => (serviceTypes[s.frequency] = s.service_types))
        break
      case 'random_selection':
        scheduleConfig = randomConfig
        serviceTypes = { [randomConfig.frequency]: [randomConfig.service_type] }
        break
      case 'occupancy':
        scheduleConfig = {
          occupancy_rules: {
            on_arrival: occupancyOnArrival,
            weekly_minimum: occupancyWeeklyMin,
            weekly_day: occupancyWeeklyDay,
            biweekly_minimum: occupancyBiweeklyMin,
            biweekly_day: occupancyBiweeklyDay,
          },
        }
        serviceTypes = {}
        break
    }
    const { error } = await supabase.from('schedule_templates').insert({
      company_id: companyId,
      template_name: name,
      // Persist only supported types; map occupancy to complex with occupancy_rules in config
      template_type: scheduleType === 'occupancy' ? 'complex' : scheduleType,
      template_config: scheduleConfig,
      applicable_unit_types: null,
      applicable_property_types: null,
      applicable_water_types: null,
      is_public: false,
      is_active: true,
    })
    if (!error) {
      // Reload templates
      const { data: tpl } = await supabase
        .from('schedule_templates')
        .select('id, template_name, template_type, template_config')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('template_name')
      setTemplates(tpl || [])
      setTemplateName('')
    } else {
      alert('Failed to save template')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule Builder</h2>
        <p className="text-gray-600">Create a custom schedule for your pool service requirements</p>
      </div>

      {/* Schedule Name and Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Schedule Name
          </label>
          <input
            type="text"
            value={scheduleName}
            onChange={(e) => setScheduleName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., Sheraton Freshwater Daily Test"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <input
            type="text"
            value={scheduleDescription}
            onChange={(e) => setScheduleDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Optional description"
          />
        </div>
      </div>

      {/* Schedule Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Schedule Type
        </label>
        {/* Template selector */}
        <div className="mb-3 flex items-center gap-3 flex-wrap">
          <select
            value={selectedTemplateId}
            onChange={(e) => applyTemplate(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm min-w-[260px]"
          >
            <option value="">Use template…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.template_name}</option>
            ))}
          </select>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Template name"
            className="px-3 py-2 border rounded-md text-sm min-w-[220px]"
          />
          <button
            type="button"
            onClick={saveAsTemplate}
            disabled={!templateName.trim()}
            className={`px-3 py-2 rounded-md border text-sm ${templateName.trim() ? 'hover:bg-[#bbc3c4]' : 'opacity-50 cursor-not-allowed'}`}
          >
            Save as template
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setScheduleType('simple')}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              scheduleType === 'simple'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Settings className="h-6 w-6 mb-2 text-primary-600" />
            <h3 className="font-medium text-gray-900">Simple Schedule</h3>
            <p className="text-sm text-gray-600">Single frequency with one service type</p>
          </button>
          
          <button
            onClick={() => setScheduleType('complex')}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              scheduleType === 'complex'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Calendar className="h-6 w-6 mb-2 text-primary-600" />
            <h3 className="font-medium text-gray-900">Complex Schedule</h3>
            <p className="text-sm text-gray-600">Multiple frequencies and service types</p>
          </button>
          {/* For units, show Occupancy only when eligible; otherwise show Random Selection */}
          {occupancyEligible ? (
            <button
              onClick={() => setScheduleType('occupancy')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                scheduleType === 'occupancy'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Home className="h-6 w-6 mb-2 text-primary-600" />
              <h3 className="font-medium text-gray-900">Occupancy</h3>
              <p className="text-sm text-gray-600">Arrival/occupied + weekly/bi-weekly minimums</p>
            </button>
          ) : (
            <button
              onClick={() => setScheduleType('random_selection')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                scheduleType === 'random_selection'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Shuffle className="h-6 w-6 mb-2 text-primary-600" />
              <h3 className="font-medium text-gray-900">Random Selection</h3>
              <p className="text-sm text-gray-600">Random selection from multiple pools</p>
            </button>
          )}
        </div>
      </div>

      {/* Simple Schedule Configuration */}
      {scheduleType === 'simple' && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Simple Schedule Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency
              </label>
              <select
                value={simpleConfig.frequency}
                onChange={(e) => updateSimpleConfig('frequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {frequencyOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time
              </label>
              <input
                type="time"
                value={simpleConfig.time_preference || '09:00'}
                onChange={(e) => updateSimpleConfig('time_preference', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
            <select
              value={simpleConfig.service_type}
              onChange={(e) => updateSimpleConfig('service_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {serviceTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {simpleConfig.frequency === 'weekly' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Day
              </label>
              <select
                value={simpleConfig.day_preference || 'monday'}
                onChange={(e) => updateSimpleConfig('day_preference', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {dayOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {simpleConfig.frequency === 'specific_days' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Days
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {dayOptions.map(day => (
                  <label key={day.value} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(simpleConfig.specific_days || []).includes(day.value)}
                      onChange={(e) => {
                        const current = simpleConfig.specific_days || []
                        const updated = e.target.checked
                          ? [...current, day.value]
                          : current.filter(d => d !== day.value)
                        updateSimpleConfig('specific_days', updated)
                      }}
                    />
                    <span className="text-sm">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Complex Schedule Configuration */}
      {scheduleType === 'complex' && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Complex Schedule Configuration</h3>
          </div>
          
          <div className="space-y-4">
            {(complexConfig.schedules || []).map((schedule, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">
                    Schedule {index + 1}
                  </h4>
                  {complexConfig.schedules.length > 1 && (
                    <button
                      onClick={() => removeComplexSchedule(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={schedule.name || ''}
                      onChange={(e) => updateComplexSchedule(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Daily Testing"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequency
                    </label>
                    <select
                      value={schedule.frequency}
                      onChange={(e) => updateComplexSchedule(index, 'frequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {frequencyOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={schedule.time}
                      onChange={(e) => updateComplexSchedule(index, 'time', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Types
                    </label>
                    <select
                      multiple
                      value={schedule.service_types}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, option => option.value)
                        updateComplexSchedule(index, 'service_types', values)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      size={3}
                    >
                      {serviceTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={addComplexSchedule}
              className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Another Entry
            </button>
          </div>
        </div>
      )}

      {/* Random Selection Configuration (shared/property contexts) */}
      {scheduleType === 'random_selection' && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Random Selection Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency
              </label>
              <select
                value={randomConfig.frequency}
                onChange={(e) => updateRandomConfig('frequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {frequencyOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number to Select
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={randomConfig.selection_count}
                onChange={(e) => updateRandomConfig('selection_count', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time
              </label>
              <input
                type="time"
                value={randomConfig.time_preference || '09:00'}
                onChange={(e) => updateRandomConfig('time_preference', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
              <select
                value={randomConfig.service_type}
                onChange={(e) => updateRandomConfig('service_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {serviceTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                checked={!!randomConfig.limit_to_shared_facilities}
                onChange={(e) => updateRandomConfig('limit_to_shared_facilities', e.target.checked)}
              />
              <span className="text-sm text-gray-700">Limit to shared facilities</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Unit Type (optional)</label>
              <select
                value={randomConfig.unit_type_filter || ''}
                onChange={(e) => updateRandomConfig('unit_type_filter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All</option>
                <option value="main_pool">Main Pool</option>
                <option value="kids_pool">Kids Pool</option>
                <option value="main_spa">Main Spa</option>
                <option value="rooftop_spa">Rooftop Spa</option>
                <option value="plunge_pool">Plunge Pool</option>
                <option value="villa_pool">Villa Pool</option>
                <option value="residential_pool">Residential Pool</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Water Type (optional)</label>
              <select
                value={randomConfig.water_type_filter || ''}
                onChange={(e) => updateRandomConfig('water_type_filter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All</option>
                <option value="saltwater">Saltwater</option>
                <option value="freshwater">Freshwater</option>
                <option value="bromine">Bromine</option>
              </select>
            </div>
          </div>

        </div>
      )}

      {/* Occupancy Configuration (units) */}
      {scheduleType === 'occupancy' && normalizedContext === 'unit' && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Occupancy Rules</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={occupancyOnArrival} onChange={(e) => setOccupancyOnArrival(e.target.checked)} />
              <span>Service on arrival day</span>
            </label>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={occupancyWeeklyMin} onChange={(e) => setOccupancyWeeklyMin(e.target.checked)} />
                <span>Weekly minimum</span>
              </label>
              <select
                value={occupancyWeeklyDay}
                onChange={(e) => setOccupancyWeeklyDay(e.target.value)}
                className="px-2 py-1 border rounded"
              >
                {dayOptions.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={occupancyBiweeklyMin} onChange={(e) => setOccupancyBiweeklyMin(e.target.checked)} />
                <span>Bi-weekly minimum</span>
              </label>
              <select
                value={occupancyBiweeklyDay}
                onChange={(e) => setOccupancyBiweeklyDay(e.target.value)}
                className="px-2 py-1 border rounded"
              >
                {dayOptions.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Schedule
        </button>
      </div>
    </div>
  )
}
