'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft, Plus, Calendar, User, Droplets, AlertTriangle, CheckCircle, Edit, Trash2 } from 'lucide-react'

interface Service {
  id: string
  service_date: string
  service_type: string
  status: string
  technician_name: string
  unit_name: string
  unit_type: string
  property_name: string
  all_parameters_ok: boolean | null
  company_id: string
}

export default function ServicesPage() {
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  // Use React Query for caching and performance
  const { data: services = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!profile?.company_id) throw new Error('No company found')

      const { data, error } = await supabase
        .from('services_optimized')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('service_date', { ascending: false })
        .limit(50)

      if (error) throw error
      
      // Data is already normalized from the optimized view
      return (data || []) as Service[]
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  if (queryError) {
    setError(queryError.message)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <Droplets className="h-4 w-4 text-blue-600" />
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-gray-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'in_progress':
        return 'text-blue-600 bg-blue-50'
      case 'scheduled':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-yellow-600 bg-yellow-50'
    }
  }

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'test_only':
        return 'Water Test Only'
      case 'full_service':
        return 'Full Service'
      case 'equipment_check':
        return 'Equipment Check'
      case 'plant_room_check':
        return 'Plant Room Check'
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)

      if (error) throw error

      // Reload services
      refetch()
    } catch (err: any) {
      console.error('Delete error:', err)
      alert('Failed to delete service: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading services...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Services</h1>
            <p className="mt-2 text-gray-600">
              Manage water testing and service records
            </p>
          </div>
          <Link
            href="/services/new-guided"
            className="inline-flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-600 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Service</span>
          </Link>
        </div>
      </div>

      {/* Services List */}
      {error ? (
        <div className="rounded-lg bg-error-light p-4 text-sm text-error">
          {error}
        </div>
      ) : services.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <Droplets className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">No services yet</p>
            <p className="text-xs text-gray-500 mt-1">Add your first service to get started</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="group block rounded-xl border border-[#bbc3c4] bg-white p-6 shadow-md hover:border-primary hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between">
                <Link
                  href={`/services/${service.id}`}
                  className="flex-1"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    {getStatusIcon(service.status)}
                    <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      {getServiceTypeLabel(service.service_type)}
                    </h3>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(service.status)}`}>
                      {service.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Property:</span>
                      <span>{service.property_name || 'Unknown'}</span>
                    </div>
                    
                    {service.unit_name && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Unit:</span>
                        <span>{service.unit_name} ({service.unit_type.replace('_', ' ')})</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{service.technician_name || 'Unassigned'}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(service.service_date).toLocaleDateString('en-AU')}</span>
                    </div>
                  </div>
                  
                  {service.all_parameters_ok !== null && (
                    <div className="mt-3 flex items-center space-x-2">
                      {service.all_parameters_ok ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm text-gray-600">
                        Water test: {service.all_parameters_ok ? 'All parameters OK' : 'Issues detected'}
                      </span>
                    </div>
                  )}
                </Link>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  <Link
                    href={`/services/${service.id}/edit`}
                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit Service"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Service"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
