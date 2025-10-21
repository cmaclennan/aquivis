'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

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
      const supabase = createClient()
      
      let query = supabase
        .from('services')
        .select(`
          id,
          service_date,
          service_type,
          status,
          notes,
          units(
            id,
            name,
            properties(id, name, address)
          ),
          water_tests(id, ph, chlorine, alkalinity),
          service_chemicals(id, chemical_name, amount)
        `)
        .order('service_date', { ascending: false })
      
      if (filters?.propertyId) {
        query = query.eq('units.properties.id', filters.propertyId)
      }
      
      if (filters?.unitId) {
        query = query.eq('unit_id', filters.unitId)
      }
      
      if (filters?.startDate) {
        query = query.gte('service_date', filters.startDate)
      }
      
      if (filters?.endDate) {
        query = query.lte('service_date', filters.endDate)
      }
      
      if (filters?.serviceType) {
        query = query.eq('service_type', filters.serviceType)
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status)
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
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

export function useService(serviceId: string | null) {
  return useQuery({
    queryKey: ['services', 'detail', serviceId],
    queryFn: async () => {
      if (!serviceId) return null
      
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('services')
        .select(`
          id,
          service_date,
          service_type,
          status,
          notes,
          created_at,
          updated_at,
          units(
            id,
            name,
            properties(id, name, address, customer_id)
          ),
          water_tests(
            id,
            ph,
            chlorine,
            total_chlorine,
            free_chlorine,
            alkalinity,
            calcium_hardness,
            cyanuric_acid,
            phosphates,
            salt,
            temperature,
            tds,
            notes,
            created_at
          ),
          service_chemicals(
            id,
            chemical_name,
            amount,
            unit,
            cost
          ),
          service_photos(
            id,
            photo_url,
            caption,
            created_at
          )
        `)
        .eq('id', serviceId)
        .single()
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data
    },
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes (service details don't change often)
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (serviceData: any) => {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('services')
        .insert(serviceData)
        .select()
        .single()
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data
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
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('services')
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
      const supabase = createClient()
      
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)
      
      if (error) {
        throw new Error(error.message)
      }
      
      return serviceId
    },
    onSuccess: () => {
      // Invalidate all service queries
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
    },
  })
}

