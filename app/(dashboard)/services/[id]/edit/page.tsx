'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'

interface Service {
  id: string
  service_date: string
  service_type: string
  status: string
  notes: string
  technician_id: string | null
  unit: {
    id: string
    name: string
    unit_type: string
  } | null
  property: {
    id: string
    name: string
  } | null
  water_tests: {
    id: string
    ph?: number
    chlorine?: number
    bromine?: number
    salt?: number
    alkalinity?: number
    calcium?: number
    cyanuric?: number
    is_pump_running?: boolean
    is_water_warm?: boolean
    is_filter_cleaned?: boolean
    all_parameters_ok: boolean
    notes?: string
  }[]
  chemical_additions: {
    id: string
    chemical_type: string
    quantity: number
    unit_of_measure: string
    cost: number
  }[]
  maintenance_tasks: {
    id: string
    task_type: string
    completed: boolean
    notes?: string
  }[]
}

interface Props {
  params: Promise<{ id: string }>
}

export default function EditServicePage({ params }: Props) {
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [serviceId, setServiceId] = useState<string>('')
  
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const loadService = useCallback(async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!profile?.company_id) throw new Error('No company found')

      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          unit:units(id, name, unit_type),
          property:properties(id, name),
          water_tests(*),
          chemical_additions(*),
          maintenance_tasks(*)
        `)
        .eq('id', id)
        .eq('property.company_id', profile.company_id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Service not found')

      setService(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    params.then((resolvedParams) => {
      setServiceId(resolvedParams.id)
      loadService(resolvedParams.id)
    })
  }, [params, loadService])

  const handleSave = async () => {
    if (!service) return

    try {
      setSaving(true)
      setError(null)

      // Update service
      const { error: serviceError } = await supabase
        .from('services')
        .update({
          service_date: service.service_date,
          service_type: service.service_type,
          status: service.status,
          notes: service.notes,
          technician_id: service.technician_id
        })
        .eq('id', service.id)

      if (serviceError) throw serviceError

      // Update water tests
      for (const waterTest of service.water_tests) {
        const { error: waterTestError } = await supabase
          .from('water_tests')
          .update({
            ph: waterTest.ph,
            chlorine: waterTest.chlorine,
            bromine: waterTest.bromine,
            salt: waterTest.salt,
            alkalinity: waterTest.alkalinity,
            calcium: waterTest.calcium,
            cyanuric: waterTest.cyanuric,
            is_pump_running: waterTest.is_pump_running,
            is_water_warm: waterTest.is_water_warm,
            is_filter_cleaned: waterTest.is_filter_cleaned,
            all_parameters_ok: waterTest.all_parameters_ok,
            notes: waterTest.notes
          })
          .eq('id', waterTest.id)

        if (waterTestError) throw waterTestError
      }

      // Update chemical additions
      for (const chemical of service.chemical_additions) {
        const { error: chemicalError } = await supabase
          .from('chemical_additions')
          .update({
            chemical_type: chemical.chemical_type,
            quantity: chemical.quantity,
            unit_of_measure: chemical.unit_of_measure,
            cost: chemical.cost
          })
          .eq('id', chemical.id)

        if (chemicalError) throw chemicalError
      }

      // Update maintenance tasks
      for (const task of service.maintenance_tasks) {
        const { error: taskError } = await supabase
          .from('maintenance_tasks')
          .update({
            task_type: task.task_type,
            completed: task.completed,
            notes: task.notes
          })
          .eq('id', task.id)

        if (taskError) throw taskError
      }

      router.push(`/services/${service.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!service) return

    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return
    }

    try {
      setSaving(true)
      setError(null)

      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', service.id)

      if (error) throw error

      router.push('/services')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading service...</div>
        </div>
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error || 'Service not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Service</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Service</h1>
            <p className="mt-2 text-gray-600">
              {service.property?.name} - {service.unit?.name}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Service
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Service Details */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Service Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Service Date</label>
              <input
                type="datetime-local"
                value={new Date(service.service_date).toISOString().slice(0, 16)}
                onChange={(e) => setService(prev => prev ? {
                  ...prev,
                  service_date: new Date(e.target.value).toISOString()
                } : null)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Service Type</label>
              <select
                value={service.service_type}
                onChange={(e) => setService(prev => prev ? {
                  ...prev,
                  service_type: e.target.value
                } : null)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="test_only">Water Test Only</option>
                <option value="full_service">Full Service</option>
                <option value="equipment_check">Equipment Check</option>
                <option value="plant_room_check">Plant Room Check</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={service.status}
                onChange={(e) => setService(prev => prev ? {
                  ...prev,
                  status: e.target.value
                } : null)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="skipped">Skipped</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={service.notes || ''}
                onChange={(e) => setService(prev => prev ? {
                  ...prev,
                  notes: e.target.value
                } : null)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Add any additional notes..."
              />
            </div>
          </div>
        </div>

        {/* Water Test Results */}
        {service.water_tests && service.water_tests.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Water Test Results</h2>
            
            <div className="space-y-4">
              {service.water_tests.map((waterTest, index) => (
                <div key={waterTest.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Test #{index + 1}</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">pH</label>
                      <input
                        type="number"
                        step="0.1"
                        value={waterTest.ph || ''}
                        onChange={(e) => {
                          const newWaterTests = [...service.water_tests]
                          newWaterTests[index] = {
                            ...newWaterTests[index],
                            ph: e.target.value ? parseFloat(e.target.value) : undefined
                          }
                          setService(prev => prev ? {
                            ...prev,
                            water_tests: newWaterTests
                          } : null)
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Chlorine (ppm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={waterTest.chlorine || ''}
                        onChange={(e) => {
                          const newWaterTests = [...service.water_tests]
                          newWaterTests[index] = {
                            ...newWaterTests[index],
                            chlorine: e.target.value ? parseFloat(e.target.value) : undefined
                          }
                          setService(prev => prev ? {
                            ...prev,
                            water_tests: newWaterTests
                          } : null)
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bromine (ppm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={waterTest.bromine || ''}
                        onChange={(e) => {
                          const newWaterTests = [...service.water_tests]
                          newWaterTests[index] = {
                            ...newWaterTests[index],
                            bromine: e.target.value ? parseFloat(e.target.value) : undefined
                          }
                          setService(prev => prev ? {
                            ...prev,
                            water_tests: newWaterTests
                          } : null)
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Salt (ppm)</label>
                      <input
                        type="number"
                        value={waterTest.salt || ''}
                        onChange={(e) => {
                          const newWaterTests = [...service.water_tests]
                          newWaterTests[index] = {
                            ...newWaterTests[index],
                            salt: e.target.value ? parseInt(e.target.value) : undefined
                          }
                          setService(prev => prev ? {
                            ...prev,
                            water_tests: newWaterTests
                          } : null)
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Test Notes</label>
                    <textarea
                      value={waterTest.notes || ''}
                      onChange={(e) => {
                        const newWaterTests = [...service.water_tests]
                        newWaterTests[index] = {
                          ...newWaterTests[index],
                          notes: e.target.value
                        }
                        setService(prev => prev ? {
                          ...prev,
                          water_tests: newWaterTests
                        } : null)
                      }}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      placeholder="Add test notes..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chemical Additions */}
        {service.chemical_additions && service.chemical_additions.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Chemical Additions</h2>
            
            <div className="space-y-4">
              {service.chemical_additions.map((chemical, index) => (
                <div key={chemical.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Chemical Type</label>
                      <input
                        type="text"
                        value={chemical.chemical_type}
                        onChange={(e) => {
                          const newChemicals = [...service.chemical_additions]
                          newChemicals[index] = {
                            ...newChemicals[index],
                            chemical_type: e.target.value
                          }
                          setService(prev => prev ? {
                            ...prev,
                            chemical_additions: newChemicals
                          } : null)
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        step="0.01"
                        value={chemical.quantity}
                        onChange={(e) => {
                          const newChemicals = [...service.chemical_additions]
                          newChemicals[index] = {
                            ...newChemicals[index],
                            quantity: parseFloat(e.target.value)
                          }
                          setService(prev => prev ? {
                            ...prev,
                            chemical_additions: newChemicals
                          } : null)
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Unit of Measure</label>
                      <input
                        type="text"
                        value={chemical.unit_of_measure}
                        onChange={(e) => {
                          const newChemicals = [...service.chemical_additions]
                          newChemicals[index] = {
                            ...newChemicals[index],
                            unit_of_measure: e.target.value
                          }
                          setService(prev => prev ? {
                            ...prev,
                            chemical_additions: newChemicals
                          } : null)
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cost ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={chemical.cost}
                        onChange={(e) => {
                          const newChemicals = [...service.chemical_additions]
                          newChemicals[index] = {
                            ...newChemicals[index],
                            cost: parseFloat(e.target.value)
                          }
                          setService(prev => prev ? {
                            ...prev,
                            chemical_additions: newChemicals
                          } : null)
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Maintenance Tasks */}
        {service.maintenance_tasks && service.maintenance_tasks.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Maintenance Tasks</h2>
            
            <div className="space-y-4">
              {service.maintenance_tasks.map((task, index) => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={task.task_type}
                        onChange={(e) => {
                          const newTasks = [...service.maintenance_tasks]
                          newTasks[index] = {
                            ...newTasks[index],
                            task_type: e.target.value
                          }
                          setService(prev => prev ? {
                            ...prev,
                            maintenance_tasks: newTasks
                          } : null)
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={(e) => {
                          const newTasks = [...service.maintenance_tasks]
                          newTasks[index] = {
                            ...newTasks[index],
                            completed: e.target.checked
                          }
                          setService(prev => prev ? {
                            ...prev,
                            maintenance_tasks: newTasks
                          } : null)
                        }}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <textarea
                      value={task.notes || ''}
                      onChange={(e) => {
                        const newTasks = [...service.maintenance_tasks]
                        newTasks[index] = {
                          ...newTasks[index],
                          notes: e.target.value
                        }
                        setService(prev => prev ? {
                          ...prev,
                          maintenance_tasks: newTasks
                        } : null)
                      }}
                      rows={2}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      placeholder="Task notes..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}






