/**
 * Performance monitoring hook tests
 * 
 * Tests for:
 * - Hook initialization
 * - Metrics updates
 * - Performance scoring
 * - Utility functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePerformance } from '@/hooks/use-performance'

// Mock performance utilities
vi.mock('@/lib/performance', () => ({
  getPerformanceMetrics: vi.fn(() => ({
    fcp: 1500,
    lcp: 2000,
    fid: 50,
    cls: 0.05,
    ttfb: 600,
  })),
  getBundleSize: vi.fn(() => ({
    js: 300000,
    css: 50000,
    total: 350000,
  })),
  isPerformanceMonitoringSupported: vi.fn(() => true),
  measureFunction: vi.fn((name, fn) => fn()),
  measureAsyncFunction: vi.fn((name, fn) => fn()),
}))

describe('usePerformance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePerformance())
    
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isSupported).toBe(false)
    expect(result.current.metrics).toEqual({})
    expect(result.current.bundleSize).toEqual({ js: 0, css: 0, total: 0 })
  })

  it('should initialize performance monitoring when supported', async () => {
    const { result } = renderHook(() => usePerformance())
    
    await act(async () => {
      vi.runAllTimers()
    })
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isSupported).toBe(true)
  })

  it('should update metrics periodically', async () => {
    const { result } = renderHook(() => usePerformance())
    
    await act(async () => {
      vi.runAllTimers()
    })
    
    expect(result.current.metrics).toEqual({
      fcp: 1500,
      lcp: 2000,
      fid: 50,
      cls: 0.05,
      ttfb: 600,
    })
    
    expect(result.current.bundleSize).toEqual({
      js: 300000,
      css: 50000,
      total: 350000,
    })
  })

  it('should calculate performance score correctly', async () => {
    const { result } = renderHook(() => usePerformance())
    
    await act(async () => {
      vi.runAllTimers()
    })
    
    const score = result.current.getPerformanceScore()
    expect(score).toBe(100) // All metrics are good
  })

  it('should return correct performance grade', async () => {
    const { result } = renderHook(() => usePerformance())
    
    await act(async () => {
      vi.runAllTimers()
    })
    
    const grade = result.current.getPerformanceGrade()
    expect(grade).toBe('A+')
  })

  it('should identify good metrics', async () => {
    const { result } = renderHook(() => usePerformance())
    
    await act(async () => {
      vi.runAllTimers()
    })
    
    expect(result.current.isMetricGood('fcp')).toBe(true)
    expect(result.current.isMetricGood('lcp')).toBe(true)
    expect(result.current.isMetricGood('fid')).toBe(true)
    expect(result.current.isMetricGood('cls')).toBe(true)
  })

  it('should identify poor metrics', async () => {
    // Mock poor performance metrics
    vi.mocked(require('@/lib/performance').getPerformanceMetrics).mockReturnValue({
      fcp: 4000,
      lcp: 6000,
      fid: 500,
      cls: 0.5,
      ttfb: 2000,
    })
    
    const { result } = renderHook(() => usePerformance())
    
    await act(async () => {
      vi.runAllTimers()
    })
    
    expect(result.current.isMetricGood('fcp')).toBe(false)
    expect(result.current.isMetricGood('lcp')).toBe(false)
    expect(result.current.isMetricGood('fid')).toBe(false)
    expect(result.current.isMetricGood('cls')).toBe(false)
  })

  it('should provide performance recommendations', async () => {
    // Mock poor performance metrics
    vi.mocked(require('@/lib/performance').getPerformanceMetrics).mockReturnValue({
      fcp: 4000,
      lcp: 6000,
      fid: 500,
      cls: 0.5,
      ttfb: 2000,
    })
    
    const { result } = renderHook(() => usePerformance())
    
    await act(async () => {
      vi.runAllTimers()
    })
    
    const recommendations = result.current.getRecommendations()
    expect(recommendations).toContain('Optimize First Contentful Paint by reducing render-blocking resources')
    expect(recommendations).toContain('Improve Largest Contentful Paint by optimizing images and critical resources')
    expect(recommendations).toContain('Reduce First Input Delay by minimizing JavaScript execution time')
    expect(recommendations).toContain('Fix Cumulative Layout Shift by setting dimensions for images and avoiding dynamic content')
  })

  it('should provide good performance recommendations', async () => {
    const { result } = renderHook(() => usePerformance())
    
    await act(async () => {
      vi.runAllTimers()
    })
    
    const recommendations = result.current.getRecommendations()
    expect(recommendations).toContain('Performance looks good! Keep up the great work.')
  })

  it('should format bytes correctly', async () => {
    const { result } = renderHook(() => usePerformance())
    
    await act(async () => {
      vi.runAllTimers()
    })
    
    expect(result.current.formatBytes(0)).toBe('0 B')
    expect(result.current.formatBytes(1024)).toBe('1 KB')
    expect(result.current.formatBytes(1048576)).toBe('1 MB')
    expect(result.current.formatBytes(1073741824)).toBe('1 GB')
  })

  it('should format time correctly', async () => {
    const { result } = renderHook(() => usePerformance())
    
    await act(async () => {
      vi.runAllTimers()
    })
    
    expect(result.current.formatTime(500)).toBe('500ms')
    expect(result.current.formatTime(1500)).toBe('1.50s')
    expect(result.current.formatTime(2000)).toBe('2.00s')
  })

  it('should measure functions', async () => {
    const { result } = renderHook(() => usePerformance())
    
    await act(async () => {
      vi.runAllTimers()
    })
    
    const testFunction = () => 'test result'
    const result_value = result.current.measure('testFunction', testFunction)
    
    expect(result_value).toBe('test result')
  })

  it('should measure async functions', async () => {
    const { result } = renderHook(() => usePerformance())
    
    await act(async () => {
      vi.runAllTimers()
    })
    
    const testAsyncFunction = async () => 'test result'
    const result_value = await result.current.measureAsync('testAsyncFunction', testAsyncFunction)
    
    expect(result_value).toBe('test result')
  })

  it('should handle unsupported environment', async () => {
    vi.mocked(require('@/lib/performance').isPerformanceMonitoringSupported).mockReturnValue(false)
    
    const { result } = renderHook(() => usePerformance())
    
    await act(async () => {
      vi.runAllTimers()
    })
    
    expect(result.current.isSupported).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })
})
