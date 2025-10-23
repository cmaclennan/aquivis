'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSession } from 'next-auth/react'
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
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  
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
    if (!session?.user?.company_id) return

    try {
      // Load technicians via server API
      const res = await fetch('/api/technicians', { method: 'GET' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to load technicians')
      setTechnicians(json.technicians || [])
    } catch (err: any) {
      setError(err.message)
    }
  }, [session])

  const loadUnit = useCallback(async (unitId: string) => {
    try {
      const res = await fetch(`/api/units/${unitId}`, { method: 'GET' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to load unit')
      setUnit(json.unit || null)
    } catch (err: any) {
      setError(err.message)
    }
  }, [])

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
    if (!session?.user?.company_id) return

    setLoading(true)
    setError(null)

    try {
      // Create service via API
      const resService = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unit?.id,
          property_id: unit?.property.id,
          technician_id: serviceData.technicianId || null,
          service_date: serviceData.serviceDate,
          service_type: serviceData.serviceType,
          status: 'completed',
          notes: serviceData.notes,
        }),
      })
      const serviceJson = await resService.json().catch(() => ({}))
      if (!resService.ok || serviceJson?.error) throw new Error(serviceJson?.error || 'Failed to create service')
      const service = serviceJson.service

      // Create water test if data provided
      const hasWaterTest = serviceData.ph || serviceData.chlorine || serviceData.bromine || 
                          serviceData.salt || serviceData.alkalinity || serviceData.calcium || serviceData.cyanuric
      
      if (hasWaterTest) {
        const resWT = await fetch(`/api/services/${service.id}/water-tests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ph: serviceData.ph ? parseFloat(serviceData.ph) : null,
            chlorine: serviceData.chlorine ? parseFloat(serviceData.chlorine) : null,
            bromine: serviceData.bromine ? parseFloat(serviceData.bromine) : null,
            salt: serviceData.salt ? parseInt(serviceData.salt) : null,
            alkalinity: serviceData.alkalinity ? parseInt(serviceData.alkalinity) : null,
            calcium_hardness: serviceData.calcium ? parseInt(serviceData.calcium) : null,
            cyanuric_acid: serviceData.cyanuric ? parseInt(serviceData.cyanuric) : null,
            is_pump_running: serviceData.isPumpRunning,
            is_water_warm: serviceData.isWaterWarm,
            is_filter_cleaned: serviceData.isFilterCleaned,
            all_parameters_ok: true,
            notes: serviceData.notes,
          }),
        })
        const wtJson = await resWT.json().catch(() => ({}))
        if (!resWT.ok || wtJson?.error) throw new Error(wtJson?.error || 'Failed to save water test')
      }

      // Create chemical additions
      for (const chemical of serviceData.chemicalAdditions) {
        if (chemical.chemicalType && chemical.quantity) {
          const resChem = await fetch(`/api/services/${service.id}/chemicals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ additions: [{
              chemicalType: chemical.chemicalType,
              quantity: parseFloat(chemical.quantity),
              unitOfMeasure: chemical.unitOfMeasure,
            }] }),
          })
          const chemJson = await resChem.json().catch(() => ({}))
          if (!resChem.ok || chemJson?.error) throw new Error(chemJson?.error || 'Failed to save chemicals')
        }
      }

      // Create maintenance tasks
      for (const task of serviceData.maintenanceTasks) {
        if (task.taskType) {
          const resTask = await fetch(`/api/services/${service.id}/maintenance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks: [{
              taskType: task.taskType,
              completed: task.completed,
              notes: task.notes,
            }] }),
          })
          const taskJson = await resTask.json().catch(() => ({}))
          if (!resTask.ok || taskJson?.error) throw new Error(taskJson?.error || 'Failed to save maintenance tasks')
        }
      }

      // Redirect to service detail page
      router.push(`/services/${service.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [router, serviceData.alkalinity, serviceData.bromine, serviceData.calcium, serviceData.chemicalAdditions, serviceData.chlorine, serviceData.cyanuric, serviceData.isFilterCleaned, serviceData.isPumpRunning, serviceData.isWaterWarm, serviceData.maintenanceTasks, serviceData.notes, serviceData.ph, serviceData.salt, serviceData.serviceDate, serviceData.serviceType, serviceData.technicianId, unit?.id, unit?.property.id, session?.user?.company_id])

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








