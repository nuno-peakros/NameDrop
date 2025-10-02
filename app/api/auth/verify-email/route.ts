import { NextRequest, NextResponse } from 'next/server'
import { verifyEmail } from '@/lib/email-verification'
import { validateRequestBody, createValidationErrorResponse } from '@/lib/validation'
import { authSchemas } from '@/lib/validation'
import { applyRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/auth/verify-email
 * 
 * Email verification endpoint using verification token
 * 
 * @param request - Next.js request object
 * @returns JSON response confirming email verification or error
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/auth/verify-email', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     token: 'verification-token-here'
 *   })
 * });
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = applyRateLimit(request, {
      maxRequests: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
    })

    if (rateLimitResult) {
      return rateLimitResult
    }

    // Validate request body
    const validation = await validateRequestBody(authSchemas.verifyEmail, request)
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors)
    }

    const { token } = validation.data

    // Verify email token
    const verifyResult = await verifyEmail(token)

    if (!verifyResult.success) {
      const isClientError = verifyResult.message === 'Invalid verification token' ||
                           verifyResult.message === 'Verification token has expired' ||
                           verifyResult.message === 'Verification token has already been used'
      const statusCode = isClientError ? 400 : 500
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: isClientError ? 'INVALID_TOKEN' : 'VERIFICATION_FAILED',
            message: verifyResult.message,
          },
        },
        { status: statusCode }
      )
    }

    // Return successful verification response
    return NextResponse.json(
      {
        success: true,
        message: verifyResult.message,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Verify email endpoint error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during email verification',
        },
      },
      { status: 500 }
    )
  }
}
