'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Calendar, User, Droplets, CheckCircle, AlertTriangle, Clock, ExternalLink } from 'lucide-react'

interface ServiceHistoryProps {
  unitId: string
  className?: string
}

interface Service {
  id: string
  service_date: string
  service_type: string
  status: string
  technician: {
    first_name: string
    last_name: string
  } | null
  water_tests: {
    all_parameters_ok: boolean
    ph?: number
    chlorine?: number
    bromine?: number
  }[] | null
}

export default function ServiceHistory({ unitId, className = '' }: ServiceHistoryProps) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    loadServiceHistory()
  }, [unitId])

  const loadServiceHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          id,
          service_date,
          service_type,
          status,
          technician:profiles!services_technician_id_fkey(first_name, last_name),
          water_tests(ph, chlorine, bromine, all_parameters_ok)
        `)
        .eq('unit_id', unitId)
        .order('service_date', { ascending: false })
        .limit(20)

      if (error) throw error
      setServices(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />
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

  const formatServiceDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getWaterTestSummary = (waterTest: any) => {
    if (!waterTest) return null
    
    const params = []
    if (waterTest.ph !== null) params.push(`pH: ${waterTest.ph}`)
    if (waterTest.chlorine !== null) params.push(`Cl: ${waterTest.chlorine}mg/L`)
    if (waterTest.bromine !== null) params.push(`Br: ${waterTest.bromine}mg/L`)
    
    return params.length > 0 ? params.join(', ') : 'No parameters tested'
  }

  if (loading) {
    return (
      <div className={`rounded-lg bg-white p-6 shadow ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-600">Loading service history...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`rounded-lg bg-white p-6 shadow ${className}`}>
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">Error loading service history</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-lg bg-white p-6 shadow ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Service History</h2>
        <Link
          href="/services"
          className="inline-flex items-center space-x-1 text-sm text-primary hover:text-primary-600 transition-colors"
        >
          <span>View All Services</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-8">
          <Droplets className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No services recorded yet</p>
          <p className="text-sm text-gray-500 mt-1">Services will appear here once they're created</p>
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/services/${service.id}`}
              className="group block rounded-lg border border-gray-200 p-4 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
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
                      <Calendar className="h-4 w-4" />
                      <span>{formatServiceDate(service.service_date)}</span>
                    </div>
                    
                    {service.technician && (
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{service.technician.first_name} {service.technician.last_name}</span>
                      </div>
                    )}
                    
                    {service.water_tests && service.water_tests.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Droplets className="h-4 w-4" />
                        <span className="text-xs">
                          {getWaterTestSummary(service.water_tests[0])}
                        </span>
                        {service.water_tests[0].all_parameters_ok ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-red-600" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
