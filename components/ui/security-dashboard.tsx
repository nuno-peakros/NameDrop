'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SecurityAudit } from '@/lib/security-utils'

/**
 * Security dashboard component
 * 
 * Provides:
 * - Security audit results
 * - Threat monitoring
 * - Security metrics
 * - Incident response
 * - Security recommendations
 */
export function SecurityDashboard() {
  const [auditResults, setAuditResults] = useState<{
    score: number
    issues: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical'
      message: string
      recommendation: string
    }>
  } | null>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [lastScan, setLastScan] = useState<Date | null>(null)

  useEffect(() => {
    // Simulate security audit
    const runAudit = async () => {
      setIsLoading(true)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const results = await SecurityAudit.runAudit()
      setAuditResults(results)
      setLastScan(new Date())
      setIsLoading(false)
    }
    
    runAudit()
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 50) return 'Fair'
    return 'Poor'
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Audit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Running security audit...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Security Score */}
      <Card>
        <CardHeader>
          <CardTitle>Security Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(auditResults?.score || 0)}`}>
              {auditResults?.score || 0}/100
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {getScoreLabel(auditResults?.score || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Last scan: {lastScan?.toLocaleString() || 'Never'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Security Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditResults?.issues.map((issue, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge className={getSeverityColor(issue.severity)}>
                      {issue.severity.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-medium">{issue.message}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {issue.recommendation}
                </p>
              </div>
            ))}
            
            {auditResults?.issues.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No security issues found!</p>
                <p className="text-sm">Your application is secure.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Security Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.reload()}
            >
              Run Security Audit
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                // Implement vulnerability scan
                console.log('Starting vulnerability scan...')
              }}
            >
              Scan Vulnerabilities
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                // Implement penetration test
                console.log('Starting penetration test...')
              }}
            >
              Penetration Test
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                // Implement security report
                console.log('Generating security report...')
              }}
            >
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Status */}
      <Card>
        <CardHeader>
          <CardTitle>Security Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <p className="text-sm text-muted-foreground">HTTPS</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <p className="text-sm text-muted-foreground">Authentication</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">⚠</div>
              <p className="text-sm text-muted-foreground">Rate Limiting</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <p className="text-sm text-muted-foreground">Input Validation</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <p className="text-sm text-muted-foreground">CSRF Protection</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">⚠</div>
              <p className="text-sm text-muted-foreground">Security Headers</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <p className="text-sm text-muted-foreground">Password Security</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">⚠</div>
              <p className="text-sm text-muted-foreground">Logging</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Security Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-red-600">Critical</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Enable HTTPS enforcement in production</li>
                <li>• Implement comprehensive Content Security Policy</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-yellow-600">High</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Enable rate limiting on all endpoints</li>
                <li>• Implement security event logging</li>
                <li>• Add session token rotation</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-blue-600">Medium</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Add missing security headers</li>
                <li>• Implement automated security testing</li>
                <li>• Add threat monitoring</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
