'use client'

// ============================================
// PERFORMANCE MONITORING UTILITIES
// ============================================
// Purpose: Track and monitor application performance
// Priority: HIGH - Critical for user experience
// Date: 2025-01-14

import { useRef, useEffect } from 'react'

interface PerformanceMetrics {
  pageLoad: number
  queryTime: number
  renderTime: number
  timestamp: number
  page: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private maxMetrics = 100 // Keep last 100 metrics

  // Track page load time
  trackPageLoad(page: string, startTime: number) {
    const loadTime = performance.now() - startTime
    this.addMetric({
      pageLoad: loadTime,
      queryTime: 0,
      renderTime: 0,
      timestamp: Date.now(),
      page
    })
    
    // Log slow page loads
    if (loadTime > 2000) {
      console.warn(`Slow page load: ${page} took ${loadTime.toFixed(2)}ms`)
    }
  }

  // Track query performance
  trackQuery(queryName: string, startTime: number) {
    const queryTime = performance.now() - startTime
    this.addMetric({
      pageLoad: 0,
      queryTime,
      renderTime: 0,
      timestamp: Date.now(),
      page: queryName
    })
    
    // Log slow queries
    if (queryTime > 1000) {
      console.warn(`Slow query: ${queryName} took ${queryTime.toFixed(2)}ms`)
    }
  }

  // Track render performance
  trackRender(componentName: string, startTime: number) {
    const renderTime = performance.now() - startTime
    this.addMetric({
      pageLoad: 0,
      queryTime: 0,
      renderTime,
      timestamp: Date.now(),
      page: componentName
    })
    
    // Log slow renders
    if (renderTime > 100) {
      console.warn(`Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`)
    }
  }

  private addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric)
    
    // Keep only the last maxMetrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  // Get performance summary
  getSummary() {
    const recent = this.metrics.slice(-20) // Last 20 metrics
    
    const avgPageLoad = recent
      .filter(m => m.pageLoad > 0)
      .reduce((sum, m) => sum + m.pageLoad, 0) / recent.filter(m => m.pageLoad > 0).length || 0
    
    const avgQueryTime = recent
      .filter(m => m.queryTime > 0)
      .reduce((sum, m) => sum + m.queryTime, 0) / recent.filter(m => m.queryTime > 0).length || 0
    
    const avgRenderTime = recent
      .filter(m => m.renderTime > 0)
      .reduce((sum, m) => sum + m.renderTime, 0) / recent.filter(m => m.renderTime > 0).length || 0

    return {
      avgPageLoad: Math.round(avgPageLoad),
      avgQueryTime: Math.round(avgQueryTime),
      avgRenderTime: Math.round(avgRenderTime),
      totalMetrics: this.metrics.length,
      recentMetrics: recent.length
    }
  }

  // Get all metrics (for debugging)
  getAllMetrics() {
    return [...this.metrics]
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = []
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor()

// React hook for tracking component performance
export function usePerformanceTracking(componentName: string) {
  const startTime = useRef(performance.now())
  
  useEffect(() => {
    const endTime = performance.now()
    const renderTime = endTime - startTime.current
    performanceMonitor.trackRender(componentName, startTime.current)
  })
}

// Utility functions
export function trackPageLoad(page: string) {
  const startTime = performance.now()
  return () => performanceMonitor.trackPageLoad(page, startTime)
}

export function trackQuery(queryName: string) {
  const startTime = performance.now()
  return () => performanceMonitor.trackQuery(queryName, startTime)
}

// Performance targets
export const PERFORMANCE_TARGETS = {
  PAGE_LOAD: 2000, // 2 seconds
  QUERY_TIME: 1000, // 1 second
  RENDER_TIME: 100, // 100ms
} as const

// Check if performance meets targets
export function checkPerformanceTargets() {
  const summary = performanceMonitor.getSummary()
  
  return {
    pageLoad: summary.avgPageLoad <= PERFORMANCE_TARGETS.PAGE_LOAD,
    queryTime: summary.avgQueryTime <= PERFORMANCE_TARGETS.QUERY_TIME,
    renderTime: summary.avgRenderTime <= PERFORMANCE_TARGETS.RENDER_TIME,
    summary
  }
}
