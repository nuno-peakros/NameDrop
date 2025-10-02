/**
 * Performance monitoring utilities
 * 
 * This module provides:
 * - Web Vitals monitoring
 * - Performance metrics collection
 * - Bundle size tracking
 * - Runtime performance monitoring
 */

/**
 * Web Vitals metrics
 */
interface WebVitals {
  name: string
  value: number
  delta: number
  id: string
  navigationType: string
}

/**
 * Performance metrics
 */
interface PerformanceMetrics {
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
  fmp?: number // First Meaningful Paint
}

/**
 * Performance observer for Web Vitals
 */
class PerformanceObserver {
  private metrics: PerformanceMetrics = {}
  private observers: PerformanceObserver[] = []

  constructor() {
    this.initializeObservers()
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers() {
    if (typeof window === 'undefined') return

    // Observe Core Web Vitals
    this.observeWebVitals()
    
    // Observe custom metrics
    this.observeCustomMetrics()
  }

  /**
   * Observe Web Vitals metrics
   */
  private observeWebVitals() {
    if (typeof window === 'undefined') return

    // First Contentful Paint
    this.observeMetric('paint', (entry) => {
      if (entry.name === 'first-contentful-paint') {
        this.metrics.fcp = entry.startTime
        this.reportMetric('FCP', entry.startTime)
      }
    })

    // Largest Contentful Paint
    this.observeMetric('largest-contentful-paint', (entry) => {
      this.metrics.lcp = entry.startTime
      this.reportMetric('LCP', entry.startTime)
    })

    // First Input Delay
    this.observeMetric('first-input', (entry) => {
      this.metrics.fid = entry.processingStart - entry.startTime
      this.reportMetric('FID', this.metrics.fid)
    })

    // Cumulative Layout Shift
    this.observeMetric('layout-shift', (entry) => {
      if (!entry.hadRecentInput) {
        this.metrics.cls = (this.metrics.cls || 0) + entry.value
        this.reportMetric('CLS', this.metrics.cls)
      }
    })
  }

  /**
   * Observe custom performance metrics
   */
  private observeCustomMetrics() {
    if (typeof window === 'undefined') return

    // Time to First Byte
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        this.metrics.ttfb = navigation.responseStart - navigation.requestStart
        this.reportMetric('TTFB', this.metrics.ttfb)
      }
    })

    // First Meaningful Paint
    this.observeMetric('paint', (entry) => {
      if (entry.name === 'first-meaningful-paint') {
        this.metrics.fmp = entry.startTime
        this.reportMetric('FMP', entry.startTime)
      }
    })
  }

  /**
   * Observe a specific performance metric
   */
  private observeMetric(type: string, callback: (entry: any) => void) {
    if (typeof window === 'undefined') return

    try {
      const observer = new window.PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry)
        }
      })
      
      observer.observe({ type, buffered: true })
      this.observers.push(observer)
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error)
    }
  }

  /**
   * Report a metric to analytics or logging service
   */
  private reportMetric(name: string, value: number) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance Metric: ${name} = ${value.toFixed(2)}ms`)
    }

    // Send to analytics service
    this.sendToAnalytics(name, value)
  }

  /**
   * Send metrics to analytics service
   */
  private sendToAnalytics(name: string, value: number) {
    // Example: Send to Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'web_vitals', {
        event_category: 'Performance',
        event_label: name,
        value: Math.round(value),
        non_interaction: true,
      })
    }

    // Example: Send to custom analytics
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Performance Metric', {
        metric: name,
        value: value,
        timestamp: Date.now(),
      })
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Clean up observers
   */
  dispose() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

/**
 * Performance monitoring instance
 */
let performanceMonitor: PerformanceObserver | null = null

/**
 * Initialize performance monitoring
 */
export function initializePerformanceMonitoring(): void {
  if (typeof window === 'undefined') return
  
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceObserver()
  }
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return performanceMonitor?.getMetrics() || {}
}

/**
 * Measure function execution time
 */
export function measureFunction<T>(name: string, fn: () => T): T {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  
  const duration = end - start
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`Function ${name} took ${duration.toFixed(2)}ms`)
  }
  
  return result
}

/**
 * Measure async function execution time
 */
export async function measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  
  const duration = end - start
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`Async function ${name} took ${duration.toFixed(2)}ms`)
  }
  
  return result
}

/**
 * Measure component render time
 */
export function measureComponentRender(componentName: string, renderFn: () => void): void {
  const start = performance.now()
  renderFn()
  const end = performance.now()
  
  const duration = end - start
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`Component ${componentName} rendered in ${duration.toFixed(2)}ms`)
  }
}

/**
 * Get bundle size information
 */
export function getBundleSize(): { js: number; css: number; total: number } {
  if (typeof window === 'undefined') return { js: 0, css: 0, total: 0 }

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  
  let jsSize = 0
  let cssSize = 0
  
  resources.forEach(resource => {
    if (resource.name.includes('.js')) {
      jsSize += resource.transferSize || 0
    } else if (resource.name.includes('.css')) {
      cssSize += resource.transferSize || 0
    }
  })
  
  return {
    js: jsSize,
    css: cssSize,
    total: jsSize + cssSize,
  }
}

/**
 * Check if performance monitoring is supported
 */
export function isPerformanceMonitoringSupported(): boolean {
  return typeof window !== 'undefined' && 
         'performance' in window && 
         'PerformanceObserver' in window
}

/**
 * Clean up performance monitoring
 */
export function cleanupPerformanceMonitoring(): void {
  performanceMonitor?.dispose()
  performanceMonitor = null
}

// Initialize performance monitoring on module load
if (typeof window !== 'undefined') {
  initializePerformanceMonitoring()
}
