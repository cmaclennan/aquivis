'use client'

import { useState } from 'react'
import { Plus, Trash2, CheckCircle, AlertTriangle, Clock } from 'lucide-react'

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
  { value: 'skimmer_baskets', label: 'Clean Skimmer Baskets' },
  { value: 'pump_basket', label: 'Clean Pump Basket' },
  { value: 'filter_cleaning', label: 'Filter Cleaning/Backwash' },
  { value: 'vacuum_pool', label: 'Vacuum Pool' },
  { value: 'brush_walls', label: 'Brush Pool Walls' },
  { value: 'skim_surface', label: 'Skim Surface Debris' },
  { value: 'check_equipment', label: 'Check Equipment Operation' },
  { value: 'test_water', label: 'Test Water Chemistry' },
  { value: 'add_chemicals', label: 'Add Chemicals' },
  { value: 'check_safety', label: 'Check Safety Equipment' },
  { value: 'clean_area', label: 'Clean Pool Area' },
  { value: 'inspect_tiles', label: 'Inspect Tiles/Grout' },
  { value: 'check_lighting', label: 'Check Underwater Lighting' },
  { value: 'inspect_covers', label: 'Inspect Pool Covers' },
  { value: 'other', label: 'Other Task' }
]

export default function Step4MaintenanceTasks({ serviceData, updateServiceData, unit }: Props) {
  const [localData, setLocalData] = useState({
    maintenanceTasks: serviceData.maintenanceTasks || []
  })

  const handleChange = (updates: any) => {
    setLocalData(prev => ({ ...prev, ...updates }))
    updateServiceData({ maintenanceTasks: localData.maintenanceTasks })
  }

  const addTask = () => {
    const newTask = {
      taskType: '',
      completed: false,
      notes: ''
    }
    const updatedTasks = [...localData.maintenanceTasks, newTask]
    setLocalData(prev => ({ ...prev, maintenanceTasks: updatedTasks }))
    updateServiceData({ maintenanceTasks: updatedTasks })
  }

  const updateTask = (index: number, field: string, value: any) => {
    const updatedTasks = [...localData.maintenanceTasks]
    updatedTasks[index] = { ...updatedTasks[index], [field]: value }
    setLocalData(prev => ({ ...prev, maintenanceTasks: updatedTasks }))
    updateServiceData({ maintenanceTasks: updatedTasks })
  }

  const removeTask = (index: number) => {
    const updatedTasks = localData.maintenanceTasks.filter((_, i) => i !== index)
    setLocalData(prev => ({ ...prev, maintenanceTasks: updatedTasks }))
    updateServiceData({ maintenanceTasks: updatedTasks })
  }

  const toggleTaskCompletion = (index: number) => {
    updateTask(index, 'completed', !localData.maintenanceTasks[index].completed)
  }

  const completedTasks = localData.maintenanceTasks.filter(task => task.completed).length
  const totalTasks = localData.maintenanceTasks.length

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Maintenance Tasks</h2>
        <p className="text-gray-600">
          Record the maintenance tasks performed for {unit.name}
        </p>
      </div>

      {/* Progress Summary */}
      {totalTasks > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-900">Task Progress</span>
            </div>
            <span className="text-sm text-gray-600">
              {completedTasks} of {totalTasks} completed
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Maintenance Tasks List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Tasks Performed</h3>
          <button
            type="button"
            onClick={addTask}
            className="inline-flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </button>
        </div>

        {localData.maintenanceTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Plus className="h-6 w-6" />
            </div>
            <p>No tasks recorded yet</p>
            <p className="text-sm">Click "Add Task" to record maintenance tasks</p>
          </div>
        ) : (
          <div className="space-y-3">
            {localData.maintenanceTasks.map((task, index) => (
              <div key={index} className={`border rounded-lg p-4 transition-colors ${
                task.completed 
                  ? 'border-success bg-success-50' 
                  : 'border-gray-200 bg-white'
              }`}>
                <div className="flex items-start space-x-3">
                  {/* Completion Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleTaskCompletion(index)}
                    className={`mt-1 flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                      task.completed
                        ? 'border-success bg-success text-white'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {task.completed && <CheckCircle className="h-3 w-3" />}
                  </button>

                  {/* Task Details */}
                  <div className="flex-1 space-y-3">
                    {/* Task Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Task Type
                      </label>
                      <select
                        value={task.taskType}
                        onChange={(e) => updateTask(index, 'taskType', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                      >
                        <option value="">Select task</option>
                        {MAINTENANCE_TASKS.map((taskType) => (
                          <option key={taskType.value} value={taskType.value}>
                            {taskType.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Task Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes (optional)
                      </label>
                      <textarea
                        value={task.notes}
                        onChange={(e) => updateTask(index, 'notes', e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                        placeholder="Add any additional details..."
                      />
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeTask(index)}
                    className="mt-1 text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Completion Status */}
                {task.completed && (
                  <div className="mt-3 flex items-center space-x-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Task Completed</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Task Templates */}
      <div className="mt-6">
        <h4 className="font-medium text-gray-900 mb-3">Quick Add Common Tasks</h4>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {['skimmer_baskets', 'pump_basket', 'filter_cleaning', 'vacuum_pool', 'brush_walls', 'test_water'].map((taskType) => {
            const task = MAINTENANCE_TASKS.find(t => t.value === taskType)
            return (
              <button
                key={taskType}
                type="button"
                onClick={() => {
                  const newTask = {
                    taskType: taskType,
                    completed: false,
                    notes: ''
                  }
                  const updatedTasks = [...localData.maintenanceTasks, newTask]
                  setLocalData(prev => ({ ...prev, maintenanceTasks: updatedTasks }))
                  updateServiceData({ maintenanceTasks: updatedTasks })
                }}
                className="p-3 text-left rounded-lg border border-gray-200 hover:border-primary hover:bg-primary-50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900">{task?.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Skip Option */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> Maintenance tasks are optional. You can skip this step if no maintenance was performed.
        </p>
      </div>
    </div>
  )
}








