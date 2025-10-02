import { NextRequest, NextResponse } from 'next/server'
import { changePassword } from '@/lib/password-reset'
import { validateRequestBody, createValidationErrorResponse } from '@/lib/validation'
import { authSchemas } from '@/lib/validation'
import { getSessionFromToken } from '@/lib/auth-service'
import { applyRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/auth/change-password
 * 
 * Change password endpoint for authenticated users
 * 
 * @param request - Next.js request object
 * @returns JSON response confirming password change or error
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/auth/change-password', {
 *   method: 'POST',
 *   headers: { 
 *     'Authorization': 'Bearer <jwt_token>',
 *     'Content-Type': 'application/json' 
 *   },
 *   body: JSON.stringify({
 *     currentPassword: 'CurrentPassword123!',
 *     newPassword: 'NewPassword123!'
 *   })
 * });
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authorization token is required',
          },
        },
        { status: 401 }
      )
    }

    // Extract and validate token
    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const session = await getSessionFromToken(token)
    
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired token',
          },
        },
        { status: 401 }
      )
    }

    // Rate limiting per user
    const rateLimitResult = applyRateLimit(request, {
      maxRequests: 5,
      windowMs: 60 * 60 * 1000, // 1 hour
    })

    if (rateLimitResult) {
      return rateLimitResult
    }

    // Validate request body
    const validation = await validateRequestBody(authSchemas.changePassword, request)
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors)
    }

    const { currentPassword, newPassword } = validation.data

    // Change password
    const changeResult = await changePassword(session.userId, currentPassword, newPassword)

    if (!changeResult.success) {
      const statusCode = changeResult.error === 'INVALID_CURRENT_PASSWORD' ? 400 : 500
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: changeResult.error || 'CHANGE_PASSWORD_FAILED',
            message: changeResult.message,
          },
        },
        { status: statusCode }
      )
    }

    // Return successful password change response
    return NextResponse.json(
      {
        success: true,
        message: changeResult.message,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Change password endpoint error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during password change',
        },
      },
      { status: 500 }
    )
  }
}
