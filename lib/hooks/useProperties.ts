'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useProperties(filters?: {
  customerId?: string
  search?: string
  limit?: number
}) {
  return useQuery({
    queryKey: ['properties', 'list', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.customerId) params.set('customerId', filters.customerId)
      if (filters?.search) params.set('search', filters.search)
      if (filters?.limit) params.set('limit', String(filters.limit))

      const res = await fetch(`/api/properties${params.toString() ? `?${params.toString()}` : ''}`, { method: 'GET' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to load properties')
      return json.properties || []
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (properties don't change often)
  })
}

export function useProperty(propertyId: string | null) {
  return useQuery({
    queryKey: ['properties', 'detail', propertyId],
    queryFn: async () => {
      if (!propertyId) return null
      const res = await fetch(`/api/properties/${propertyId}`, { method: 'GET' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to load property')
      return json.property || null
    },
    enabled: !!propertyId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useCreateProperty() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (propertyData: any) => {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyData),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to create property')
      return json.property
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
    },
  })
}

export function useUpdateProperty() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to update property')
      return json.property
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['properties', 'detail', data.id] })
      queryClient.invalidateQueries({ queryKey: ['properties', 'list'] })
    },
  })
}

