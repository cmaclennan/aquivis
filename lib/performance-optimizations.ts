// ============================================
// APPLICATION PERFORMANCE OPTIMIZATIONS
// ============================================
// Purpose: Optimize React components and queries for faster loading
// Priority: HIGH - Critical for user experience
// Date: 2025-01-14

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ============================================
// 1. OPTIMIZED QUERY HOOKS
// ============================================

// Dashboard statistics - single optimized query
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('dashboard_stats_optimized')
        .select('*')
        .single()
      
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  })
}

// Services with optimized view
export function useServices(filters?: {
  propertyId?: string
  technicianId?: string
  status?: 'scheduled' | 'in_progress' | 'completed' | 'skipped'
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery({
    queryKey: ['services', filters],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('services_optimized')
        .select('*')
        .order('service_date', { ascending: false })
        .limit(100) // Limit for performance
      
      if (filters?.propertyId) {
        query = query.eq('property_id', filters.propertyId)
      }
      if (filters?.technicianId) {
        query = query.eq('technician_id', filters.technicianId)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.dateFrom) {
        query = query.gte('service_date', filters.dateFrom)
      }
      if (filters?.dateTo) {
        query = query.lte('service_date', filters.dateTo)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Properties with optimized view
export function useProperties() {
  return useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('properties_optimized')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Units with optimized view
export function useUnits(propertyId?: string) {
  return useQuery({
    queryKey: ['units', propertyId],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('units_optimized')
        .select('*')
        .order('name')
      
      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Customers with optimized view
export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('customers_optimized')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// ============================================
// 2. OPTIMIZED MUTATION HOOKS
// ============================================

// Create service with optimistic updates
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
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch services
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

// Update service with optimistic updates
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
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch services
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

// Delete service with optimistic updates
export function useDeleteService() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      // Invalidate and refetch services
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

// ============================================
// 3. OPTIMIZED UTILITY FUNCTIONS
// ============================================

// Debounced search function
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Memoized data processing
export function useMemoizedData<T>(
  data: T[] | undefined,
  processor: (data: T[]) => T[]
): T[] {
  return useMemo(() => {
    if (!data) return []
    return processor(data)
  }, [data, processor])
}

// ============================================
// 4. OPTIMIZED COMPONENT PATTERNS
// ============================================

// Virtualized list for large datasets
export function useVirtualization<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0)
  
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  )
  
  const visibleItems = items.slice(startIndex, endIndex)
  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  }
}

// Pagination hook
export function usePagination<T>(
  data: T[],
  itemsPerPage: number = 20
) {
  const [currentPage, setCurrentPage] = useState(1)
  
  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = data.slice(startIndex, endIndex)
  
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }
  
  const nextPage = () => goToPage(currentPage + 1)
  const prevPage = () => goToPage(currentPage - 1)
  
  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  }
}

// ============================================
// 5. PERFORMANCE MONITORING
// ============================================

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      if (renderTime > 100) { // Track slow renders
        // Could send to analytics service here
      }
    }
  }, [componentName])
}

// Query performance monitoring
export function useQueryPerformance(queryKey: string[]) {
  const startTime = useRef<number>()
  
  useEffect(() => {
    startTime.current = performance.now()
  }, [])
  
  const endTime = useRef<number>()
  
  useEffect(() => {
    if (startTime.current) {
      endTime.current = performance.now()
      const queryTime = endTime.current - startTime.current
      
      if (queryTime > 1000) { // Track slow queries
        // Could send to analytics service here
      }
    }
  }, [queryKey])
}

// ============================================
// 6. CACHING STRATEGIES
// ============================================

// Local storage cache
export function useLocalStorageCache<T>(
  key: string,
  initialValue: T,
  ttl: number = 5 * 60 * 1000 // 5 minutes
) {
  const [cachedValue, setCachedValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      if (item) {
        const parsed = JSON.parse(item)
        if (Date.now() - parsed.timestamp < ttl) {
          return parsed.value
        }
      }
    } catch (error) {
      // Silently fail for localStorage errors
    }
    return initialValue
  })
  
  const setValue = (value: T) => {
    try {
      const item = {
        value,
        timestamp: Date.now(),
      }
      localStorage.setItem(key, JSON.stringify(item))
      setCachedValue(value)
    } catch (error) {
      // Silently fail for localStorage errors
    }
  }
  
  return [cachedValue, setValue] as const
}

// ============================================
// 7. OPTIMIZED DATA TRANSFORMATIONS
// ============================================

// Memoized data transformations
export function useDataTransformations<T, R>(
  data: T[] | undefined,
  transformer: (data: T[]) => R[]
): R[] {
  return useMemo(() => {
    if (!data) return []
    return transformer(data)
  }, [data, transformer])
}

// Optimized filtering
export function useOptimizedFilter<T>(
  data: T[] | undefined,
  filters: Record<string, any>
): T[] {
  return useMemo(() => {
    if (!data) return []
    
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null || value === '') return true
        return item[key as keyof T] === value
      })
    })
  }, [data, filters])
}

// ============================================
// 8. EXPORT ALL HOOKS
// ============================================

// Note: All hooks are exported inline above
