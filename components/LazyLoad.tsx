'use client'

import { Suspense, lazy, ComponentType } from 'react'

interface LazyLoadProps {
  /**
   * Component to lazy load
   */
  component: () => Promise<{ default: ComponentType<any> }>
  
  /**
   * Props to pass to the lazy-loaded component
   */
  componentProps?: Record<string, any>
  
  /**
   * Loading fallback component
   */
  fallback?: React.ReactNode
  
  /**
   * Error fallback component
   */
  errorFallback?: React.ReactNode
}

/**
 * LazyLoad Component
 * 
 * Wrapper for lazy loading heavy components with Suspense
 * 
 * @example
 * ```tsx
 * <LazyLoad
 *   component={() => import('./HeavyComponent')}
 *   componentProps={{ data: myData }}
 *   fallback={<div>Loading...</div>}
 * />
 * ```
 */
export function LazyLoad({
  component,
  componentProps = {},
  fallback = <LoadingSpinner />,
  errorFallback = <ErrorMessage />,
}: LazyLoadProps) {
  const LazyComponent = lazy(component)
  
  return (
    <Suspense fallback={fallback}>
      <LazyComponent {...componentProps} />
    </Suspense>
  )
}

/**
 * Default loading spinner
 */
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}

/**
 * Default error message
 */
function ErrorMessage() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-red-600 text-sm">
        Failed to load component. Please refresh the page.
      </div>
    </div>
  )
}

/**
 * Lazy load with intersection observer
 * Only loads component when it enters viewport
 */
export function LazyLoadOnView({
  component,
  componentProps = {},
  fallback = <LoadingSpinner />,
  rootMargin = '50px',
}: LazyLoadProps & { rootMargin?: string }) {
  const LazyComponent = lazy(component)
  
  return (
    <IntersectionObserverWrapper rootMargin={rootMargin}>
      <Suspense fallback={fallback}>
        <LazyComponent {...componentProps} />
      </Suspense>
    </IntersectionObserverWrapper>
  )
}

/**
 * Intersection Observer Wrapper
 * Renders children only when they enter viewport
 */
function IntersectionObserverWrapper({
  children,
  rootMargin = '50px',
}: {
  children: React.ReactNode
  rootMargin?: string
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin }
    )
    
    if (ref.current) {
      observer.observe(ref.current)
    }
    
    return () => observer.disconnect()
  }, [rootMargin])
  
  return (
    <div ref={ref}>
      {isVisible ? children : <LoadingSpinner />}
    </div>
  )
}

// Add missing imports
import { useState, useEffect, useRef } from 'react'

