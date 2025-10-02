'use client'

import { useEffect, useState, useCallback } from 'react'
import { 
  getPerformanceMetrics, 
  getBundleSize, 
  isPerformanceMonitoringSupported,
  measureFunction,
  measureAsyncFunction 
} from '@/lib/performance'

/**
 * Performance metrics interface
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
 * Bundle size interface
 */
interface BundleSize {
  js: number
  css: number
  total: number
}

/**
 * Performance monitoring hook
 * 
 * Provides real-time performance metrics and utilities
 */
export function usePerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})
  const [bundleSize, setBundleSize] = useState<BundleSize>({ js: 0, css: 0, total: 0 })
  const [isSupported, setIsSupported] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSupport = () => {
      const supported = isPerformanceMonitoringSupported()
      setIsSupported(supported)
      setIsLoading(false)
      
      if (supported) {
        // Initial metrics
        setMetrics(getPerformanceMetrics())
        setBundleSize(getBundleSize())
      }
    }

    checkSupport()
  }, [])

  useEffect(() => {
    if (!isSupported) return

    // Update metrics every 5 seconds
    const interval = setInterval(() => {
      setMetrics(getPerformanceMetrics())
      setBundleSize(getBundleSize())
    }, 5000)

    return () => clearInterval(interval)
  }, [isSupported])

  /**
   * Measure function execution time
   */
  const measure = useCallback(<T>(name: string, fn: () => T): T => {
    return measureFunction(name, fn)
  }, [])

  /**
   * Measure async function execution time
   */
  const measureAsync = useCallback(<T>(name: string, fn: () => Promise<T>): Promise<T> => {
    return measureAsyncFunction(name, fn)
  }, [])

  /**
   * Get performance score based on Core Web Vitals
   */
  const getPerformanceScore = useCallback((): number => {
    let score = 0
    let totalMetrics = 0

    // FCP score (0-100)
    if (metrics.fcp) {
      if (metrics.fcp <= 1800) score += 100
      else if (metrics.fcp <= 3000) score += 50
      else score += 0
      totalMetrics++
    }

    // LCP score (0-100)
    if (metrics.lcp) {
      if (metrics.lcp <= 2500) score += 100
      else if (metrics.lcp <= 4000) score += 50
      else score += 0
      totalMetrics++
    }

    // FID score (0-100)
    if (metrics.fid) {
      if (metrics.fid <= 100) score += 100
      else if (metrics.fid <= 300) score += 50
      else score += 0
      totalMetrics++
    }

    // CLS score (0-100)
    if (metrics.cls) {
      if (metrics.cls <= 0.1) score += 100
      else if (metrics.cls <= 0.25) score += 50
      else score += 0
      totalMetrics++
    }

    return totalMetrics > 0 ? Math.round(score / totalMetrics) : 0
  }, [metrics])

  /**
   * Get performance grade (A+ to F)
   */
  const getPerformanceGrade = useCallback((): string => {
    const score = getPerformanceScore()
    
    if (score >= 90) return 'A+'
    if (score >= 80) return 'A'
    if (score >= 70) return 'B'
    if (score >= 60) return 'C'
    if (score >= 50) return 'D'
    return 'F'
  }, [getPerformanceScore])

  /**
   * Check if a metric meets the good threshold
   */
  const isMetricGood = useCallback((metric: keyof PerformanceMetrics): boolean => {
    const thresholds = {
      fcp: 1800,
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      ttfb: 800,
      fmp: 2000,
    }

    const value = metrics[metric]
    if (value === undefined) return false

    return value <= thresholds[metric]
  }, [metrics])

  /**
   * Get performance recommendations
   */
  const getRecommendations = useCallback((): string[] => {
    const recommendations: string[] = []

    if (metrics.fcp && metrics.fcp > 1800) {
      recommendations.push('Optimize First Contentful Paint by reducing render-blocking resources')
    }

    if (metrics.lcp && metrics.lcp > 2500) {
      recommendations.push('Improve Largest Contentful Paint by optimizing images and critical resources')
    }

    if (metrics.fid && metrics.fid > 100) {
      recommendations.push('Reduce First Input Delay by minimizing JavaScript execution time')
    }

    if (metrics.cls && metrics.cls > 0.1) {
      recommendations.push('Fix Cumulative Layout Shift by setting dimensions for images and avoiding dynamic content')
    }

    if (bundleSize.total > 500000) { // 500KB
      recommendations.push('Reduce bundle size by implementing code splitting and removing unused code')
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance looks good! Keep up the great work.')
    }

    return recommendations
  }, [metrics, bundleSize])

  /**
   * Format bytes to human readable string
   */
  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  /**
   * Format time to human readable string
   */
  const formatTime = useCallback((ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }, [])

  return {
    metrics,
    bundleSize,
    isSupported,
    isLoading,
    measure,
    measureAsync,
    getPerformanceScore,
    getPerformanceGrade,
    isMetricGood,
    getRecommendations,
    formatBytes,
    formatTime,
  }
}
