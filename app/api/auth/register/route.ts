import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/user-service'
import { validateRequestBody, createValidationErrorResponse } from '@/lib/validation'
import { authSchemas } from '@/lib/validation'
import { getSessionFromToken, isAdmin } from '@/lib/auth-service'

/**
 * POST /api/auth/register
 * 
 * Create new user endpoint (admin only)
 * 
 * @param request - Next.js request object
 * @returns JSON response with user data and temporary password or error
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/auth/register', {
 *   method: 'POST',
 *   headers: { 
 *     'Authorization': 'Bearer <admin_jwt_token>',
 *     'Content-Type': 'application/json' 
 *   },
 *   body: JSON.stringify({
 *     firstName: 'John',
 *     lastName: 'Doe',
 *     email: 'john@example.com',
 *     role: 'user'
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

    // Check if user is admin
    if (!isAdmin(session.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Admin access required to create users',
          },
        },
        { status: 403 }
      )
    }

    // Validate request body
    const validation = await validateRequestBody(authSchemas.register, request)
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors)
    }

    const userData = validation.data

    // Create user
    const createResult = await createUser(userData)

    if (!createResult.success) {
      const statusCode = createResult.error === 'EMAIL_EXISTS' ? 409 : 400
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: createResult.error || 'CREATE_USER_FAILED',
            message: createResult.message,
          },
        },
        { status: statusCode }
      )
    }

    // Return successful user creation response
    return NextResponse.json(
      {
        success: true,
        data: createResult.data,
        message: createResult.message,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register endpoint error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during user creation',
        },
      },
      { status: 500 }
    )
  }
}
