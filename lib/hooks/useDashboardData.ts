'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface DashboardSummary {
  total_properties: number
  total_units: number
  total_services_this_month: number
  total_services_last_month: number
  upcoming_services_count: number
  overdue_services_count: number
  total_customers: number
  active_equipment_count: number
}

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async (): Promise<DashboardSummary> => {
      const supabase = createClient()
      
      const { data, error } = await supabase.rpc('get_dashboard_summary')
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data as DashboardSummary
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (dashboard data changes frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useRecentServices(limit: number = 10) {
  return useQuery({
    queryKey: ['services', 'recent', limit],
    queryFn: async () => {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('services')
        .select(`
          id,
          service_date,
          service_type,
          status,
          units(name, properties(name))
        `)
        .order('service_date', { ascending: false })
        .limit(limit)
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useUpcomingServices(limit: number = 10) {
  return useQuery({
    queryKey: ['services', 'upcoming', limit],
    queryFn: async () => {
      const supabase = createClient()
      
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('services')
        .select(`
          id,
          service_date,
          service_type,
          status,
          units(name, properties(name))
        `)
        .gte('service_date', today)
        .order('service_date', { ascending: true })
        .limit(limit)
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (upcoming services don't change as often)
  })
}

