/**
 * Performance monitor component tests
 * 
 * Tests for:
 * - Performance metrics display
 * - Bundle size information
 * - Performance score calculation
 * - Real-time updates
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PerformanceMonitor } from '@/components/ui/performance-monitor'

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
}))

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
      expect(screen.getByText('First Contentful Paint (FCP)')).toBeInTheDocument()
      expect(screen.getByText('1.50s')).toBeInTheDocument()
      expect(screen.getByText('Good')).toBeInTheDocument()
    })
  })

  it('should display LCP metric', async () => {
    render(<PerformanceMonitor />)
    
    await waitFor(() => {
      expect(screen.getByText('Largest Contentful Paint (LCP)')).toBeInTheDocument()
      expect(screen.getByText('2.00s')).toBeInTheDocument()
      expect(screen.getByText('Good')).toBeInTheDocument()
    })
  })

  it('should display FID metric', async () => {
    render(<PerformanceMonitor />)
    
    await waitFor(() => {
      expect(screen.getByText('First Input Delay (FID)')).toBeInTheDocument()
      expect(screen.getByText('50ms')).toBeInTheDocument()
      expect(screen.getByText('Good')).toBeInTheDocument()
    })
  })

  it('should display CLS metric', async () => {
    render(<PerformanceMonitor />)
    
    await waitFor(() => {
      expect(screen.getByText('Cumulative Layout Shift (CLS)')).toBeInTheDocument()
      expect(screen.getByText('0.050')).toBeInTheDocument()
      expect(screen.getByText('Good')).toBeInTheDocument()
    })
  })

  it('should display TTFB metric', async () => {
    render(<PerformanceMonitor />)
    
    await waitFor(() => {
      expect(screen.getByText('Time to First Byte (TTFB)')).toBeInTheDocument()
      expect(screen.getByText('600ms')).toBeInTheDocument()
      expect(screen.getByText('Good')).toBeInTheDocument()
    })
  })

  it('should display bundle size information', async () => {
    render(<PerformanceMonitor />)
    
    await waitFor(() => {
      expect(screen.getByText('JavaScript')).toBeInTheDocument()
      expect(screen.getByText('292.97 KB')).toBeInTheDocument()
      expect(screen.getByText('CSS')).toBeInTheDocument()
      expect(screen.getByText('48.83 KB')).toBeInTheDocument()
      expect(screen.getByText('Total')).toBeInTheDocument()
      expect(screen.getByText('341.80 KB')).toBeInTheDocument()
    })
  })

  it('should display performance score', async () => {
    render(<PerformanceMonitor />)
    
    await waitFor(() => {
      expect(screen.getByText('A+')).toBeInTheDocument()
      expect(screen.getByText('Based on Core Web Vitals')).toBeInTheDocument()
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
    vi.mocked(require('@/lib/performance').isPerformanceMonitoringSupported).mockReturnValue(false)
    
    render(<PerformanceMonitor />)
    
    await waitFor(() => {
      expect(screen.getByText('Performance monitoring is not supported in this environment.')).toBeInTheDocument()
    })
  })

  it('should display poor performance metrics', async () => {
    // Mock poor performance metrics
    vi.mocked(require('@/lib/performance').getPerformanceMetrics).mockReturnValue({
      fcp: 4000,
      lcp: 6000,
      fid: 500,
      cls: 0.5,
      ttfb: 2000,
    })
    
    render(<PerformanceMonitor />)
    
    await waitFor(() => {
      expect(screen.getByText('Poor')).toBeInTheDocument()
    })
  })

  it('should display needs improvement metrics', async () => {
    // Mock needs improvement metrics
    vi.mocked(require('@/lib/performance').getPerformanceMetrics).mockReturnValue({
      fcp: 2500,
      lcp: 3500,
      fid: 200,
      cls: 0.2,
      ttfb: 1200,
    })
    
    render(<PerformanceMonitor />)
    
    await waitFor(() => {
      expect(screen.getByText('Needs Improvement')).toBeInTheDocument()
    })
  })
})
