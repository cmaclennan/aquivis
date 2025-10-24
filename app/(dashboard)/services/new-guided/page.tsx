'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Droplets } from 'lucide-react'
import Link from 'next/link'

// Step Components
import ServiceTypeStep from '@/components/service-steps/ServiceTypeStep'
import WaterTestStep from '@/components/service-steps/WaterTestStep'
import ChemicalStep from '@/components/service-steps/ChemicalStep'
import MaintenanceStep from '@/components/service-steps/MaintenanceStep'
import EquipmentStep from '@/components/service-steps/EquipmentStep'
import PhotosStep from '@/components/service-steps/PhotosStep'

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
  serviceType: string
  technicianId: string
  serviceDate: string
  
  // Step 2: Water Test
  waterTestData: {
    ph?: number
    chlorine?: number
    bromine?: number
    salt?: number
    alkalinity?: number
    calcium?: number
    cyanuric?: number
    isPumpRunning?: boolean
    isWaterWarm?: boolean
    isFilterCleaned?: boolean
  }
  
  // Step 3: Chemicals
  chemicalAdditions: Array<{
    chemicalType: string
    quantity: number
    unitOfMeasure: string
  }>
  
  // Step 4: Maintenance
  maintenanceTasks: Array<{
    taskType: string
    completed: boolean
    notes: string
  }>
  
  // Step 5: Equipment
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

const STEPS = [
  { id: 1, title: 'Service Type', description: 'Select service type and assign technician' },
  { id: 2, title: 'Water Test', description: 'Record water test results' },
  { id: 3, title: 'Chemicals', description: 'Add chemical treatments' },
  { id: 4, title: 'Maintenance', description: 'Complete maintenance tasks' },
  { id: 5, title: 'Equipment', description: 'Check equipment status' },
  { id: 6, title: 'Photos', description: 'Document with photos' }
]

