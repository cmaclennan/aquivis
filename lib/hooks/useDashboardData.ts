'use client'

import { useQuery } from '@tanstack/react-query'

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
      const res = await fetch('/api/dashboard/summary', { method: 'GET' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to load dashboard summary')
      return json as DashboardSummary
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (dashboard data changes frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useRecentServices(limit: number = 10) {
  return useQuery({
    queryKey: ['services', 'recent', limit],
    queryFn: async () => {
      const res = await fetch('/api/reports/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange: '30d',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          status: '',
          serviceType: '',
          unitType: '',
          property: '',
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to load recent services')
      return (json.services || []).slice(0, limit)
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useUpcomingServices(limit: number = 10) {
  return useQuery({
    queryKey: ['services', 'upcoming', limit],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch('/api/reports/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange: 'custom',
          startDate: today,
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: '',
          serviceType: '',
          unitType: '',
          property: '',
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to load upcoming services')
      // Sort ascending by date for upcoming
      return (json.services || []).sort((a: any, b: any) => new Date(a.service_date).getTime() - new Date(b.service_date).getTime()).slice(0, limit)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (upcoming services don't change as often)
  })
}

