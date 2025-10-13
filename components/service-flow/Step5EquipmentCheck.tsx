'use client'

import { useState } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Wrench, Gauge } from 'lucide-react'

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

const EQUIPMENT_ITEMS = [
  { id: 'pump', label: 'Pump Operation', description: 'Check pump is running smoothly' },
  { id: 'filter', label: 'Filter System', description: 'Check filter pressure and operation' },
  { id: 'heater', label: 'Heater (if applicable)', description: 'Check heater operation and temperature' },
  { id: 'lights', label: 'Underwater Lighting', description: 'Check all pool/spa lights' },
  { id: 'skimmers', label: 'Skimmers', description: 'Check skimmer operation and flow' },
  { id: 'returns', label: 'Return Jets', description: 'Check return jet flow and positioning' },
  { id: 'drains', label: 'Drains & Grates', description: 'Check main drain and safety grates' },
  { id: 'valves', label: 'Valves & Controls', description: 'Check all valves and control systems' },
  { id: 'safety', label: 'Safety Equipment', description: 'Check safety equipment and signage' },
  { id: 'area', label: 'Pool Area', description: 'Check deck, fencing, and surrounding area' }
]

export default function Step5EquipmentCheck({ serviceData, updateServiceData, unit }: Props) {
  const [localData, setLocalData] = useState({
    equipmentStatus: serviceData.equipmentStatus || 'normal',
    equipmentNotes: serviceData.equipmentNotes || ''
  })

  const [equipmentChecks, setEquipmentChecks] = useState<Record<string, 'normal' | 'warning' | 'fault'>>({})

  const handleChange = (field: string, value: any) => {
    const updates = { [field]: value }
    setLocalData(prev => ({ ...prev, ...updates }))
    updateServiceData(updates)
  }

  const updateEquipmentCheck = (itemId: string, status: 'normal' | 'warning' | 'fault') => {
    setEquipmentChecks(prev => ({ ...prev, [itemId]: status }))
  }

  const getStatusIcon = (status: 'normal' | 'warning' | 'fault') => {
    switch (status) {
      case 'normal':
        return <CheckCircle className="h-5 w-5 text-success" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />
      case 'fault':
        return <XCircle className="h-5 w-5 text-error" />
    }
  }

  const getStatusColor = (status: 'normal' | 'warning' | 'fault') => {
    switch (status) {
      case 'normal':
        return 'border-success bg-success-50'
      case 'warning':
        return 'border-warning bg-warning-50'
      case 'fault':
        return 'border-error bg-error-50'
    }
  }

  const getStatusLabel = (status: 'normal' | 'warning' | 'fault') => {
    switch (status) {
      case 'normal':
        return 'Normal'
      case 'warning':
        return 'Warning'
      case 'fault':
        return 'Fault'
    }
  }

  const overallStatus = Object.values(equipmentChecks).length > 0 
    ? Object.values(equipmentChecks).includes('fault') ? 'fault'
    : Object.values(equipmentChecks).includes('warning') ? 'warning'
    : 'normal'
    : localData.equipmentStatus

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Equipment Check</h2>
        <p className="text-gray-600">
          Check the equipment status for {unit.name}
        </p>
      </div>

      {/* Overall Status */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Overall Equipment Status
        </label>
        <div className="grid grid-cols-3 gap-4">
          {(['normal', 'warning', 'fault'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => handleChange('equipmentStatus', status)}
              className={`p-4 rounded-lg border-2 transition-all ${
                localData.equipmentStatus === status
                  ? getStatusColor(status)
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(status)}
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">{getStatusLabel(status)}</h3>
                  <p className="text-sm text-gray-600">
                    {status === 'normal' && 'All equipment operating normally'}
                    {status === 'warning' && 'Some equipment needs attention'}
                    {status === 'fault' && 'Equipment fault detected'}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Individual Equipment Checks */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center">
          <Wrench className="h-4 w-4 mr-2" />
          Equipment Items
        </h3>
        <div className="space-y-3">
          {EQUIPMENT_ITEMS.map((item) => {
            const currentStatus = equipmentChecks[item.id] || 'normal'
            return (
              <div key={item.id} className={`p-4 rounded-lg border ${getStatusColor(currentStatus)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.label}</h4>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(['normal', 'warning', 'fault'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateEquipmentCheck(item.id, status)}
                        className={`p-2 rounded-lg transition-colors ${
                          currentStatus === status
                            ? 'bg-white shadow-sm'
                            : 'hover:bg-white/50'
                        }`}
                      >
                        {getStatusIcon(status)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Equipment Notes */}
      <div className="mb-6">
        <label htmlFor="equipmentNotes" className="block text-sm font-medium text-gray-700 mb-2">
          Equipment Notes
        </label>
        <textarea
          id="equipmentNotes"
          value={localData.equipmentNotes}
          onChange={(e) => handleChange('equipmentNotes', e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
          placeholder="Add any notes about equipment status, issues found, or maintenance performed..."
        />
      </div>

      {/* Status Summary */}
      {Object.keys(equipmentChecks).length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Equipment Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>
                Normal: {Object.values(equipmentChecks).filter(s => s === 'normal').length}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span>
                Warning: {Object.values(equipmentChecks).filter(s => s === 'warning').length}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-error" />
              <span>
                Fault: {Object.values(equipmentChecks).filter(s => s === 'fault').length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Skip Option */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> Equipment check is optional. You can skip this step if no equipment inspection was performed.
        </p>
      </div>
    </div>
  )
}








