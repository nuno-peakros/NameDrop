import { NextRequest, NextResponse } from 'next/server'
import { reactivateUser } from '@/lib/user-service'
import { validatePathParams, createValidationErrorResponse } from '@/lib/validation'
import { userSchemas } from '@/lib/validation'
import { getSessionFromToken, isAdmin } from '@/lib/auth-service'

/**
 * POST /api/users/[id]/reactivate
 * 
 * Reactivate user account endpoint (admin only)
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing user ID
 * @returns JSON response confirming user reactivation or error
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/users/user-id-here/reactivate', {
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
            message: 'Admin access required to reactivate users',
          },
        },
        { status: 403 }
      )
    }

    // Validate path parameters
    const resolvedParams = await params
    const pathValidation = validatePathParams(userSchemas.userId, resolvedParams)
    if (!pathValidation.success) {
      return createValidationErrorResponse(pathValidation.errors)
    }

    const { id } = pathValidation.data

    // Reactivate user
    const reactivateResult = await reactivateUser(id)

    if (!reactivateResult.success) {
      const statusCode = reactivateResult.error === 'USER_NOT_FOUND' ? 404 : 500
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: reactivateResult.error || 'REACTIVATE_USER_FAILED',
            message: reactivateResult.message,
          },
        },
        { status: statusCode }
      )
    }

    // Return successful user reactivation response
    return NextResponse.json(
      {
        success: true,
        message: reactivateResult.message,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Reactivate user endpoint error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while reactivating user',
        },
      },
      { status: 500 }
    )
  }
}
