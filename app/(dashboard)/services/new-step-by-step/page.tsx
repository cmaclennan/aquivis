'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

// Step Components
import Step1ServiceType from '@/components/service-flow/Step1ServiceType'
import Step2WaterTest from '@/components/service-flow/Step2WaterTest'
import Step3ChemicalSuggestions from '@/components/service-flow/Step3ChemicalSuggestions'
import Step4MaintenanceTasks from '@/components/service-flow/Step4MaintenanceTasks'
import Step5EquipmentCheck from '@/components/service-flow/Step5EquipmentCheck'
import Step6Photos from '@/components/service-flow/Step6Photos'

type ServiceType = 'test_only' | 'full_service' | 'equipment_check' | 'plant_room_check'
type WaterType = 'saltwater' | 'freshwater' | 'bromine'

interface Unit {
  id: string
  name: string
  unit_type: string
  water_type: string
  property: {
    id: string
    name: string
  }
}

interface ServiceData {
  // Step 1: Service Type
  serviceType: ServiceType
  technicianId: string
  serviceDate: string
  
  // Step 2: Water Test
  ph: string
  chlorine: string
  bromine: string
  salt: string
  alkalinity: string
  calcium: string
  cyanuric: string
  isPumpRunning: boolean
  isWaterWarm: boolean
  isFilterCleaned: boolean
  
  // Step 3: Chemical Suggestions
  chemicalAdditions: Array<{
    chemicalType: string
    quantity: string
    unitOfMeasure: string
  }>
  
  // Step 4: Maintenance Tasks
  maintenanceTasks: Array<{
    taskType: string
    completed: boolean
    notes: string
  }>
  
  // Step 5: Equipment Check
  equipmentStatus: 'normal' | 'warning' | 'fault'
  equipmentNotes: string
  
  // Step 6: Photos
  photos: Array<{
    url: string
    caption: string
  }>
  
  // General
  notes: string
}

