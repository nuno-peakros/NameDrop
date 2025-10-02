'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  getPerformanceMetrics, 
  getBundleSize, 
  isPerformanceMonitoringSupported 
} from '@/lib/performance'

/**
 * Performance metrics display component
 * 
 * Shows real-time performance metrics including:
 * - Core Web Vitals (FCP, LCP, FID, CLS)
 * - Bundle size information
 * - Performance score
 */
export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<{
    fcp?: number
    lcp?: number
    fid?: number
    cls?: number
    ttfb?: number
    fmp?: number
  }>({})
  const [bundleSize, setBundleSize] = useState({ js: 0, css: 0, total: 0 })
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    setIsSupported(isPerformanceMonitoringSupported())
    
    if (isPerformanceMonitoringSupported()) {
      // Update metrics every 5 seconds
      const interval = setInterval(() => {
        setMetrics(getPerformanceMetrics())
        setBundleSize(getBundleSize())
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [])

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Performance monitoring is not supported in this environment.
          </p>
        </CardContent>
      </Card>
    )
  }

  const getScoreColor = (value: number, thresholds: { good: number; needsImprovement: number }) => {
    if (value <= thresholds.good) return 'bg-green-500'
    if (value <= thresholds.needsImprovement) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getScoreLabel = (value: number, thresholds: { good: number; needsImprovement: number }) => {
    if (value <= thresholds.good) return 'Good'
    if (value <= thresholds.needsImprovement) return 'Needs Improvement'
    return 'Poor'
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className="space-y-4">
      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {metrics.fcp && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">First Contentful Paint (FCP)</span>
              <div className="flex items-center gap-2">
                <Badge 
                  className={getScoreColor(metrics.fcp, { good: 1800, needsImprovement: 3000 })}
                >
                  {getScoreLabel(metrics.fcp, { good: 1800, needsImprovement: 3000 })}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatTime(metrics.fcp)}
                </span>
              </div>
            </div>
          )}

          {metrics.lcp && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Largest Contentful Paint (LCP)</span>
              <div className="flex items-center gap-2">
                <Badge 
                  className={getScoreColor(metrics.lcp, { good: 2500, needsImprovement: 4000 })}
                >
                  {getScoreLabel(metrics.lcp, { good: 2500, needsImprovement: 4000 })}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatTime(metrics.lcp)}
                </span>
              </div>
            </div>
          )}

          {metrics.fid && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">First Input Delay (FID)</span>
              <div className="flex items-center gap-2">
                <Badge 
                  className={getScoreColor(metrics.fid, { good: 100, needsImprovement: 300 })}
                >
                  {getScoreLabel(metrics.fid, { good: 100, needsImprovement: 300 })}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatTime(metrics.fid)}
                </span>
              </div>
            </div>
          )}

          {metrics.cls && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cumulative Layout Shift (CLS)</span>
              <div className="flex items-center gap-2">
                <Badge 
                  className={getScoreColor(metrics.cls, { good: 0.1, needsImprovement: 0.25 })}
                >
                  {getScoreLabel(metrics.cls, { good: 0.1, needsImprovement: 0.25 })}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {metrics.cls.toFixed(3)}
                </span>
              </div>
            </div>
          )}

          {metrics.ttfb && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Time to First Byte (TTFB)</span>
              <div className="flex items-center gap-2">
                <Badge 
                  className={getScoreColor(metrics.ttfb, { good: 800, needsImprovement: 1800 })}
                >
                  {getScoreLabel(metrics.ttfb, { good: 800, needsImprovement: 1800 })}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatTime(metrics.ttfb)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bundle Size */}
      <Card>
        <CardHeader>
          <CardTitle>Bundle Size</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">JavaScript</span>
            <span className="text-sm text-muted-foreground">
              {formatBytes(bundleSize.js)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">CSS</span>
            <span className="text-sm text-muted-foreground">
              {formatBytes(bundleSize.css)}
            </span>
          </div>
          
          <div className="flex items-center justify-between border-t pt-2">
            <span className="text-sm font-medium">Total</span>
            <span className="text-sm font-semibold">
              {formatBytes(bundleSize.total)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {calculatePerformanceScore(metrics)}
            </div>
            <p className="text-sm text-muted-foreground">
              Based on Core Web Vitals
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Refresh Metrics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Calculate overall performance score
 */
function calculatePerformanceScore(metrics: Record<string, number>): string {
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

  if (totalMetrics === 0) return 'N/A'

  const averageScore = Math.round(score / totalMetrics)
  
  if (averageScore >= 90) return 'A+'
  if (averageScore >= 80) return 'A'
  if (averageScore >= 70) return 'B'
  if (averageScore >= 60) return 'C'
  if (averageScore >= 50) return 'D'
  return 'F'
}
