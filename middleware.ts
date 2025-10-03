import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimit, getRateLimitConfigs } from '@/lib/rate-limit'
import { validateToken } from '@/lib/jwt-utils'

/**
 * Next.js middleware for request processing
 * 
 * This middleware handles:
 * - Rate limiting for API routes
 * - Authentication for protected routes
 * - CORS headers
 * - Request logging
 */

/**
 * Rate limit configurations
 */
const RATE_LIMIT_CONFIGS = getRateLimitConfigs()

/**
 * Check if a path is an API route
 * 
 * @param pathname - Request pathname
 * @returns True if path is an API route
 */
function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

/**
 * Check if a path is a protected route
 * 
 * @param pathname - Request pathname
 * @returns True if path requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    '/api/users',
    '/api/users/me',
    '/api/auth/change-password',
    '/api/auth/logout',
  ]
  
  return protectedRoutes.some(route => pathname.startsWith(route))
}

/**
 * Check if a path is a public route
 * 
 * @param pathname - Request pathname
 * @returns True if path is public (no auth required)
 */
// function isPublicRoute(pathname: string): boolean {
//   const publicRoutes = [
//     '/api/health',
//     '/api/auth/login',
//     '/api/auth/register',
//     '/api/auth/verify-email',
//     '/api/auth/forgot-password',
//     '/api/auth/reset-password',
//   ]
//   
//   return publicRoutes.some(route => pathname.startsWith(route))
// }

/**
 * Get rate limit configuration for a path
 * 
 * @param pathname - Request pathname
 * @returns Rate limit configuration
 */
function getRateLimitConfigForPath(pathname: string) {
  if (pathname.startsWith('/api/auth/login')) {
    return RATE_LIMIT_CONFIGS.login
  }
  
  if (pathname.startsWith('/api/auth/forgot-password') || 
      pathname.startsWith('/api/auth/reset-password')) {
    return RATE_LIMIT_CONFIGS.passwordReset
  }
  
  if (pathname.startsWith('/api/health')) {
    return RATE_LIMIT_CONFIGS.health
  }
  
  if (isApiRoute(pathname)) {
    return RATE_LIMIT_CONFIGS.api
  }
  
  return null
}

/**
 * Extract token from Authorization header
 * 
 * @param request - Next.js request
 * @returns JWT token or null
 */
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }
  
  return parts[1]
}

/**
 * Create CORS headers
 * 
 * @param request - Next.js request
 * @returns CORS headers
 */
function createCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    'http://localhost:3000',
    'https://namedrop.example.com',
    // Add your production domains here
  ]
  
  const isAllowedOrigin = origin && allowedOrigins.includes(origin)
  
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  }
}

/**
 * Handle OPTIONS request (CORS preflight)
 * 
 * @param request - Next.js request
 * @returns CORS response
 */
function handleOptionsRequest(request: NextRequest): NextResponse {
  const corsHeaders = createCorsHeaders(request)
  
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}

/**
 * Handle authentication for protected routes
 * 
 * @param request - Next.js request
 * @returns Authentication response or null if allowed
 */
async function handleAuthentication(request: NextRequest): Promise<NextResponse | null> {
  const token = extractToken(request)
  
  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization token required',
        },
      },
      { status: 401 }
    )
  }
  
  try {
    const validation = await validateToken(token)
    
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: validation.error || 'Invalid token',
          },
        },
        { status: 401 }
      )
    }
    
    // Add user information to request headers for API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', validation.user!.userId)
    requestHeaders.set('x-user-email', validation.user!.email)
    requestHeaders.set('x-user-role', validation.user!.role)
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Authentication failed',
        },
      },
      { status: 401 }
    )
  }
}

/**
 * Main middleware function
 * 
 * @param request - Next.js request
 * @returns Next.js response
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl
  
  console.log('Middleware: Processing request to', pathname, 'Method:', request.method)
  
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    console.log('Middleware: Handling OPTIONS request')
    return handleOptionsRequest(request)
  }
  
  // Only process API routes
  if (!isApiRoute(pathname)) {
    console.log('Middleware: Not an API route, passing through')
    return NextResponse.next()
  }
  
  console.log('Middleware: Processing API route:', pathname)
  
  // Apply rate limiting
  const rateLimitConfig = getRateLimitConfigForPath(pathname)
  if (rateLimitConfig) {
    const rateLimitResponse = applyRateLimit(request, rateLimitConfig)
    if (rateLimitResponse) {
      return rateLimitResponse
    }
  }
  
  // Skip authentication in middleware for now - let API routes handle it
  // This avoids Edge Runtime crypto issues
  // if (isProtectedRoute(pathname)) {
  //   const authResponse = await handleAuthentication(request)
  //   if (authResponse) {
  //     return authResponse
  //   }
  // }
  
  // Add CORS headers to all API responses
  const response = NextResponse.next()
  const corsHeaders = createCorsHeaders(request)
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
