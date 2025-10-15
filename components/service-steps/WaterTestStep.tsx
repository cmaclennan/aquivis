'use client'

import { useState, useEffect } from 'react'
import { Thermometer, Droplets, AlertTriangle, CheckCircle } from 'lucide-react'
import { validateWaterTest } from '@/lib/compliance'

interface ServiceData {
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

export default function WaterTestStep({ serviceData, updateServiceData, unit }: Props) {
  const [localData, setLocalData] = useState(serviceData.waterTestData)
  const [compliance, setCompliance] = useState<any>(null)

  // Correct unit type classification
  const isSpa = unit.unit_type === 'rooftop_spa' || unit.unit_type === 'main_spa'
  const isPool = [
    'villa_pool',
    'plunge_pool',
    'main_pool',
    'kids_pool',
    'residential_pool',
    'splash_park',
  ].includes(unit.unit_type)

  useEffect(() => {
    // Validate water test data when it changes
    if (Object.values(localData).some((value: any) => {
      if (typeof value === 'boolean') return value === true
      return value !== undefined && value !== null && (typeof value === 'number' ? value !== 0 : value !== '')
    })) {
      try {
        const result = validateWaterTest(localData, unit.unit_type, unit.water_type)
        setCompliance(result)
      } catch (error) {
        // Handle validation error silently
      }
    } else {
      setCompliance(null)
    }
  }, [localData, unit.unit_type, unit.water_type])

  const handleChange = (field: string, value: any) => {
    const updates = { [field]: value }
    setLocalData(prev => ({ ...prev, ...updates }))
    updateServiceData({ waterTestData: { ...localData, ...updates } })
  }

  const getParameterStatus = (parameter: string, value: number) => {
    if (!compliance || !compliance.parameters) return 'neutral'
    
    const param = compliance.parameters.find((p: any) => p.parameter === parameter)
    if (!param) return 'neutral'
    
    if (param.status === 'compliant') return 'compliant'
    if (param.status === 'warning') return 'warning'
    if (param.status === 'violation') return 'violation'
    return 'neutral'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'violation':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'violation':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-white'
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Water Test Results</h2>
        <p className="text-gray-600">
          Record the water test results for {unit.name}
        </p>
        {isSpa && (
          <div className="mt-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-sm font-medium text-purple-900">
                Spa Service - Simplified testing (pH and Bromine only)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Compliance Alert */}
      {compliance && (
        <div className={`mb-6 p-4 rounded-lg border ${getStatusColor(compliance.overallStatus)}`}>
          <div className="flex items-center space-x-2 mb-2">
            {getStatusIcon(compliance.overallStatus)}
            <span className="font-medium text-gray-900">
              {compliance.overallStatus === 'compliant' ? 'All parameters compliant' : 
               compliance.overallStatus === 'warning' ? 'Some parameters need attention' : 
               'Compliance violations detected'}
            </span>
          </div>
          {compliance.recommendations && compliance.recommendations.length > 0 && (
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">Recommendations:</p>
              <ul className="list-disc list-inside space-y-1">
                {compliance.recommendations.map((rec: string, index: number) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Water Test Parameters */}
      <div className="space-y-6">
        {/* pH - Always required */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="ph" className="block text-sm font-medium text-gray-700 mb-2">
              pH Level *
            </label>
            <div className="relative">
              <input
                type="number"
                id="ph"
                step="0.1"
                min="6.0"
                max="8.5"
                value={localData.ph || ''}
                onChange={(e) => handleChange('ph', e.target.value ? parseFloat(e.target.value) : undefined)}
                className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 ${
                  getStatusColor(getParameterStatus('ph', localData.ph || 0))
                }`}
                placeholder="7.4"
              />
              <div className="absolute right-3 top-2.5">
                {getStatusIcon(getParameterStatus('ph', localData.ph || 0))}
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">Ideal range: 7.2 - 7.6</p>
          </div>
        </div>

        {/* Spa Parameters */}
        {isSpa && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="bromine" className="block text-sm font-medium text-gray-700 mb-2">
                Bromine Level
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="bromine"
                  step="0.1"
                  min="0"
                  max="20"
                  value={localData.bromine || ''}
                  onChange={(e) => handleChange('bromine', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 ${
                    getStatusColor(getParameterStatus('bromine', localData.bromine || 0))
                  }`}
                  placeholder="3.0"
                />
                <div className="absolute right-3 top-2.5">
                  {getStatusIcon(getParameterStatus('bromine', localData.bromine || 0))}
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Ideal range: 2.0 - 4.0 ppm</p>
            </div>

          </div>
        )}

        {/* Pool Parameters */}
        {isPool && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="chlorine" className="block text-sm font-medium text-gray-700 mb-2">
                  Chlorine Level
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="chlorine"
                    step="0.1"
                    min="0"
                    max="10"
                    value={localData.chlorine || ''}
                    onChange={(e) => handleChange('chlorine', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 ${
                      getStatusColor(getParameterStatus('chlorine', localData.chlorine || 0))
                    }`}
                    placeholder="2.0"
                  />
                  <div className="absolute right-3 top-2.5">
                    {getStatusIcon(getParameterStatus('chlorine', localData.chlorine || 0))}
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">Ideal range: 1.0 - 3.0 ppm</p>
              </div>

              <div>
                <label htmlFor="salt" className="block text-sm font-medium text-gray-700 mb-2">
                  Salt Level (ppm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="salt"
                    min="0"
                    max="6000"
                    value={localData.salt || ''}
                    onChange={(e) => handleChange('salt', e.target.value ? parseInt(e.target.value) : undefined)}
                    className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 ${
                      getStatusColor(getParameterStatus('salt', localData.salt || 0))
                    }`}
                    placeholder="3200"
                  />
                  <div className="absolute right-3 top-2.5">
                    {getStatusIcon(getParameterStatus('salt', localData.salt || 0))}
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">Ideal range: 3000-3500 ppm</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="alkalinity" className="block text-sm font-medium text-gray-700 mb-2">
                  Alkalinity (ppm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="alkalinity"
                    min="0"
                    max="200"
                    value={localData.alkalinity || ''}
                    onChange={(e) => handleChange('alkalinity', e.target.value ? parseInt(e.target.value) : undefined)}
                    className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 ${
                      getStatusColor(getParameterStatus('alkalinity', localData.alkalinity || 0))
                    }`}
                    placeholder="120"
                  />
                  <div className="absolute right-3 top-2.5">
                    {getStatusIcon(getParameterStatus('alkalinity', localData.alkalinity || 0))}
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">Ideal range: 80-120 ppm</p>
              </div>

              <div>
                <label htmlFor="calcium" className="block text-sm font-medium text-gray-700 mb-2">
                  Calcium (ppm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="calcium"
                    min="0"
                    max="500"
                    value={localData.calcium || ''}
                    onChange={(e) => handleChange('calcium', e.target.value ? parseInt(e.target.value) : undefined)}
                    className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 ${
                      getStatusColor(getParameterStatus('calcium', localData.calcium || 0))
                    }`}
                    placeholder="250"
                  />
                  <div className="absolute right-3 top-2.5">
                    {getStatusIcon(getParameterStatus('calcium', localData.calcium || 0))}
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">Ideal range: 200-400 ppm</p>
              </div>

              <div>
                <label htmlFor="cyanuric" className="block text-sm font-medium text-gray-700 mb-2">
                  Cyanuric Acid (ppm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="cyanuric"
                    min="0"
                    max="100"
                    value={localData.cyanuric || ''}
                    onChange={(e) => handleChange('cyanuric', e.target.value ? parseInt(e.target.value) : undefined)}
                    className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 ${
                      getStatusColor(getParameterStatus('cyanuric', localData.cyanuric || 0))
                    }`}
                    placeholder="50"
                  />
                  <div className="absolute right-3 top-2.5">
                    {getStatusIcon(getParameterStatus('cyanuric', localData.cyanuric || 0))}
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">Ideal range: 30-50 ppm</p>
              </div>
            </div>
          </>
        )}

        {/* Equipment Status - Only for spas */}
        {isSpa && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isPumpRunning"
                checked={localData.isPumpRunning || false}
                onChange={(e) => handleChange('isPumpRunning', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="isPumpRunning" className="text-sm font-medium text-gray-700">
                Pump Running
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isWaterWarm"
                checked={localData.isWaterWarm || false}
                onChange={(e) => handleChange('isWaterWarm', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="isWaterWarm" className="text-sm font-medium text-gray-700">
                Water Warm
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isFilterCleaned"
                checked={localData.isFilterCleaned || false}
                onChange={(e) => handleChange('isFilterCleaned', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="isFilterCleaned" className="text-sm font-medium text-gray-700">
                Filter Cleaned
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Skip Option */}
      <div className="mt-8 p-4 rounded-lg bg-gray-50 border border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="skipWaterTest"
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label htmlFor="skipWaterTest" className="text-sm text-gray-700">
            Skip water test (no testing equipment available)
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          You can still complete the service without water test results
        </p>
      </div>
    </div>
  )
}
