import { NextRequest, NextResponse } from 'next/server'
import { sendPasswordResetEmail } from '@/lib/password-reset'
import { validateRequestBody, createValidationErrorResponse } from '@/lib/validation'
import { authSchemas } from '@/lib/validation'
import { applyRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/auth/forgot-password
 * 
 * Request password reset endpoint
 * 
 * @param request - Next.js request object
 * @returns JSON response confirming password reset email sent or error
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/auth/forgot-password', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     email: 'user@example.com'
 *   })
 * });
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = applyRateLimit(request, {
      maxRequests: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
    })

    if (rateLimitResult) {
      return rateLimitResult
    }

    // Validate request body
    const validation = await validateRequestBody(authSchemas.forgotPassword, request)
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors)
    }

    const { email } = validation.data

    // Send password reset email
    const resetResult = await sendPasswordResetEmail(email)

    // Always return success to prevent email enumeration attacks
    // The actual result is logged for debugging purposes
    if (!resetResult.success) {
      console.warn('Password reset failed for email:', email, resetResult.message)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password endpoint error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while processing your request',
        },
      },
      { status: 500 }
    )
  }
}
