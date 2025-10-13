'use client'

import { useState } from 'react'
import { Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'
import ChemicalRecommendation from '@/components/ChemicalRecommendation'

interface ServiceData {
  ph: string
  chlorine: string
  bromine: string
  salt: string
  alkalinity: string
  calcium: string
  cyanuric: string
  chemicalAdditions: Array<{
    chemicalType: string
    quantity: string
    unitOfMeasure: string
  }>
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

const CHEMICAL_TYPES = [
  { value: 'chlorine', label: 'Chlorine' },
  { value: 'bromine', label: 'Bromine' },
  { value: 'ph_increaser', label: 'pH Increaser (Soda Ash)' },
  { value: 'ph_decreaser', label: 'pH Decreaser (Muriatic Acid)' },
  { value: 'alkalinity_increaser', label: 'Alkalinity Increaser' },
  { value: 'calcium_increaser', label: 'Calcium Hardness Increaser' },
  { value: 'cyanuric_acid', label: 'Cyanuric Acid (Stabilizer)' },
  { value: 'salt', label: 'Pool Salt' },
  { value: 'shock', label: 'Shock Treatment' },
  { value: 'algaecide', label: 'Algaecide' },
  { value: 'clarifier', label: 'Clarifier' },
  { value: 'other', label: 'Other' }
]

const UNITS_OF_MEASURE = [
  { value: 'grams', label: 'Grams (g)' },
  { value: 'kilograms', label: 'Kilograms (kg)' },
  { value: 'milliliters', label: 'Milliliters (ml)' },
  { value: 'liters', label: 'Liters (L)' },
  { value: 'cups', label: 'Cups' },
  { value: 'pounds', label: 'Pounds (lbs)' }
]

export default function Step3ChemicalSuggestions({ serviceData, updateServiceData, unit }: Props) {
  const [localData, setLocalData] = useState({
    chemicalAdditions: serviceData.chemicalAdditions || []
  })

  const handleChange = (updates: any) => {
    setLocalData(prev => ({ ...prev, ...updates }))
    updateServiceData({ chemicalAdditions: localData.chemicalAdditions })
  }

  const addChemical = () => {
    const newChemical = {
      chemicalType: '',
      quantity: '',
      unitOfMeasure: 'grams'
    }
    const updatedAdditions = [...localData.chemicalAdditions, newChemical]
    setLocalData(prev => ({ ...prev, chemicalAdditions: updatedAdditions }))
    updateServiceData({ chemicalAdditions: updatedAdditions })
  }

  const updateChemical = (index: number, field: string, value: string) => {
    const updatedAdditions = [...localData.chemicalAdditions]
    updatedAdditions[index] = { ...updatedAdditions[index], [field]: value }
    setLocalData(prev => ({ ...prev, chemicalAdditions: updatedAdditions }))
    updateServiceData({ chemicalAdditions: updatedAdditions })
  }

  const removeChemical = (index: number) => {
    const updatedAdditions = localData.chemicalAdditions.filter((_, i) => i !== index)
    setLocalData(prev => ({ ...prev, chemicalAdditions: updatedAdditions }))
    updateServiceData({ chemicalAdditions: updatedAdditions })
  }

  // Check if we have water test data for chemical recommendations
  const hasWaterTestData = serviceData.ph || serviceData.chlorine || serviceData.bromine || 
                          serviceData.salt || serviceData.alkalinity || serviceData.calcium || serviceData.cyanuric

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Chemical Suggestions</h2>
        <p className="text-gray-600">
          Add any chemicals that were added during this service for {unit.name}
        </p>
      </div>

      {/* Chemical Recommendations */}
      {hasWaterTestData && (
        <div className="mb-6">
          <ChemicalRecommendation
            waterTestData={{
              ph: serviceData.ph ? parseFloat(serviceData.ph) : undefined,
              chlorine: serviceData.chlorine ? parseFloat(serviceData.chlorine) : undefined,
              bromine: serviceData.bromine ? parseFloat(serviceData.bromine) : undefined,
              salt: serviceData.salt ? parseInt(serviceData.salt) : undefined,
              alkalinity: serviceData.alkalinity ? parseInt(serviceData.alkalinity) : undefined,
              calcium: serviceData.calcium ? parseInt(serviceData.calcium) : undefined,
              cyanuric: serviceData.cyanuric ? parseInt(serviceData.cyanuric) : undefined
            }}
            unitType={unit.unit_type}
            waterType={unit.water_type}
          />
        </div>
      )}

      {/* Chemical Additions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Chemicals Added</h3>
          <button
            type="button"
            onClick={addChemical}
            className="inline-flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Chemical</span>
          </button>
        </div>

        {localData.chemicalAdditions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Plus className="h-6 w-6" />
            </div>
            <p>No chemicals added yet</p>
            <p className="text-sm">Click "Add Chemical" to record chemical additions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {localData.chemicalAdditions.map((chemical, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {/* Chemical Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chemical Type
                    </label>
                    <select
                      value={chemical.chemicalType}
                      onChange={(e) => updateChemical(index, 'chemicalType', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                    >
                      <option value="">Select chemical</option>
                      {CHEMICAL_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={chemical.quantity}
                      onChange={(e) => updateChemical(index, 'quantity', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                      placeholder="0.0"
                    />
                  </div>

                  {/* Unit of Measure */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <select
                      value={chemical.unitOfMeasure}
                      onChange={(e) => updateChemical(index, 'unitOfMeasure', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                    >
                      {UNITS_OF_MEASURE.map((unit) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Remove Button */}
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeChemical(index)}
                    className="inline-flex items-center space-x-1 text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skip Option */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> Chemical additions are optional. You can skip this step if no chemicals were added.
        </p>
      </div>
    </div>
  )
}








