'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useEquipment(filters?: {
  propertyId?: string
  unitId?: string
  equipmentType?: string
  status?: string
}) {
  return useQuery({
    queryKey: ['equipment', 'list', filters],
    queryFn: async () => {
      const supabase = createClient()
      
      let query = supabase
        .from('equipment')
        .select(`
          id,
          name,
          equipment_type,
          manufacturer,
          model,
          serial_number,
          status,
          install_date,
          properties(id, name),
          units(id, name),
          plant_rooms(id, name)
        `)
        .order('name', { ascending: true })
      
      if (filters?.propertyId) {
        query = query.eq('property_id', filters.propertyId)
      }
      
      if (filters?.unitId) {
        query = query.eq('unit_id', filters.unitId)
      }
      
      if (filters?.equipmentType) {
        query = query.eq('equipment_type', filters.equipmentType)
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      
      const { data, error } = await query
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useEquipmentDetail(equipmentId: string | null) {
  return useQuery({
    queryKey: ['equipment', 'detail', equipmentId],
    queryFn: async () => {
      if (!equipmentId) return null
      
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          id,
          name,
          equipment_type,
          manufacturer,
          model,
          serial_number,
          status,
          install_date,
          warranty_expiry,
          notes,
          created_at,
          updated_at,
          properties(id, name),
          units(id, name),
          plant_rooms(id, name)
        `)
        .eq('id', equipmentId)
        .single()
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data
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
      
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('equipment_failures')
        .select('*')
        .eq('equipment_id', equipmentId)
        .order('failure_date', { ascending: false })
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data
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
      
      const supabase = createClient()
      
      const { data, error } = await supabase
        .rpc('get_equipment_failure_summary', { p_equipment_id: equipmentId })
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data
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
      
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('equipment_maintenance_logs')
        .select('*')
        .eq('equipment_id', equipmentId)
        .order('maintenance_date', { ascending: false })
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data
    },
    enabled: !!equipmentId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateEquipmentFailure() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (failureData: any) => {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('equipment_failures')
        .insert(failureData)
        .select()
        .single()
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data
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
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('equipment_failures')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equipment', 'failures', variables.equipmentId] })
      queryClient.invalidateQueries({ queryKey: ['equipment', 'failure-summary', variables.equipmentId] })
      queryClient.invalidateQueries({ queryKey: ['equipment', 'detail', variables.equipmentId] })
    },
  })
}

