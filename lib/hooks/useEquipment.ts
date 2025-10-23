'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useEquipment(filters?: {
  propertyId?: string
  unitId?: string
  equipmentType?: string
  status?: string
}) {
  return useQuery({
    queryKey: ['equipment', 'list', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.propertyId) params.set('propertyId', filters.propertyId)
      if (filters?.unitId) params.set('unitId', filters.unitId)
      if (filters?.equipmentType) params.set('equipmentType', filters.equipmentType)
      if (filters?.status) params.set('status', filters.status)

      const res = await fetch(`/api/equipment${params.toString() ? `?${params.toString()}` : ''}`, { method: 'GET' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to load equipment')
      return json.equipment || []
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useEquipmentDetail(equipmentId: string | null) {
  return useQuery({
    queryKey: ['equipment', 'detail', equipmentId],
    queryFn: async () => {
      if (!equipmentId) return null
      const res = await fetch(`/api/equipment/${equipmentId}`, { method: 'GET' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to load equipment')
      return json.equipment || null
    },
    enabled: !!equipmentId,
    staleTime: 10 * 60 * 1000,
  })
}

export function useEquipmentFailures(equipmentId: string | null) {
  return useQuery({
    queryKey: ['equipment', 'failures', equipmentId],
    queryFn: async () => {
      if (!equipmentId) return []
      const res = await fetch(`/api/equipment/${equipmentId}/failures`, { method: 'GET' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to load failures')
      return json.failures || []
    },
    enabled: !!equipmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useEquipmentFailureSummary(equipmentId: string | null) {
  return useQuery({
    queryKey: ['equipment', 'failure-summary', equipmentId],
    queryFn: async () => {
      if (!equipmentId) return null
      const res = await fetch(`/api/equipment/${equipmentId}/failures/summary`, { method: 'GET' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to load failure summary')
      return json.summary || null
    },
    enabled: !!equipmentId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useEquipmentMaintenance(equipmentId: string | null) {
  return useQuery({
    queryKey: ['equipment', 'maintenance', equipmentId],
    queryFn: async () => {
      if (!equipmentId) return []
      const res = await fetch(`/api/equipment/${equipmentId}/maintenance`, { method: 'GET' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to load maintenance logs')
      return json.logs || []
    },
    enabled: !!equipmentId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateEquipmentFailure() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (failureData: any) => {
      if (!failureData?.equipment_id) throw new Error('equipment_id required')
      const res = await fetch(`/api/equipment/${failureData.equipment_id}/failures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(failureData),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to create failure')
      return json.failure
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['equipment', 'failures', data.equipment_id] })
      queryClient.invalidateQueries({ queryKey: ['equipment', 'failure-summary', data.equipment_id] })
      queryClient.invalidateQueries({ queryKey: ['equipment', 'detail', data.equipment_id] })
    },
  })
}

export function useUpdateEquipmentFailure() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, equipmentId, updates }: { id: string; equipmentId: string; updates: any }) => {
      const res = await fetch(`/api/equipment/${equipmentId}/failures/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to update failure')
      return json.failure
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equipment', 'failures', variables.equipmentId] })
      queryClient.invalidateQueries({ queryKey: ['equipment', 'failure-summary', variables.equipmentId] })
      queryClient.invalidateQueries({ queryKey: ['equipment', 'detail', variables.equipmentId] })
    },
  })
}

