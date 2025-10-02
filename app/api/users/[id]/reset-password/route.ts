import { NextRequest, NextResponse } from 'next/server'
import { sendPasswordResetEmail } from '@/lib/password-reset'
import { validatePathParams, createValidationErrorResponse } from '@/lib/validation'
import { userSchemas } from '@/lib/validation'
import { getSessionFromToken, isAdmin } from '@/lib/auth-service'
import { applyRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/users/[id]/reset-password
 * 
 * Send password reset email for user endpoint (admin only)
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing user ID
 * @returns JSON response confirming password reset email sent or error
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/users/user-id-here/reset-password', {
 *   method: 'POST',
 *   headers: { 'Authorization': 'Bearer <admin_jwt_token>' }
 * });
 * ```
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Check if user is admin
    if (!isAdmin(session.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Admin access required to send password reset emails',
          },
        },
        { status: 403 }
      )
    }

    // Rate limiting per admin user
    const rateLimitResult = applyRateLimit(request, {
      maxRequests: 5,
      windowMs: 60 * 60 * 1000, // 1 hour
    })

    if (rateLimitResult) {
      return rateLimitResult
    }

    // Validate path parameters
    const resolvedParams = await params
    const pathValidation = validatePathParams(userSchemas.userId, resolvedParams)
    if (!pathValidation.success) {
      return createValidationErrorResponse(pathValidation.errors)
    }

    const { id } = pathValidation.data

    // Get user email from ID (we need to fetch the user first to get their email)
    const { getUserById } = await import('@/lib/user-service')
    const userResult = await getUserById(id)

    if (!userResult.success) {
      const statusCode = userResult.error === 'USER_NOT_FOUND' ? 404 : 500
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: userResult.error || 'GET_USER_FAILED',
            message: userResult.message,
          },
        },
        { status: statusCode }
      )
    }

    const userEmail = userResult.data!.email

    // Send password reset email
    const resetResult = await sendPasswordResetEmail(userEmail)

    // Always return success to prevent email enumeration attacks
    // The actual result is logged for debugging purposes
    if (!resetResult.success) {
      console.warn('Password reset failed for user ID:', id, resetResult.message)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'If the user account exists, a password reset link has been sent.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Reset password endpoint error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while sending password reset email',
        },
      },
      { status: 500 }
    )
  }
}
