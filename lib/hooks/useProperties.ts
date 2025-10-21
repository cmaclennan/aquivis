'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useProperties(filters?: {
  customerId?: string
  search?: string
  limit?: number
}) {
  return useQuery({
    queryKey: ['properties', 'list', filters],
    queryFn: async () => {
      const supabase = createClient()
      
      let query = supabase
        .from('properties')
        .select(`
          id,
          name,
          address,
          city,
          state,
          zip,
          customer_id,
          customers(id, name, email),
          units(id, name, unit_type)
        `)
        .order('name', { ascending: true })
      
      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId)
      }
      
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,address.ilike.%${filters.search}%`)
      }
      
      if (filters?.limit) {
        query = query.limit(filters.limit)
      }
      
      const { data, error } = await query
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (properties don't change often)
  })
}

export function useProperty(propertyId: string | null) {
  return useQuery({
    queryKey: ['properties', 'detail', propertyId],
    queryFn: async () => {
      if (!propertyId) return null
      
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id,
          name,
          address,
          city,
          state,
          zip,
          customer_id,
          notes,
          created_at,
          updated_at,
          customers(id, name, email, phone),
          units(
            id,
            name,
            unit_type,
            volume,
            surface_area,
            equipment(id, name, equipment_type, status)
          )
        `)
        .eq('id', propertyId)
        .single()
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data
    },
    enabled: !!propertyId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useCreateProperty() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (propertyData: any) => {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single()
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data
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
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['properties', 'detail', data.id] })
      queryClient.invalidateQueries({ queryKey: ['properties', 'list'] })
    },
  })
}

