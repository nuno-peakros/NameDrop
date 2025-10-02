import { NextRequest, NextResponse } from 'next/server'
import { resetPassword } from '@/lib/password-reset'
import { validateRequestBody, createValidationErrorResponse } from '@/lib/validation'
import { authSchemas } from '@/lib/validation'
import { applyRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/auth/reset-password
 * 
 * Reset password with token endpoint
 * 
 * @param request - Next.js request object
 * @returns JSON response confirming password reset or error
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/auth/reset-password', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     token: 'reset-token-here',
 *     newPassword: 'NewPassword123!'
 *   })
 * });
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = applyRateLimit(request, {
      maxRequests: 5,
      windowMs: 60 * 60 * 1000, // 1 hour
    })

    if (rateLimitResult) {
      return rateLimitResult
    }

    // Validate request body
    const validation = await validateRequestBody(authSchemas.resetPassword, request)
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors)
    }

    const { token, newPassword } = validation.data

    // Reset password with token
    const resetResult = await resetPassword(token, newPassword)

    if (!resetResult.success) {
      const isClientError = resetResult.message === 'Invalid reset token' || 
                           resetResult.message === 'Reset token has expired' ||
                           resetResult.message === 'Reset token has already been used'
      const statusCode = isClientError ? 400 : 500
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: isClientError ? 'INVALID_TOKEN' : 'RESET_PASSWORD_FAILED',
            message: resetResult.message,
          },
        },
        { status: statusCode }
      )
    }

    // Return successful password reset response
    return NextResponse.json(
      {
        success: true,
        message: resetResult.message,
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
          message: 'An unexpected error occurred during password reset',
        },
      },
      { status: 500 }
    )
  }
}
