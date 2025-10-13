'use client'

import { useState } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Wrench, Droplets, Thermometer, Zap } from 'lucide-react'

interface ServiceData {
  equipmentStatus: 'normal' | 'warning' | 'fault'
  equipmentNotes: string
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

const EQUIPMENT_CHECKS = [
  {
    id: 'pump',
    name: 'Pump',
    description: 'Check pump operation, noise, and leaks',
    icon: Wrench,
    required: true
  },
  {
    id: 'filter',
    name: 'Filter',
    description: 'Check filter pressure and operation',
    icon: Wrench,
    required: true
  },
  {
    id: 'heater',
    name: 'Heater',
    description: 'Check heater operation and temperature',
    icon: Thermometer,
    required: false
  },
  {
    id: 'electrical',
    name: 'Electrical',
    description: 'Check electrical connections and safety',
    icon: Zap,
    required: true
  },
  {
    id: 'plumbing',
    name: 'Plumbing',
    description: 'Check for leaks and proper flow',
    icon: Droplets,
    required: true
  },
  {
    id: 'safety_equipment',
    name: 'Safety Equipment',
    description: 'Check safety equipment and signage',
    icon: Wrench,
    required: false
  }
]

const STATUS_OPTIONS = [
  {
    id: 'normal',
    name: 'Normal Operation',
    description: 'All equipment functioning properly',
    color: 'bg-green-500',
    icon: CheckCircle
  },
  {
    id: 'warning',
    name: 'Warning',
    description: 'Some issues detected, monitor closely',
    color: 'bg-yellow-500',
    icon: AlertTriangle
  },
  {
    id: 'fault',
    name: 'Fault Detected',
    description: 'Equipment failure or safety issue',
    color: 'bg-red-500',
    icon: XCircle
  }
]

export default function EquipmentStep({ serviceData, updateServiceData, unit }: Props) {
  const [localData, setLocalData] = useState({
    equipmentStatus: serviceData.equipmentStatus,
    equipmentNotes: serviceData.equipmentNotes
  })

  const [equipmentChecks, setEquipmentChecks] = useState<Record<string, boolean>>({})

  const handleChange = (field: string, value: any) => {
    const updates = { [field]: value }
    setLocalData(prev => ({ ...prev, ...updates }))
    updateServiceData(updates)
  }

  const handleEquipmentCheck = (equipmentId: string, checked: boolean) => {
    setEquipmentChecks(prev => ({ ...prev, [equipmentId]: checked }))
  }

  const isSpa = unit.unit_type.includes('spa')
  const isPool = unit.unit_type.includes('pool')

  const getStatusInfo = (status: string) => {
    return STATUS_OPTIONS.find(s => s.id === status)
  }

  const getCompletedCount = () => {
    return Object.values(equipmentChecks).filter(Boolean).length
  }

  const getRequiredCount = () => {
    return EQUIPMENT_CHECKS.filter(check => check.required).length
  }

  const getRequiredCompletedCount = () => {
    return EQUIPMENT_CHECKS.filter(check => 
      check.required && equipmentChecks[check.id]
    ).length
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Equipment Status</h2>
        <p className="text-gray-600">
          Check equipment status for {unit.name}
        </p>
        {isSpa && (
          <div className="mt-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-sm font-medium text-purple-900">
                Spa Service - Focus on spa equipment (heater, jets, etc.)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Equipment Status Selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Overall Equipment Status *
        </label>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STATUS_OPTIONS.map((status) => {
            const Icon = status.icon
            return (
              <button
                key={status.id}
                type="button"
                onClick={() => handleChange('equipmentStatus', status.id)}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  localData.equipmentStatus === status.id
                    ? 'border-primary bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${status.color} ${
                    localData.equipmentStatus === status.id ? 'ring-2 ring-primary ring-offset-2' : ''
                  }`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{status.name}</h3>
                    <p className="text-sm text-gray-600">{status.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Equipment Checks */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Equipment Checks</h3>
        <div className="space-y-4">
          {EQUIPMENT_CHECKS.map((check) => {
            const Icon = check.icon
            return (
              <div key={check.id} className="p-4 border border-gray-200 rounded-lg bg-white">
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => handleEquipmentCheck(check.id, !equipmentChecks[check.id])}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      equipmentChecks[check.id]
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    {equipmentChecks[check.id] && <CheckCircle className="h-4 w-4" />}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-5 w-5 text-gray-600" />
                      <h4 className="font-medium text-gray-900">{check.name}</h4>
                      {check.required && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{check.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Progress Summary */}
        <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">Equipment Check Progress</h4>
              <p className="text-sm text-blue-700">
                {getCompletedCount()} of {EQUIPMENT_CHECKS.length} checks completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">
                {Math.round((getCompletedCount() / EQUIPMENT_CHECKS.length) * 100)}%
              </div>
              <div className="text-xs text-blue-700">Complete</div>
            </div>
          </div>
          <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(getCompletedCount() / EQUIPMENT_CHECKS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Equipment Notes */}
      <div className="mb-8">
        <label htmlFor="equipmentNotes" className="block text-sm font-medium text-gray-700 mb-2">
          Equipment Notes
        </label>
        <textarea
          id="equipmentNotes"
          value={localData.equipmentNotes}
          onChange={(e) => handleChange('equipmentNotes', e.target.value)}
          placeholder="Add any notes about equipment status, issues, or maintenance needs..."
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
          rows={4}
        />
        <p className="mt-1 text-xs text-gray-500">
          Include details about any issues, maintenance performed, or recommendations
        </p>
      </div>

      {/* Status Warnings */}
      {localData.equipmentStatus === 'warning' && (
        <div className="mb-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-900">Warning Status</span>
          </div>
          <p className="mt-1 text-sm text-yellow-700">
            Equipment issues detected. Monitor closely and schedule maintenance if needed.
          </p>
        </div>
      )}

      {localData.equipmentStatus === 'fault' && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-900">Fault Detected</span>
          </div>
          <p className="mt-1 text-sm text-red-700">
            Equipment failure detected. Immediate attention required. Contact maintenance team.
          </p>
        </div>
      )}

      {/* Skip Option */}
      <div className="mt-8 p-4 rounded-lg bg-gray-50 border border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="skipEquipment"
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label htmlFor="skipEquipment" className="text-sm text-gray-700">
            Skip equipment check (no equipment inspection performed)
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          You can still complete the service without equipment inspection
        </p>
      </div>
    </div>
  )
}








