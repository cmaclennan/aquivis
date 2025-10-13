'use client'

import { useState } from 'react'
import { Plus, Trash2, Droplets, AlertTriangle } from 'lucide-react'

interface ServiceData {
  chemicalAdditions: Array<{
    chemicalType: string
    quantity: number
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
  { id: 'chlorine', name: 'Chlorine', description: 'Sanitizer for pools' },
  { id: 'bromine', name: 'Bromine', description: 'Sanitizer for spas' },
  { id: 'ph_increase', name: 'pH Increase', description: 'Soda ash, sodium carbonate' },
  { id: 'ph_decrease', name: 'pH Decrease', description: 'Muriatic acid, sodium bisulfate' },
  { id: 'alkalinity_increase', name: 'Alkalinity Increase', description: 'Sodium bicarbonate' },
  { id: 'calcium_increase', name: 'Calcium Increase', description: 'Calcium chloride' },
  { id: 'cyanuric_acid', name: 'Cyanuric Acid', description: 'Stabilizer for chlorine' },
  { id: 'salt', name: 'Salt', description: 'For saltwater pools' },
  { id: 'shock', name: 'Shock Treatment', description: 'Calcium hypochlorite, sodium hypochlorite' },
  { id: 'algaecide', name: 'Algaecide', description: 'Prevents algae growth' },
  { id: 'clarifier', name: 'Clarifier', description: 'Improves water clarity' },
  { id: 'flocculant', name: 'Flocculant', description: 'Binds particles for removal' }
]

const UNITS_OF_MEASURE = [
  { id: 'grams', name: 'Grams (g)' },
  { id: 'kilograms', name: 'Kilograms (kg)' },
  { id: 'milliliters', name: 'Milliliters (ml)' },
  { id: 'liters', name: 'Liters (L)' },
  { id: 'cups', name: 'Cups' },
  { id: 'tablespoons', name: 'Tablespoons' },
  { id: 'teaspoons', name: 'Teaspoons' },
  { id: 'ounces', name: 'Ounces (oz)' },
  { id: 'pounds', name: 'Pounds (lb)' },
  { id: 'fluid_ounces', name: 'Fluid Ounces (fl oz)' },
  { id: 'pints', name: 'Pints (pt)' },
  { id: 'quarts', name: 'Quarts (qt)' },
  { id: 'gallons', name: 'Gallons (gal)' },
  { id: 'scoops', name: 'Scoops' },
  { id: 'tablets', name: 'Tablets' },
  { id: 'capsules', name: 'Capsules' },
  { id: 'bags', name: 'Bags' },
  { id: 'bottles', name: 'Bottles' }
]

export default function ChemicalStep({ serviceData, updateServiceData, unit }: Props) {
  const [localData, setLocalData] = useState(serviceData.chemicalAdditions)

  // Correct unit type classification
  const isSpa = unit.unit_type === 'rooftop_spa' || unit.unit_type === 'main_spa'
  const isPool = unit.unit_type === 'villa_pool' || unit.unit_type === 'plunge_pool' || 
                 unit.unit_type === 'main_pool' || unit.unit_type === 'kids_pool' || 
                 unit.unit_type === 'residential_pool'

  const addChemical = () => {
    const newChemical = {
      chemicalType: '',
      quantity: 0,
      unitOfMeasure: 'grams'
    }
    const updated = [...localData, newChemical]
    setLocalData(updated)
    updateServiceData({ chemicalAdditions: updated })
  }

  const updateChemical = (index: number, field: string, value: any) => {
    const updated = localData.map((chemical, i) => 
      i === index ? { ...chemical, [field]: value } : chemical
    )
    setLocalData(updated)
    updateServiceData({ chemicalAdditions: updated })
  }

  const removeChemical = (index: number) => {
    const updated = localData.filter((_, i) => i !== index)
    setLocalData(updated)
    updateServiceData({ chemicalAdditions: updated })
  }

  const getRecommendedChemicals = () => {
    if (isSpa) {
      return CHEMICAL_TYPES.filter(chem => 
        ['bromine', 'ph_increase', 'ph_decrease', 'alkalinity_increase', 'shock'].includes(chem.id)
      )
    } else {
      return CHEMICAL_TYPES.filter(chem => 
        ['chlorine', 'ph_increase', 'ph_decrease', 'alkalinity_increase', 'calcium_increase', 'cyanuric_acid', 'salt', 'shock', 'algaecide', 'clarifier', 'flocculant'].includes(chem.id)
      )
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Chemical Additions</h2>
        <p className="text-gray-600">
          Record any chemicals added during the service for {unit.name}
        </p>
        {isSpa && (
          <div className="mt-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-sm font-medium text-purple-900">
                Spa Service - Simplified chemical options
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Chemical Additions List */}
      <div className="space-y-4">
        {localData.map((chemical, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Chemical #{index + 1}</h3>
              <button
                type="button"
                onClick={() => removeChemical(index)}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chemical Type *
                </label>
                <select
                  value={chemical.chemicalType}
                  onChange={(e) => updateChemical(index, 'chemicalType', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                >
                  <option value="">Select chemical...</option>
                  {getRecommendedChemicals().map((chem) => (
                    <option key={chem.id} value={chem.id}>
                      {chem.name}
                    </option>
                  ))}
                </select>
                {chemical.chemicalType && (
                  <p className="mt-1 text-xs text-gray-500">
                    {getRecommendedChemicals().find(c => c.id === chemical.chemicalType)?.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={chemical.quantity}
                  onChange={(e) => updateChemical(index, 'quantity', parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="0.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit of Measure *
                </label>
                <select
                  value={chemical.unitOfMeasure}
                  onChange={(e) => updateChemical(index, 'unitOfMeasure', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                >
                  {UNITS_OF_MEASURE.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}

        {/* Add Chemical Button */}
        <button
          type="button"
          onClick={addChemical}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary-50 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="h-5 w-5 text-gray-400" />
          <span className="text-gray-600 font-medium">Add Chemical</span>
        </button>
      </div>

      {/* No Chemicals Added Option */}
      <div className="mt-8 p-4 rounded-lg bg-gray-50 border border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="noChemicals"
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label htmlFor="noChemicals" className="text-sm text-gray-700">
            No chemicals added during this service
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Check this if no chemical treatments were needed
        </p>
      </div>

      {/* Chemical Safety Reminder */}
      <div className="mt-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900 mb-1">Chemical Safety Reminder</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Always follow manufacturer instructions</li>
              <li>• Never mix different chemicals together</li>
              <li>• Add chemicals to water, not water to chemicals</li>
              <li>• Wait 15-30 minutes between different chemical additions</li>
              <li>• Test water after chemical additions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
