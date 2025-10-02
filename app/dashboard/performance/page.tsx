import { PerformanceMonitor } from '@/components/ui/performance-monitor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

/**
 * Performance monitoring dashboard page
 * 
 * This page provides:
 * - Real-time performance metrics
 * - Core Web Vitals monitoring
 * - Bundle size analysis
 * - Performance optimization recommendations
 */
export default function PerformancePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Monitor</h1>
          <p className="text-muted-foreground">
            Monitor and analyze application performance metrics
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Real-time
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <div className="lg:col-span-2">
          <PerformanceMonitor />
        </div>

        {/* Performance Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Optimize Images</h4>
              <p className="text-sm text-muted-foreground">
                Use WebP/AVIF formats and proper sizing to reduce image load times.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Code Splitting</h4>
              <p className="text-sm text-muted-foreground">
                Implement dynamic imports to reduce initial bundle size.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Caching</h4>
              <p className="text-sm text-muted-foreground">
                Leverage browser caching and CDN for static assets.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Lazy Loading</h4>
              <p className="text-sm text-muted-foreground">
                Load components and images only when needed.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Performance Standards */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Standards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">FCP</span>
                <Badge className="bg-green-500">≤ 1.8s</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                First Contentful Paint
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">LCP</span>
                <Badge className="bg-green-500">≤ 2.5s</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Largest Contentful Paint
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">FID</span>
                <Badge className="bg-green-500">≤ 100ms</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                First Input Delay
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CLS</span>
                <Badge className="bg-green-500">≤ 0.1</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Cumulative Layout Shift
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
