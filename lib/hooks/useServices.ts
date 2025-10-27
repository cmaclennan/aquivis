'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useServices(filters?: {
  propertyId?: string
  unitId?: string
  startDate?: string
  endDate?: string
  serviceType?: string
  status?: string
  limit?: number
}) {
  return useQuery({
    queryKey: ['services', 'list', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.propertyId) params.set('propertyId', filters.propertyId)
      if (filters?.unitId) params.set('unitId', filters.unitId)
      if (filters?.startDate) params.set('startDate', filters.startDate)
      if (filters?.endDate) params.set('endDate', filters.endDate)
      if (filters?.serviceType) params.set('serviceType', filters.serviceType)
      if (filters?.status) params.set('status', filters.status)
      if (filters?.limit) params.set('limit', String(filters.limit))

      const res = await fetch(`/api/services${params.toString() ? `?${params.toString()}` : ''}`, { method: 'GET' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to load services')
      return json.services || []
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

export function useService(serviceId: string | null) {
  return useQuery({
    queryKey: ['services', 'detail', serviceId],
    queryFn: async () => {
      if (!serviceId) return null
      const res = await fetch(`/api/services/${serviceId}`, { method: 'GET' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to load service')
      return json.service || null
    },
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes (service details don't change often)
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (serviceData: any) => {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to create service')
      return json.service
    },
    onSuccess: () => {
      // Invalidate and refetch services list
      queryClient.invalidateQueries({ queryKey: ['services', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['services', 'recent'] })
      queryClient.invalidateQueries({ queryKey: ['services', 'upcoming'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
    },
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to update service')
      return json.service
    },
    onSuccess: (data) => {
      // Invalidate specific service and lists
      queryClient.invalidateQueries({ queryKey: ['services', 'detail', data.id] })
      queryClient.invalidateQueries({ queryKey: ['services', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['services', 'recent'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
    },
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (serviceId: string) => {
      const res = await fetch(`/api/services/${serviceId}`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to delete service')
      return serviceId
    },
    onSuccess: () => {
      // Invalidate all service queries
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
    },
  })
}

