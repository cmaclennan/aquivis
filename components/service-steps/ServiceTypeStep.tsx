'use client'

import { useState } from 'react'
import { Calendar, User, Droplets, Building2, Thermometer } from 'lucide-react'

interface ServiceData {
  serviceType: string
  technicianId: string
  serviceDate: string
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

interface Technician {
  id: string
  first_name: string
  last_name: string
}

interface Props {
  serviceData: ServiceData
  updateServiceData: (updates: Partial<ServiceData>) => void
  technicians: Technician[]
  unit: Unit
}

const SERVICE_TYPES = [
  {
    id: 'full_service',
    title: 'Full Service',
    description: 'Complete service including water test, chemicals, cleaning, and equipment check',
    icon: Droplets,
    color: 'bg-blue-500'
  },
  {
    id: 'test_only',
    title: 'Test Only',
    description: 'Quick water test and basic check - no chemicals or cleaning',
    icon: Thermometer,
    color: 'bg-green-500'
  },
  {
    id: 'equipment_check',
    title: 'Equipment Check',
    description: 'Focus on equipment status and maintenance tasks',
    icon: Building2,
    color: 'bg-orange-500'
  },
  {
    id: 'plant_room_check',
    title: 'Plant Room Check',
    description: 'Commercial plant room monitoring and equipment status',
    icon: Building2,
    color: 'bg-purple-500'
  }
]

export default function ServiceTypeStep({ serviceData, updateServiceData, technicians, unit }: Props) {
  const [localData, setLocalData] = useState({
    serviceType: serviceData.serviceType,
    technicianId: serviceData.technicianId,
    serviceDate: serviceData.serviceDate
  })

  const handleChange = (field: string, value: any) => {
    const updates = { [field]: value }
    setLocalData(prev => ({ ...prev, ...updates }))
    updateServiceData(updates)
  }

  // Correct unit type classification
  const isSpa = unit.unit_type === 'rooftop_spa' || unit.unit_type === 'main_spa'
  const isPool = unit.unit_type === 'villa_pool' || unit.unit_type === 'plunge_pool' || 
                 unit.unit_type === 'main_pool' || unit.unit_type === 'kids_pool' || 
                 unit.unit_type === 'residential_pool'
  const isSharedFacility = unit.unit_type === 'main_pool' || unit.unit_type === 'kids_pool' || 
                          unit.unit_type === 'main_spa' || unit.unit_type === 'residential_pool'

  // Filter service types based on unit type
  const getAvailableServiceTypes = () => {
    if (isSpa) {
      // Spa units: Full Service and Test Only only
      return SERVICE_TYPES.filter(type => 
        type.id === 'full_service' || type.id === 'test_only'
      )
    } else if (isPool) {
      // Pool units: Full Service, Test Only, and Equipment Check
      return SERVICE_TYPES.filter(type => 
        type.id === 'full_service' || type.id === 'test_only' || type.id === 'equipment_check'
      )
    }
    return SERVICE_TYPES
  }

  const availableServiceTypes = getAvailableServiceTypes()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Type</h2>
        <p className="text-gray-600">
          What type of service are you performing for {unit.name}?
        </p>
      </div>

      {/* Service Type Selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Service Type *
        </label>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {availableServiceTypes.map((serviceType) => {
            const Icon = serviceType.icon
            return (
              <button
                key={serviceType.id}
                type="button"
                onClick={() => handleChange('serviceType', serviceType.id)}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  localData.serviceType === serviceType.id
                    ? 'border-primary bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${serviceType.color} ${
                    localData.serviceType === serviceType.id ? 'ring-2 ring-primary ring-offset-2' : ''
                  }`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-2">{serviceType.title}</h3>
                    <p className="text-sm text-gray-600">{serviceType.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Service Date */}
      <div className="mb-6">
        <label htmlFor="serviceDate" className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="h-4 w-4 inline mr-2" />
          Service Date *
        </label>
        <input
          type="date"
          id="serviceDate"
          value={localData.serviceDate}
          onChange={(e) => handleChange('serviceDate', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
          required
        />
      </div>

      {/* Technician Assignment */}
      <div className="mb-6">
        <label htmlFor="technician" className="block text-sm font-medium text-gray-700 mb-2">
          <User className="h-4 w-4 inline mr-2" />
          Assigned Technician
        </label>
        <select
          id="technician"
          value={localData.technicianId}
          onChange={(e) => handleChange('technicianId', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
        >
          <option value="">Unassigned</option>
          {technicians.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.first_name} {tech.last_name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Optional - can be assigned later
        </p>
      </div>

      {/* Unit Information Display */}
      <div className="rounded-lg bg-gray-50 p-6">
        <h3 className="font-medium text-gray-900 mb-4">Unit Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Unit:</span>
            <span className="ml-2 font-medium">{unit.name}</span>
          </div>
          <div>
            <span className="text-gray-600">Type:</span>
            <span className="ml-2 font-medium capitalize">{unit.unit_type.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="text-gray-600">Water Type:</span>
            <span className="ml-2 font-medium capitalize">{unit.water_type}</span>
          </div>
          <div>
            <span className="text-gray-600">Property:</span>
            <span className="ml-2 font-medium">{unit.property.name}</span>
          </div>
        </div>
        
        {/* Spa vs Pool Indicator */}
        <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${isSpa ? 'bg-purple-500' : 'bg-blue-500'}`} />
            <span className="text-sm font-medium text-gray-900">
              {isSpa ? 'Spa Service' : 'Pool Service'} - {isSpa ? 'Simplified form for spa maintenance' : 'Full parameter testing and maintenance'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
