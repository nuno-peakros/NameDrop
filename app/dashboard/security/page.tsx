import { SecurityDashboard } from '@/components/ui/security-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

/**
 * Security dashboard page
 * 
 * This page provides:
 * - Security audit results
 * - Threat monitoring
 * - Security metrics
 * - Incident response
 * - Security recommendations
 */
export default function SecurityPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage application security
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Security Score: 85/100
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Dashboard */}
        <div className="lg:col-span-2">
          <SecurityDashboard />
        </div>

        {/* Security Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Security Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Threats</span>
                <Badge className="bg-green-500">0</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                No active security threats detected
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Open Vulnerabilities</span>
                <Badge className="bg-yellow-500">5</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Medium priority issues to address
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Security Events (24h)</span>
                <Badge className="bg-blue-500">12</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Failed login attempts and blocked requests
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Blocked IPs</span>
                <Badge className="bg-red-500">1</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                IP addresses blocked for suspicious activity
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Security Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-red-600">High Priority</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Enable HTTPS enforcement</li>
                <li>• Implement stricter CSP policy</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-yellow-600">Medium Priority</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Enable rate limiting</li>
                <li>• Add security event logging</li>
                <li>• Implement session token rotation</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-green-600">Low Priority</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Add missing security headers</li>
                <li>• Implement security monitoring</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Threat Monitoring */}
        <Card>
          <CardHeader>
            <CardTitle>Threat Monitoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Recent Security Events</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Failed login attempt</span>
                  <span className="text-muted-foreground">2 minutes ago</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Rate limit exceeded</span>
                  <span className="text-muted-foreground">5 minutes ago</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Invalid CSRF token</span>
                  <span className="text-muted-foreground">10 minutes ago</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Blocked IPs</h4>
              <div className="text-sm text-muted-foreground">
                <p>192.168.1.100 - Multiple failed attempts</p>
                <p>10.0.0.50 - Suspicious activity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Tools */}
        <Card>
          <CardHeader>
            <CardTitle>Security Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Available Tools</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Vulnerability Scanner</li>
                <li>• Penetration Testing</li>
                <li>• Security Audit</li>
                <li>• Threat Intelligence</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Last Scan</h4>
              <p className="text-sm text-muted-foreground">
                Completed 2 hours ago
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Next Scan</h4>
              <p className="text-sm text-muted-foreground">
                Scheduled in 22 hours
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