export default function NewServiceStepByStepPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  
  // Current step (1-6)
  const [currentStep, setCurrentStep] = useState(1)
  const [serviceData, setServiceData] = useState<ServiceData>({
    serviceType: 'full_service',
    technicianId: '',
    serviceDate: new Date().toISOString().split('T')[0],
    ph: '',
    chlorine: '',
    bromine: '',
    salt: '',
    alkalinity: '',
    calcium: '',
    cyanuric: '',
    isPumpRunning: false,
    isWaterWarm: false,
    isFilterCleaned: false,
    chemicalAdditions: [],
    maintenanceTasks: [],
    equipmentStatus: 'normal',
    equipmentNotes: '',
    photos: [],
    notes: ''
  })
  
  // Data
  const [unit, setUnit] = useState<Unit | null>(null)
  const [technicians, setTechnicians] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!profile?.company_id) throw new Error('No company found')

      // Load technicians
      const { data: techsData, error: techsError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('company_id', profile.company_id)
        .eq('role', 'technician')
        .order('first_name')

      if (techsError) throw techsError
      setTechnicians(techsData || [])
    } catch (err: any) {
      setError(err.message)
    }
  }, [supabase])

  const loadUnit = useCallback(async (unitId: string) => {
    try {
      const { data: unitData, error: unitError } = await supabase
        .from('units')
        .select(`
          id,
          name,
          unit_type,
          water_type,
          property:properties(id, name)
        `)
        .eq('id', unitId)
        .single()

      if (unitError) throw unitError
      setUnit(unitData ? { ...unitData, property: Array.isArray(unitData.property) ? unitData.property[0] : unitData.property } : null)
    } catch (err: any) {
      setError(err.message)
    }
  }, [supabase])

  const updateServiceData = (updates: Partial<ServiceData>) => {
    setServiceData(prev => ({ ...prev, ...updates }))
  }

  const nextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: // Service Type
        return serviceData.serviceType && serviceData.serviceDate
      case 2: // Water Test
        return true // Water test is optional
      case 3: // Chemical Suggestions
        return true // Chemical suggestions are optional
      case 4: // Maintenance Tasks
        return true // Maintenance tasks are optional
      case 5: // Equipment Check
        return true // Equipment check is optional
      case 6: // Photos
        return true // Photos are optional
      default:
        return false
    }
  }

  const handleSubmit = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!profile?.company_id) throw new Error('No company found')

      // Create service
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .insert({
          unit_id: unit?.id,
          property_id: unit?.property.id,
          technician_id: serviceData.technicianId || null,
          service_date: serviceData.serviceDate,
          service_type: serviceData.serviceType,
          status: 'completed',
          notes: serviceData.notes
        })
        .select()
        .single()

      if (serviceError) throw serviceError

      // Create water test if data provided
      const hasWaterTest = serviceData.ph || serviceData.chlorine || serviceData.bromine || 
                          serviceData.salt || serviceData.alkalinity || serviceData.calcium || serviceData.cyanuric
      
      if (hasWaterTest) {
        const { error: waterTestError } = await supabase
          .from('water_tests')
          .insert({
            service_id: service.id,
            test_time: new Date().toISOString(),
            ph: serviceData.ph ? parseFloat(serviceData.ph) : null,
            chlorine: serviceData.chlorine ? parseFloat(serviceData.chlorine) : null,
            bromine: serviceData.bromine ? parseFloat(serviceData.bromine) : null,
            salt: serviceData.salt ? parseInt(serviceData.salt) : null,
            alkalinity: serviceData.alkalinity ? parseInt(serviceData.alkalinity) : null,
            calcium: serviceData.calcium ? parseInt(serviceData.calcium) : null,
            cyanuric: serviceData.cyanuric ? parseInt(serviceData.cyanuric) : null,
            is_pump_running: serviceData.isPumpRunning,
            is_water_warm: serviceData.isWaterWarm,
            is_filter_cleaned: serviceData.isFilterCleaned,
            all_parameters_ok: true, // Will be calculated by compliance logic
            notes: serviceData.notes
          })

        if (waterTestError) throw waterTestError
      }

      // Create chemical additions
      for (const chemical of serviceData.chemicalAdditions) {
        if (chemical.chemicalType && chemical.quantity) {
          const { error: chemicalError } = await supabase
            .from('chemical_additions')
            .insert({
              service_id: service.id,
              chemical_type: chemical.chemicalType,
              quantity: parseFloat(chemical.quantity),
              unit_of_measure: chemical.unitOfMeasure
            })

          if (chemicalError) throw chemicalError
        }
      }

      // Create maintenance tasks
      for (const task of serviceData.maintenanceTasks) {
        if (task.taskType) {
          const { error: taskError } = await supabase
            .from('maintenance_tasks')
            .insert({
              service_id: service.id,
              task_type: task.taskType,
              completed: task.completed,
              notes: task.notes
            })

          if (taskError) throw taskError
        }
      }

      // Redirect to service detail page
      router.push(`/services/${service.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [supabase, router, serviceData.alkalinity, serviceData.bromine, serviceData.calcium, serviceData.chemicalAdditions, serviceData.chlorine, serviceData.cyanuric, serviceData.isFilterCleaned, serviceData.isPumpRunning, serviceData.isWaterWarm, serviceData.maintenanceTasks, serviceData.notes, serviceData.ph, serviceData.salt, serviceData.serviceDate, serviceData.serviceType, serviceData.technicianId, unit?.id, unit?.property.id])

  useEffect(() => {
    loadData()
    
    // Check for unit parameter in URL
    const unitParam = searchParams.get('unit')
    if (unitParam) {
      loadUnit(unitParam)
    }
  }, [searchParams, loadData, loadUnit])

  if (!unit) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-gray-600">Loading unit...</p>
        </div>
      </div>
    )
  }

  const stepTitles = [
    'Service Type',
    'Water Test Results',
    'Chemical Suggestions',
    'Maintenance Tasks',
    'Equipment Check',
    'Service Photos'
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/properties/${unit.property.id}`}
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to {unit.property.name}</span>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Service: {unit.name}</h1>
            <p className="mt-2 text-gray-600">
              Step {currentStep} of 6: {stepTitles[currentStep - 1]}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">{currentStep} of 6</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 rounded-lg bg-error-light p-4 text-sm text-error flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Content */}
      <div className="max-w-4xl">
        {currentStep === 1 && (
          <Step1ServiceType
            serviceData={serviceData}
            updateServiceData={updateServiceData}
            technicians={technicians}
            unit={unit}
          />
        )}
        {currentStep === 2 && (
          <Step2WaterTest
            serviceData={serviceData}
            updateServiceData={updateServiceData}
            unit={unit}
          />
        )}
        {currentStep === 3 && (
          <Step3ChemicalSuggestions
            serviceData={serviceData}
            updateServiceData={updateServiceData}
            unit={unit}
          />
        )}
        {currentStep === 4 && (
          <Step4MaintenanceTasks
            serviceData={serviceData}
            updateServiceData={updateServiceData}
            unit={unit}
          />
        )}
        {currentStep === 5 && (
          <Step5EquipmentCheck
            serviceData={serviceData}
            updateServiceData={updateServiceData}
            unit={unit}
          />
        )}
        {currentStep === 6 && (
          <Step6Photos
            serviceData={serviceData}
            updateServiceData={updateServiceData}
            unit={unit}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        
        <div className="flex space-x-4">
          {currentStep < 6 ? (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-lg bg-success px-6 py-2 text-white hover:bg-success-600 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Completing Service...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Complete Service</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}








