/**
 * Security middleware
 * 
 * This module provides:
 * - Security headers middleware
 * - Rate limiting middleware
 * - CSRF protection middleware
 * - Input validation middleware
 * - Security logging middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  SecurityHeaders, 
  RateLimiter, 
  CSRFProtection, 
  InputSanitizer,
  XSSPrevention 
} from './security-utils'

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Add security headers
  const headers = SecurityHeaders.getSecurityHeaders()
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const corsHeaders = SecurityHeaders.getCORSHeaders()
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }
  
  return response
}

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  
  if (!RateLimiter.checkRateLimit(identifier)) {
    return new NextResponse('Rate limit exceeded', { 
      status: 429,
      headers: {
        'Retry-After': '900', // 15 minutes
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + 15 * 60 * 1000).toISOString()
      }
    })
  }
  
  const remaining = RateLimiter.getRemainingRequests(identifier)
  const response = NextResponse.next()
  
  response.headers.set('X-RateLimit-Limit', '100')
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', new Date(Date.now() + 15 * 60 * 1000).toISOString())
  
  return response
}

/**
 * CSRF protection middleware
 */
export function csrfProtectionMiddleware(request: NextRequest) {
  // Skip CSRF check for GET requests
  if (request.method === 'GET') {
    return NextResponse.next()
  }
  
  // Skip CSRF check for public API endpoints
  const publicEndpoints = ['/api/health', '/api/auth/login', '/api/auth/register']
  if (publicEndpoints.includes(request.nextUrl.pathname)) {
    return NextResponse.next()
  }
  
  const csrfToken = request.headers.get('X-CSRF-Token')
  const sessionToken = request.cookies.get('csrf-token')?.value
  
  if (!csrfToken || !sessionToken) {
    return new NextResponse('CSRF token missing', { status: 403 })
  }
  
  if (!CSRFProtection.verifyToken(csrfToken, sessionToken)) {
    return new NextResponse('Invalid CSRF token', { status: 403 })
  }
  
  return NextResponse.next()
}

/**
 * Input validation middleware
 */
export function inputValidationMiddleware(request: NextRequest) {
  // Skip validation for GET requests
  if (request.method === 'GET') {
    return NextResponse.next()
  }
  
  try {
    // Validate request body
    const body = request.body
    if (body) {
      // This would need to be implemented based on the specific endpoint
      // For now, we'll just check for basic XSS patterns
      const bodyText = JSON.stringify(body)
      if (XSSPrevention.detectXSS(bodyText)) {
        return new NextResponse('Invalid input detected', { status: 400 })
      }
    }
    
    // Validate query parameters
    const searchParams = request.nextUrl.searchParams
    for (const [key, value] of searchParams.entries()) {
      if (XSSPrevention.detectXSS(value)) {
        return new NextResponse('Invalid query parameter', { status: 400 })
      }
    }
    
    return NextResponse.next()
  } catch (error) {
    return new NextResponse('Invalid request', { status: 400 })
  }
}

/**
 * Security logging middleware
 */
export function securityLoggingMiddleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Log security events
  const securityEvent = {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    ip: getClientIP(request),
    referer: request.headers.get('referer'),
    status: response.status
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Security Event:', securityEvent)
  }
  
  // In production, this would be sent to a logging service
  // logSecurityEvent(securityEvent)
  
  return response
}

/**
 * File upload security middleware
 */
export function fileUploadSecurityMiddleware(request: NextRequest) {
  // Only apply to file upload endpoints
  if (!request.nextUrl.pathname.includes('/upload')) {
    return NextResponse.next()
  }
  
  const contentType = request.headers.get('content-type')
  if (!contentType || !contentType.includes('multipart/form-data')) {
    return new NextResponse('Invalid content type', { status: 400 })
  }
  
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
    return new NextResponse('File too large', { status: 413 })
  }
  
  return NextResponse.next()
}

/**
 * Authentication security middleware
 */
export function authSecurityMiddleware(request: NextRequest) {
  // Skip auth check for public endpoints
  const publicEndpoints = ['/api/health', '/api/auth/login', '/api/auth/register']
  if (publicEndpoints.includes(request.nextUrl.pathname)) {
    return NextResponse.next()
  }
  
  // Check for authentication token
  const authHeader = request.headers.get('authorization')
  const sessionToken = request.cookies.get('session-token')?.value
  
  if (!authHeader && !sessionToken) {
    return new NextResponse('Authentication required', { status: 401 })
  }
  
  // Validate token format
  if (authHeader && !authHeader.startsWith('Bearer ')) {
    return new NextResponse('Invalid authentication format', { status: 401 })
  }
  
  return NextResponse.next()
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  const ip = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // Use IP and User-Agent for identification
  return `${ip}:${userAgent}`
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return request.ip || 'unknown'
}

/**
 * Comprehensive security middleware
 */
export function securityMiddleware(request: NextRequest) {
  try {
    // Apply all security middleware in order
    let response = securityHeadersMiddleware(request)
    if (response.status !== 200) return response
    
    response = rateLimitMiddleware(request)
    if (response.status !== 200) return response
    
    response = csrfProtectionMiddleware(request)
    if (response.status !== 200) return response
    
    response = inputValidationMiddleware(request)
    if (response.status !== 200) return response
    
    response = fileUploadSecurityMiddleware(request)
    if (response.status !== 200) return response
    
    response = authSecurityMiddleware(request)
    if (response.status !== 200) return response
    
    response = securityLoggingMiddleware(request)
    
    return response
  } catch (error) {
    console.error('Security middleware error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

/**
 * Security middleware for API routes
 */
export function apiSecurityMiddleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Add API-specific security headers
  response.headers.set('X-API-Version', '1.0.0')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Add CORS headers
  const corsHeaders = SecurityHeaders.getCORSHeaders()
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

/**
 * Security middleware for static files
 */
export function staticFileSecurityMiddleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Add security headers for static files
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  
  return response
}
