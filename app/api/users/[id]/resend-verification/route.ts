import { NextRequest, NextResponse } from 'next/server'
import { sendUserEmailVerification } from '@/lib/auth-service'
import { validatePathParams, createValidationErrorResponse } from '@/lib/validation'
import { userSchemas } from '@/lib/validation'
import { getSessionFromToken, isAdmin } from '@/lib/auth-service'
import { applyRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/users/[id]/resend-verification
 * 
 * Resend email verification for user endpoint (admin only)
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing user ID
 * @returns JSON response confirming verification email sent or error
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/users/user-id-here/resend-verification', {
 *   method: 'POST',
 *   headers: { 'Authorization': 'Bearer <admin_jwt_token>' }
 * });
 * ```
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
            message: 'Admin access required to resend verification emails',
          },
        },
        { status: 403 }
      )
    }

    // Rate limiting per admin user
    const rateLimitResult = applyRateLimit(request, {
      maxRequests: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
    })

    if (rateLimitResult) {
      return rateLimitResult
    }

    // Validate path parameters
    const pathValidation = validatePathParams(userSchemas.userId, params)
    if (!pathValidation.success) {
      return createValidationErrorResponse(pathValidation.errors)
    }

    const { id } = pathValidation.data

    // Resend verification email
    const verificationResult = await sendUserEmailVerification(id)

    if (!verificationResult.success) {
      const statusCode = verificationResult.message.includes('not found') ? 404 : 500
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SEND_VERIFICATION_FAILED',
            message: verificationResult.message,
          },
        },
        { status: statusCode }
      )
    }

    // Return successful verification email response
    return NextResponse.json(
      {
        success: true,
        message: verificationResult.message,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Resend verification endpoint error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while sending verification email',
        },
      },
      { status: 500 }
    )
  }
}
