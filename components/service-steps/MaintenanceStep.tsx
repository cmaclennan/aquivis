'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, Wrench, Droplets, Filter, Thermometer } from 'lucide-react'

interface ServiceData {
  maintenanceTasks: Array<{
    taskType: string
    completed: boolean
    notes: string
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

const MAINTENANCE_TASKS = [
  {
    id: 'skimmer_baskets',
    name: 'Clean Skimmer Baskets',
    description: 'Remove debris from skimmer baskets',
    icon: Droplets,
    required: true
  },
  {
    id: 'pool_vacuum',
    name: 'Vacuum Pool/Spa',
    description: 'Vacuum bottom and sides for debris',
    icon: Droplets,
    required: true
  },
  {
    id: 'filter_cleaning',
    name: 'Clean Filter',
    description: 'Backwash or clean filter media',
    icon: Filter,
    required: true
  },
  {
    id: 'tile_cleaning',
    name: 'Clean Waterline Tiles',
    description: 'Remove scale and buildup from waterline',
    icon: Wrench,
    required: false
  },
  {
    id: 'equipment_check',
    name: 'Check Equipment',
    description: 'Inspect pump, heater, and other equipment',
    icon: Wrench,
    required: true
  },
  {
    id: 'chemical_storage',
    name: 'Check Chemical Storage',
    description: 'Ensure chemicals are properly stored',
    icon: Wrench,
    required: false
  },
  {
    id: 'safety_equipment',
    name: 'Check Safety Equipment',
    description: 'Inspect safety equipment and signage',
    icon: Wrench,
    required: false
  },
  {
    id: 'water_level',
    name: 'Check Water Level',
    description: 'Ensure proper water level',
    icon: Droplets,
    required: true
  }
]

export default function MaintenanceStep({ serviceData, updateServiceData, unit }: Props) {
  const [localData, setLocalData] = useState(serviceData.maintenanceTasks)

  // Correct unit type classification
  const isSpa = unit.unit_type === 'rooftop_spa' || unit.unit_type === 'main_spa'
  const isPool = unit.unit_type === 'villa_pool' || unit.unit_type === 'plunge_pool' || 
                 unit.unit_type === 'main_pool' || unit.unit_type === 'kids_pool' || 
                 unit.unit_type === 'residential_pool'

  // Filter maintenance tasks based on unit type
  const getAvailableTasks = useCallback(() => {
    if (isSpa) {
      // Spa-specific tasks
      return MAINTENANCE_TASKS.filter(task => 
        task.id === 'pool_vacuum' || // Spa cleaning
        task.id === 'equipment_check' || // Spa equipment
        task.id === 'water_level' // Water level check
      )
    } else if (isPool) {
      // Pool-specific tasks (all tasks)
      return MAINTENANCE_TASKS
    }
    return MAINTENANCE_TASKS
  }, [isSpa, isPool])

  const initializeTasks = useCallback(() => {
    if (localData.length === 0) {
      const availableTasks = getAvailableTasks()
      const tasks = availableTasks.map(task => ({
        taskType: task.id,
        completed: false,
        notes: ''
      }))
      setLocalData(tasks)
      updateServiceData({ maintenanceTasks: tasks })
    }
  }, [localData.length, updateServiceData, getAvailableTasks])

  const updateTask = (index: number, field: string, value: any) => {
    const updated = localData.map((task, i) => 
      i === index ? { ...task, [field]: value } : task
    )
    setLocalData(updated)
    updateServiceData({ maintenanceTasks: updated })
  }

  const toggleTask = (index: number) => {
    updateTask(index, 'completed', !localData[index].completed)
  }

  const getTaskInfo = (taskType: string) => {
    return MAINTENANCE_TASKS.find(task => task.id === taskType)
  }

  const getCompletedCount = () => {
    return localData.filter(task => task.completed).length
  }

  const getRequiredTasks = () => {
    return localData.filter(task => {
      const taskInfo = getTaskInfo(task.taskType)
      return taskInfo?.required
    })
  }

  const getRequiredCompletedCount = () => {
    return getRequiredTasks().filter(task => task.completed).length
  }

  const getRequiredTotalCount = () => {
    return getRequiredTasks().length
  }

  // Initialize tasks if empty - use useEffect to avoid render-time state updates
  useEffect(() => {
    if (localData.length === 0) {
      initializeTasks()
    }
  }, [localData.length, initializeTasks]) // Include dependencies

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Maintenance Tasks</h2>
        <p className="text-gray-600">
          Complete maintenance tasks for {unit.name}
        </p>
        {isSpa && (
          <div className="mt-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-sm font-medium text-purple-900">
                Spa Service - Focus on spa-specific maintenance
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progress Summary */}
      <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-blue-900">Progress Summary</h3>
            <p className="text-sm text-blue-700">
              {getCompletedCount()} of {localData.length} tasks completed
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-900">
              {Math.round((getCompletedCount() / localData.length) * 100)}%
            </div>
            <div className="text-xs text-blue-700">Complete</div>
          </div>
        </div>
        <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(getCompletedCount() / localData.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Required Tasks Warning */}
      {getRequiredCompletedCount() < getRequiredTotalCount() && (
        <div className="mb-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-900">
              {getRequiredTotalCount() - getRequiredCompletedCount()} required tasks remaining
            </span>
          </div>
          <p className="mt-1 text-sm text-yellow-700">
            Complete all required tasks before finishing the service
          </p>
        </div>
      )}

      {/* Maintenance Tasks */}
      <div className="space-y-4">
        {localData.map((task, index) => {
          const taskInfo = getTaskInfo(task.taskType)
          if (!taskInfo) return null

          const Icon = taskInfo.icon

          return (
            <div key={index} className={`p-4 rounded-lg border transition-colors ${
              task.completed 
                ? 'border-green-200 bg-green-50' 
                : 'border-gray-200 bg-white'
            }`}>
              <div className="flex items-start space-x-4">
                <button
                  type="button"
                  onClick={() => toggleTask(index)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    task.completed
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 hover:border-primary'
                  }`}
                >
                  {task.completed && <CheckCircle className="h-4 w-4" />}
                </button>

                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <h3 className={`font-medium ${
                      task.completed ? 'text-green-900 line-through' : 'text-gray-900'
                    }`}>
                      {taskInfo.name}
                    </h3>
                    {taskInfo.required && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        Required
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    {taskInfo.description}
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={task.notes}
                      onChange={(e) => updateTask(index, 'notes', e.target.value)}
                      placeholder="Add any notes about this task..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200 text-sm"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 p-4 rounded-lg bg-gray-50 border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              const updated = localData.map(task => ({ ...task, completed: true }))
              setLocalData(updated)
              updateServiceData({ maintenanceTasks: updated })
            }}
            className="p-3 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
          >
            Mark All Complete
          </button>
          <button
            type="button"
            onClick={() => {
              const updated = localData.map(task => ({ ...task, completed: false }))
              setLocalData(updated)
              updateServiceData({ maintenanceTasks: updated })
            }}
            className="p-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Mark All Incomplete
          </button>
        </div>
      </div>

      {/* Skip Option */}
      <div className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="skipMaintenance"
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label htmlFor="skipMaintenance" className="text-sm text-gray-700">
            Skip maintenance tasks (no maintenance performed)
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          You can still complete the service without maintenance tasks
        </p>
      </div>
    </div>
  )
}
