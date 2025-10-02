import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserStats } from '@/lib/user-service'

/**
 * GET /api/health
 * 
 * Health check endpoint for monitoring and load balancer health checks
 * 
 * @returns JSON response with comprehensive health status
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/health');
 * const health = await response.json();
 * console.log('Health status:', health.data.status);
 * ```
 */
export async function GET() {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()
  
  try {
    // Check database connectivity
    let databaseStatus = 'unhealthy'
    let databaseResponseTime = 0
    let databaseError: string | undefined

    try {
      const dbStartTime = Date.now()
      await db.$queryRaw`SELECT 1`
      databaseResponseTime = Date.now() - dbStartTime
      databaseStatus = databaseResponseTime < 1000 ? 'healthy' : 'degraded'
    } catch (error) {
      databaseError = error instanceof Error ? error.message : 'Database connection failed'
      databaseStatus = 'unhealthy'
    }

    // Check email service (basic check - just verify environment variables)
    let emailStatus = 'unhealthy'
    let emailResponseTime = 0
    let emailError: string | undefined

    try {
      const emailStartTime = Date.now()
      // Basic check - verify required environment variables are present
      const hasEmailConfig = !!(process.env.RESEND_API_KEY && process.env.FROM_EMAIL)
      emailResponseTime = Date.now() - emailStartTime
      emailStatus = hasEmailConfig ? 'healthy' : 'degraded'
    } catch (error) {
      emailError = error instanceof Error ? error.message : 'Email service configuration error'
      emailStatus = 'unhealthy'
    }

    // Get user statistics
    let userStats
    try {
      userStats = await getUserStats()
    } catch (error) {
      console.warn('Failed to get user stats:', error)
      userStats = {
        activeUsers: 0,
        totalUsers: 0,
        verifiedUsers: 0,
        adminUsers: 0,
      }
    }

    // Determine overall health status
    const overallStatus = 
      databaseStatus === 'unhealthy' || emailStatus === 'unhealthy' ? 'unhealthy' :
      databaseStatus === 'degraded' || emailStatus === 'degraded' ? 'degraded' :
      'healthy'

    const healthCheck = {
      success: true,
      data: {
        status: overallStatus,
        timestamp,
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        services: {
          database: {
            status: databaseStatus,
            responseTime: databaseResponseTime,
            lastChecked: timestamp,
            ...(databaseError && { error: databaseError }),
          },
          email: {
            status: emailStatus,
            responseTime: emailResponseTime,
            lastChecked: timestamp,
            ...(emailError && { error: emailError }),
          },
        },
        metrics: {
          activeUsers: userStats.activeUsers,
          totalUsers: userStats.totalUsers,
          requestsPerMinute: 0, // Would need request tracking to implement
          averageResponseTime: Date.now() - startTime,
        },
        ...(overallStatus !== 'healthy' && {
          errors: [
            ...(databaseStatus !== 'healthy' ? ['Database service issues'] : []),
            ...(emailStatus !== 'healthy' ? ['Email service issues'] : []),
          ],
        }),
      },
    }

    const statusCode = overallStatus === 'unhealthy' ? 503 : 200
    return NextResponse.json(healthCheck, { status: statusCode })
  } catch (error) {
    console.error('Health check failed:', error)
    
    const errorResponse = {
      success: false,
      data: {
        status: 'unhealthy',
        timestamp,
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        services: {
          database: {
            status: 'unhealthy',
            responseTime: 0,
            lastChecked: timestamp,
            error: 'Health check failed',
          },
          email: {
            status: 'unhealthy',
            responseTime: 0,
            lastChecked: timestamp,
            error: 'Health check failed',
          },
        },
        errors: ['Health check system failure'],
      },
    }

    return NextResponse.json(errorResponse, { status: 503 })
  }
}
