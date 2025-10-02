/**
 * Performance monitoring utilities tests
 * 
 * Tests for:
 * - Performance metrics collection
 * - Bundle size tracking
 * - Function measurement
 * - Performance scoring
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  measureFunction,
  measureAsyncFunction,
  getBundleSize,
  isPerformanceMonitoringSupported,
  initializePerformanceMonitoring,
  cleanupPerformanceMonitoring,
} from '@/lib/performance'

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  getEntriesByType: vi.fn(() => []),
  mark: vi.fn(),
  measure: vi.fn(),
}

// Mock PerformanceObserver
const mockPerformanceObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock window object
Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true,
})

Object.defineProperty(window, 'PerformanceObserver', {
  value: mockPerformanceObserver,
  writable: true,
})

describe('Performance Monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset performance.now to return consistent values
    let time = 1000
    mockPerformance.now.mockImplementation(() => time++)
  })

  afterEach(() => {
    cleanupPerformanceMonitoring()
  })

  describe('measureFunction', () => {
    it('should measure function execution time', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const result = measureFunction('testFunction', () => {
        return 'test result'
      })

      expect(result).toBe('test result')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Function testFunction took')
      )
      
      consoleSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })

    it('should measure function execution time in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      measureFunction('testFunction', () => 'test result')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Function testFunction took')
      )
      
      consoleSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })

    it('should not log in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      measureFunction('testFunction', () => 'test result')

      expect(consoleSpy).not.toHaveBeenCalled()
      
      consoleSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('measureAsyncFunction', () => {
    it('should measure async function execution time', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const result = await measureAsyncFunction('testAsyncFunction', async () => {
        return 'test result'
      })

      expect(result).toBe('test result')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Async function testAsyncFunction took')
      )
      
      consoleSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })

    it('should handle async function errors', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      await expect(
        measureAsyncFunction('testAsyncFunction', async () => {
          throw new Error('Test error')
        })
      ).rejects.toThrow('Test error')
      
      consoleSpy.mockRestore()
    })
  })

  describe('getBundleSize', () => {
    it('should return zero bundle size when no resources', () => {
      mockPerformance.getEntriesByType.mockReturnValue([])
      
      const bundleSize = getBundleSize()
      
      expect(bundleSize).toEqual({ js: 0, css: 0, total: 0 })
    })

    it('should calculate bundle size from resources', () => {
      const mockResources = [
        { name: 'app.js', transferSize: 100000 },
        { name: 'vendor.js', transferSize: 200000 },
        { name: 'styles.css', transferSize: 50000 },
        { name: 'image.png', transferSize: 30000 },
      ]
      
      mockPerformance.getEntriesByType.mockReturnValue(mockResources)
      
      const bundleSize = getBundleSize()
      
      expect(bundleSize).toEqual({
        js: 300000,
        css: 50000,
        total: 350000,
      })
    })

    it('should handle resources without transferSize', () => {
      const mockResources = [
        { name: 'app.js' },
        { name: 'styles.css' },
      ]
      
      mockPerformance.getEntriesByType.mockReturnValue(mockResources)
      
      const bundleSize = getBundleSize()
      
      expect(bundleSize).toEqual({ js: 0, css: 0, total: 0 })
    })
  })

  describe('isPerformanceMonitoringSupported', () => {
    it('should return true when performance monitoring is supported', () => {
      expect(isPerformanceMonitoringSupported()).toBe(true)
    })

    it('should return false when performance is not available', () => {
      // @ts-expect-error - Mocking performance API for testing
      delete window.performance
      
      expect(isPerformanceMonitoringSupported()).toBe(false)
    })

    it('should return false when PerformanceObserver is not available', () => {
      // @ts-expect-error - Mocking performance API for testing
      delete window.PerformanceObserver
      
      expect(isPerformanceMonitoringSupported()).toBe(false)
    })
  })

  describe('initializePerformanceMonitoring', () => {
    it('should initialize performance monitoring', () => {
      const result = initializePerformanceMonitoring()
      
      expect(result).toBeUndefined()
    })

    it('should not initialize when performance monitoring is not supported', () => {
      // @ts-expect-error - Mocking performance API for testing
      delete window.performance
      
      const result = initializePerformanceMonitoring()
      
      expect(result).toBeUndefined()
    })
  })

  describe('cleanupPerformanceMonitoring', () => {
    it('should cleanup performance monitoring', () => {
      const result = cleanupPerformanceMonitoring()
      
      expect(result).toBeUndefined()
    })
  })
})
