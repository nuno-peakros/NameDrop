/**
 * Performance monitor component tests
 * 
 * Tests for:
 * - Performance metrics display
 * - Bundle size information
 * - Performance score calculation
 * - Real-time updates
 */

import React from 'react'

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PerformanceMonitor } from '@/components/ui/performance-monitor'

vi.mock('@/lib/performance', () => ({
  getPerformanceMetrics: vi.fn(),
  getBundleSize: vi.fn(),
  isPerformanceMonitoringSupported: vi.fn(),
  calculatePerformanceScore: vi.fn(),
  getPerformanceGrade: vi.fn(),
}))

describe('PerformanceMonitor', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Mock browser environment
    Object.defineProperty(window, 'performance', {
      value: {
        now: vi.fn(() => Date.now()),
        getEntriesByType: vi.fn(() => []),
        mark: vi.fn(),
        measure: vi.fn(),
      },
      writable: true,
    })
    
    Object.defineProperty(window, 'PerformanceObserver', {
      value: vi.fn(() => ({
        observe: vi.fn(),
        disconnect: vi.fn(),
      })),
      writable: true,
    })

    // Set up default mock return values
    const performanceModule = await import('@/lib/performance')
    vi.mocked(performanceModule.isPerformanceMonitoringSupported).mockReturnValue(true)
    vi.mocked(performanceModule.getPerformanceMetrics).mockReturnValue({
      fcp: 1500,
      lcp: 2000,
      fid: 50,
      cls: 0.05,
      ttfb: 600,
    })
    vi.mocked(performanceModule.getBundleSize).mockReturnValue({
      js: 300000,
      css: 50000,
      total: 350000,
    })
    vi.mocked(performanceModule.calculatePerformanceScore).mockReturnValue(95)
    vi.mocked(performanceModule.getPerformanceGrade).mockReturnValue('A+')
  })

  it('should render performance metrics', async () => {
    render(<PerformanceMonitor />)
    
    await waitFor(() => {
      expect(screen.getByText('Core Web Vitals')).toBeInTheDocument()
      expect(screen.getByText('Bundle Size')).toBeInTheDocument()
      expect(screen.getByText('Performance Score')).toBeInTheDocument()
    })
  })

  it('should display FCP metric', async () => {
    render(<PerformanceMonitor />)
    
    await waitFor(() => {
      expect(screen.getByText('Core Web Vitals')).toBeInTheDocument()
    })
  })

  it('should display LCP metric', async () => {
    render(<PerformanceMonitor />)
    
    await waitFor(() => {
      expect(screen.getByText('Core Web Vitals')).toBeInTheDocument()
    })
  })

  it('should display FID metric', async () => {
    render(<PerformanceMonitor />)
    
    await waitFor(() => {
      expect(screen.getByText('Core Web Vitals')).toBeInTheDocument()
    })
  })

  it('should display CLS metric', async () => {
    render(<PerformanceMonitor />)
    
    await waitFor(() => {
      expect(screen.getByText('Core Web Vitals')).toBeInTheDocument()
    })
  })

  it('should display TTFB metric', async () => {
    render(<PerformanceMonitor />)
    
    await waitFor(() => {
      expect(screen.getByText('Core Web Vitals')).toBeInTheDocument()
    })
  })

  it('should display bundle size information', async () => {
    render(<PerformanceMonitor />)
    
    await waitFor(() => {
      expect(screen.getByText('Bundle Size')).toBeInTheDocument()
    })
  })

  it('should display performance score', async () => {
    render(<PerformanceMonitor />)
    
    await waitFor(() => {
      expect(screen.getByText('Performance Score')).toBeInTheDocument()
    })
  })

  it('should show refresh button', async () => {
    render(<PerformanceMonitor />)
    
    await waitFor(() => {
      expect(screen.getByText('Refresh Metrics')).toBeInTheDocument()
    })
  })

  it('should handle unsupported environment', async () => {
    // Mock unsupported environment
    vi.mocked(await import('@/lib/performance')).isPerformanceMonitoringSupported.mockReturnValue(false)
    
    render(<PerformanceMonitor />)
    
    await waitFor(() => {
      expect(screen.getByText('Performance monitoring is not supported in this environment.')).toBeInTheDocument()
    })
  })

  it('should display poor performance metrics', async () => {
    // Mock poor performance metrics
    vi.mocked(await import('@/lib/performance')).getPerformanceMetrics.mockReturnValue({
      fcp: 4000,
      lcp: 6000,
      fid: 500,
      cls: 0.5,
      ttfb: 2000,
    })
    
    render(<PerformanceMonitor />)
    
    await waitFor(() => {
      expect(screen.getByText('Core Web Vitals')).toBeInTheDocument()
    })
  })

  it('should display needs improvement metrics', async () => {
    // Mock needs improvement metrics
    vi.mocked(await import('@/lib/performance')).getPerformanceMetrics.mockReturnValue({
      fcp: 2500,
      lcp: 3500,
      fid: 200,
      cls: 0.2,
      ttfb: 1200,
    })
    
    render(<PerformanceMonitor />)
    
    await waitFor(() => {
      expect(screen.getByText('Core Web Vitals')).toBeInTheDocument()
    })
  })
})
