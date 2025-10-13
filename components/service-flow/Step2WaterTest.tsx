'use client'

import { useState, useEffect } from 'react'
import { Droplets, AlertTriangle, CheckCircle, Thermometer, Gauge } from 'lucide-react'
import ParameterValidator from '@/components/ParameterValidator'
import { validateWaterTest } from '@/lib/compliance'

interface ServiceData {
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
  [key: string]: any
}

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

interface Props {
  serviceData: ServiceData
  updateServiceData: (updates: Partial<ServiceData>) => void
  unit: Unit
}

export default function Step2WaterTest({ serviceData, updateServiceData, unit }: Props) {
  const [localData, setLocalData] = useState({
    ph: serviceData.ph,
    chlorine: serviceData.chlorine,
    bromine: serviceData.bromine,
    salt: serviceData.salt,
    alkalinity: serviceData.alkalinity,
    calcium: serviceData.calcium,
    cyanuric: serviceData.cyanuric,
    isPumpRunning: serviceData.isPumpRunning,
    isWaterWarm: serviceData.isWaterWarm,
    isFilterCleaned: serviceData.isFilterCleaned
  })

  const [complianceResult, setComplianceResult] = useState<any>(null)

  const handleChange = (field: string, value: any) => {
    const updates = { [field]: value }
    setLocalData(prev => ({ ...prev, ...updates }))
    updateServiceData(updates)
  }

  const isSpa = unit.unit_type.includes('spa')
  const isPool = unit.unit_type.includes('pool')

  // Check compliance when water test data changes
  useEffect(() => {
    const hasData = localData.ph || localData.chlorine || localData.bromine || 
                   localData.salt || localData.alkalinity || localData.calcium || localData.cyanuric

    if (hasData) {
      try {
        const result = validateWaterTest(
          {
            ph: localData.ph ? parseFloat(localData.ph) : undefined,
            chlorine: localData.chlorine ? parseFloat(localData.chlorine) : undefined,
            bromine: localData.bromine ? parseFloat(localData.bromine) : undefined,
            salt: localData.salt ? parseInt(localData.salt) : undefined,
            alkalinity: localData.alkalinity ? parseInt(localData.alkalinity) : undefined,
            calcium: localData.calcium ? parseInt(localData.calcium) : undefined,
            cyanuric: localData.cyanuric ? parseInt(localData.cyanuric) : undefined
          },
          unit.unit_type,
          unit.water_type
        )
        setComplianceResult(result)
      } catch (error) {
        console.error('Compliance check error:', error)
      }
    } else {
      setComplianceResult(null)
    }
  }, [localData, unit.unit_type, unit.water_type])

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Water Test Results</h2>
        <p className="text-gray-600">
          Enter the water test results for {unit.name}
        </p>
      </div>

      {/* Compliance Alert */}
      {complianceResult && (
        <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
          complianceResult.allParametersOk 
            ? 'bg-success-light text-success' 
            : 'bg-warning-light text-warning'
        }`}>
          {complianceResult.allParametersOk ? (
            <CheckCircle className="h-5 w-5 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 mt-0.5" />
          )}
          <div>
            <h3 className="font-medium">
              {complianceResult.allParametersOk ? 'All Parameters OK' : 'Parameters Need Attention'}
            </h3>
            {complianceResult.violations && complianceResult.violations.length > 0 && (
              <ul className="mt-2 text-sm">
                {complianceResult.violations.map((violation: any, index: number) => (
                  <li key={index}>• {violation.parameter}: {violation.message}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pool Parameters */}
        {isPool && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <Droplets className="h-4 w-4 mr-2" />
              Pool Parameters
            </h3>
            
            {/* pH */}
            <div>
              <label htmlFor="ph" className="block text-sm font-medium text-gray-700 mb-1">
                pH Level
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  id="ph"
                  value={localData.ph}
                  onChange={(e) => handleChange('ph', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="7.4"
                />
                <ParameterValidator
                  value={localData.ph}
                  parameter="ph"
                  unitType={unit.unit_type}
                  waterType={unit.water_type}
                />
              </div>
            </div>

            {/* Chlorine */}
            <div>
              <label htmlFor="chlorine" className="block text-sm font-medium text-gray-700 mb-1">
                Chlorine (ppm)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  id="chlorine"
                  value={localData.chlorine}
                  onChange={(e) => handleChange('chlorine', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="3.0"
                />
                <ParameterValidator
                  value={localData.chlorine}
                  parameter="chlorine"
                  unitType={unit.unit_type}
                  waterType={unit.water_type}
                />
              </div>
            </div>

            {/* Salt (for saltwater pools) */}
            {unit.water_type === 'saltwater' && (
              <div>
                <label htmlFor="salt" className="block text-sm font-medium text-gray-700 mb-1">
                  Salt (ppm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="salt"
                    value={localData.salt}
                    onChange={(e) => handleChange('salt', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder="3000"
                  />
                  <ParameterValidator
                    value={localData.salt}
                    parameter="salt"
                    unitType={unit.unit_type}
                    waterType={unit.water_type}
                  />
                </div>
              </div>
            )}

            {/* Alkalinity */}
            <div>
              <label htmlFor="alkalinity" className="block text-sm font-medium text-gray-700 mb-1">
                Alkalinity (ppm)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="alkalinity"
                  value={localData.alkalinity}
                  onChange={(e) => handleChange('alkalinity', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="120"
                />
                <ParameterValidator
                  value={localData.alkalinity}
                  parameter="alkalinity"
                  unitType={unit.unit_type}
                  waterType={unit.water_type}
                />
              </div>
            </div>

            {/* Calcium Hardness */}
            <div>
              <label htmlFor="calcium" className="block text-sm font-medium text-gray-700 mb-1">
                Calcium Hardness (ppm)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="calcium"
                  value={localData.calcium}
                  onChange={(e) => handleChange('calcium', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="250"
                />
                <ParameterValidator
                  value={localData.calcium}
                  parameter="calcium"
                  unitType={unit.unit_type}
                  waterType={unit.water_type}
                />
              </div>
            </div>

            {/* Cyanuric Acid */}
            <div>
              <label htmlFor="cyanuric" className="block text-sm font-medium text-gray-700 mb-1">
                Cyanuric Acid (ppm)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="cyanuric"
                  value={localData.cyanuric}
                  onChange={(e) => handleChange('cyanuric', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="50"
                />
                <ParameterValidator
                  value={localData.cyanuric}
                  parameter="cyanuric"
                  unitType={unit.unit_type}
                  waterType={unit.water_type}
                />
              </div>
            </div>
          </div>
        )}

        {/* Spa Parameters */}
        {isSpa && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <Droplets className="h-4 w-4 mr-2" />
              Spa Parameters
            </h3>
            
            {/* Bromine */}
            <div>
              <label htmlFor="bromine" className="block text-sm font-medium text-gray-700 mb-1">
                Bromine (ppm)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  id="bromine"
                  value={localData.bromine}
                  onChange={(e) => handleChange('bromine', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="3.0"
                />
                <ParameterValidator
                  value={localData.bromine}
                  parameter="bromine"
                  unitType={unit.unit_type}
                  waterType={unit.water_type}
                />
              </div>
            </div>

            {/* Spa Equipment Checks */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Equipment Status</h4>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={localData.isPumpRunning}
                    onChange={(e) => handleChange('isPumpRunning', e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Pump is running</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={localData.isWaterWarm}
                    onChange={(e) => handleChange('isWaterWarm', e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Water is warm</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={localData.isFilterCleaned}
                    onChange={(e) => handleChange('isFilterCleaned', e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Filter has been cleaned</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Skip Water Test Option */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> Water testing is optional. You can skip this step if no testing was performed.
        </p>
      </div>
    </div>
  )
}