export default function NewGuidedServicePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])

  // Current step (1-6)
  const [currentStep, setCurrentStep] = useState(1)
  const [serviceData, setServiceData] = useState<ServiceData>({
    serviceType: 'full_service',
    technicianId: '',
    serviceDate: new Date().toISOString().split('T')[0],
    waterTestData: {},
    chemicalAdditions: [],
    maintenanceTasks: [],
    equipmentStatus: 'normal',
    equipmentNotes: '',
    photos: [],
    notes: ''
  })

  // Data
  const [unit, setUnit] = useState<Unit | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!session?.user?.company_id) return

    try {

      // Load technicians
      const { data: techsData, error: techsError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('company_id', session.user.company_id)
        .eq('role', 'technician')
        .order('first_name')

      if (techsError) throw techsError
      setTechnicians(techsData || [])

      // Load units
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select(`
          id,
          name,
          unit_type,
          water_type,
          property:properties(id, name)
        `)
        .eq('property.company_id', session.user.company_id)
        .order('name')

      if (unitsError) throw unitsError
      // Normalize join arrays to single objects where necessary
      const normalized: Unit[] = (unitsData || []).map((u: any) => ({
        ...u,
        property: Array.isArray(u.property) ? u.property[0] : u.property,
      }))
      setUnits(normalized)
    } catch (err: any) {
      setError(err.message)
    }
  }, [supabase, session])

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

  useEffect(() => {
    loadData()
    
    // Check for unit parameter in URL
    const unitParam = searchParams.get('unitId') || searchParams.get('unit')
    const serviceTypeParam = searchParams.get('serviceType')
    
    if (unitParam) {
      loadUnit(unitParam)
    }
    
    if (serviceTypeParam) {
      setServiceData(prev => ({
        ...prev,
        serviceType: serviceTypeParam
      }))
    }
  }, [searchParams, loadUnit, loadData])

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
      case 3: // Chemicals
        return true // Chemicals are optional
      case 4: // Maintenance
        return true // Maintenance is optional
      case 5: // Equipment
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

    if (!session?.user?.company_id) return

    try {

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
      const hasWaterTest = Object.values(serviceData.waterTestData).some((value: any) => {
        if (typeof value === 'boolean') return value === true
        return value !== undefined && value !== null && value !== ''
      })
      
      if (hasWaterTest) {
        const { error: waterTestError } = await supabase
          .from('water_tests')
          .insert({
            service_id: service.id,
            test_time: new Date().toISOString(),
            ...serviceData.waterTestData,
            all_parameters_ok: true // Will be calculated by compliance logic
          })

        if (waterTestError) throw waterTestError
      }

      // Create chemical additions (existing table)
      for (const chemical of serviceData.chemicalAdditions) {
        if (chemical.chemicalType && chemical.quantity) {
          const { error: chemicalError } = await supabase
            .from('chemical_additions')
            .insert({
              service_id: service.id,
              chemical_type: chemical.chemicalType,
              quantity: chemical.quantity,
              unit_of_measure: chemical.unitOfMeasure
            })

          if (chemicalError) throw chemicalError
        }
      }

      // Redirect to service detail page
      router.push(`/services/${service.id}`)
      
      // Show success message
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [supabase, router, serviceData.chemicalAdditions, serviceData.notes, serviceData.serviceDate, serviceData.serviceType, serviceData.technicianId, serviceData.waterTestData, unit?.id, unit?.property.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (!unit) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
              </div>
              
              <div className="text-center">
                <h1 className="text-lg font-semibold text-gray-900">
                  New Service
                </h1>
                <p className="text-sm text-gray-600">
                  Select a unit to service
                </p>
              </div>
              
              <div className="w-24"></div> {/* Spacer for centering */}
            </div>
          </div>
        </div>

        {/* Unit Selection */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Unit</h2>
            <p className="text-gray-600 mb-8">
              Choose which unit you want to service
            </p>

            {error && (
              <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 flex items-center space-x-2">
                <span>❌</span>
                <span>{error}</span>
              </div>
            )}

            {units.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-gray-600">Loading units...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {units.map((unitOption) => (
                  <button
                    key={unitOption.id}
                    onClick={() => setUnit(unitOption)}
                    className="p-6 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary-50 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center">
                          <Droplets className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{unitOption.name}</h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {unitOption.unit_type.replace('_', ' ')} • {unitOption.water_type}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {unitOption.property.name}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const isSpa = unit.unit_type.includes('spa')
  const isPool = unit.unit_type.includes('pool')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href={`/properties/${unit.property.id}`}
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to {unit.property.name}</span>
              </Link>
            </div>
            
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-900">
                Service: {unit.name}
              </h1>
              <p className="text-sm text-gray-600">
                {isSpa ? 'Spa Service' : 'Pool Service'} - Step {currentStep} of 6
              </p>
            </div>
            
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {STEPS[currentStep - 1].title}
            </span>
            <span className="text-sm text-gray-500">
              Step {currentStep} of 6
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep > step.id 
                    ? 'bg-primary text-white' 
                    : currentStep === step.id 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 flex items-center space-x-2">
            <span>❌</span>
            <span>{error}</span>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {currentStep === 1 && (
            <ServiceTypeStep
              serviceData={serviceData}
              updateServiceData={updateServiceData}
              technicians={technicians}
              unit={unit}
            />
          )}
          {currentStep === 2 && (
            <WaterTestStep
              serviceData={serviceData}
              updateServiceData={updateServiceData}
              unit={unit}
            />
          )}
          {currentStep === 3 && (
            <ChemicalStep
              serviceData={serviceData}
              updateServiceData={updateServiceData}
              unit={unit}
            />
          )}
          {currentStep === 4 && (
            <MaintenanceStep
              serviceData={serviceData}
              updateServiceData={updateServiceData}
              unit={unit}
            />
          )}
          {currentStep === 5 && (
            <EquipmentStep
              serviceData={serviceData}
              updateServiceData={updateServiceData}
              unit={unit}
            />
          )}
          {currentStep === 6 && (
            <PhotosStep
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
            className="inline-flex items-center space-x-2 rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>
          
          <div className="flex space-x-4">
            {currentStep < 6 ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="inline-flex items-center space-x-2 rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next Step</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center space-x-2 rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
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
    </div>
  )
}
