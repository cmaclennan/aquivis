'use client'

import { useState } from 'react'
import { Calendar, User, Droplets, Building2 } from 'lucide-react'

interface ServiceData {
  serviceType: 'test_only' | 'full_service' | 'equipment_check' | 'plant_room_check'
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

export default function Step1ServiceType({ serviceData, updateServiceData, technicians, unit }: Props) {
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

  const isSpa = unit.unit_type.includes('spa')
  const isPool = unit.unit_type.includes('pool')

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Service Type</h2>
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
          {/* Full Service */}
          <button
            type="button"
            onClick={() => handleChange('serviceType', 'full_service')}
            className={`p-4 rounded-lg border-2 transition-all ${
              localData.serviceType === 'full_service'
                ? 'border-primary bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                localData.serviceType === 'full_service' ? 'bg-primary' : 'bg-gray-100'
              }`}>
                <Droplets className={`h-5 w-5 ${
                  localData.serviceType === 'full_service' ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-gray-900">Full Service</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Complete service including water test, chemicals, cleaning, and equipment check
                </p>
              </div>
            </div>
          </button>

          {/* Test Only */}
          <button
            type="button"
            onClick={() => handleChange('serviceType', 'test_only')}
            className={`p-4 rounded-lg border-2 transition-all ${
              localData.serviceType === 'test_only'
                ? 'border-primary bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                localData.serviceType === 'test_only' ? 'bg-primary' : 'bg-gray-100'
              }`}>
                <Droplets className={`h-5 w-5 ${
                  localData.serviceType === 'test_only' ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-gray-900">Test Only</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Quick water test and basic check - no chemicals or cleaning
                </p>
              </div>
            </div>
          </button>

          {/* Equipment Check */}
          <button
            type="button"
            onClick={() => handleChange('serviceType', 'equipment_check')}
            className={`p-4 rounded-lg border-2 transition-all ${
              localData.serviceType === 'equipment_check'
                ? 'border-primary bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                localData.serviceType === 'equipment_check' ? 'bg-primary' : 'bg-gray-100'
              }`}>
                <Building2 className={`h-5 w-5 ${
                  localData.serviceType === 'equipment_check' ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-gray-900">Equipment Check</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Focus on equipment status and maintenance tasks
                </p>
              </div>
            </div>
          </button>

          {/* Plant Room Check */}
          <button
            type="button"
            onClick={() => handleChange('serviceType', 'plant_room_check')}
            className={`p-4 rounded-lg border-2 transition-all ${
              localData.serviceType === 'plant_room_check'
                ? 'border-primary bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                localData.serviceType === 'plant_room_check' ? 'bg-primary' : 'bg-gray-100'
              }`}>
                <Building2 className={`h-5 w-5 ${
                  localData.serviceType === 'plant_room_check' ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-gray-900">Plant Room Check</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Commercial plant room monitoring and equipment status
                </p>
              </div>
            </div>
          </button>
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
      <div className="rounded-lg bg-gray-50 p-4">
        <h3 className="font-medium text-gray-900 mb-2">Unit Information</h3>
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
      </div>
    </div>
  )
}








