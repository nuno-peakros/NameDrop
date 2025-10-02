import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-service'
import { validateRequestBody, createValidationErrorResponse } from '@/lib/validation'
import { authSchemas } from '@/lib/validation'
import { applyRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/auth/login
 * 
 * User login endpoint with email and password authentication
 * 
 * @param request - Next.js request object
 * @returns JSON response with user data and JWT token or error
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/auth/login', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     email: 'user@example.com',
 *     password: 'password123'
 *   })
 * });
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = applyRateLimit(request, {
      maxRequests: 50,
      windowMs: 15 * 60 * 1000, // 15 minutes
    })

    if (rateLimitResult) {
      return rateLimitResult
    }

    // Validate request body
    const validation = await validateRequestBody(authSchemas.login, request)
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors)
    }

    const { email, password } = validation.data

    // Authenticate user
    const authResult = await authenticateUser({ email, password })

    if (!authResult.success) {
      const statusCode = authResult.error === 'INVALID_CREDENTIALS' ? 401 : 400
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: authResult.error || 'AUTHENTICATION_FAILED',
            message: authResult.message,
          },
        },
        { status: statusCode }
      )
    }

    // Return successful authentication response
    return NextResponse.json(
      {
        success: true,
        data: authResult.data,
        message: authResult.message,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login endpoint error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during login',
        },
      },
      { status: 500 }
    )
  }
}
