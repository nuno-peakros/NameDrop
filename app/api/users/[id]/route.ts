import { NextRequest, NextResponse } from 'next/server'
import { getUserById, updateUser, deactivateUser } from '@/lib/user-service'
import { validatePathParams, validateRequestBody, createValidationErrorResponse } from '@/lib/validation'
import { userSchemas } from '@/lib/validation'
import { getSessionFromToken, isAdmin } from '@/lib/auth-service'

// Use Node.js runtime instead of Edge runtime for crypto support
export const runtime = 'nodejs'

/**
 * GET /api/users/[id]
 * 
 * Get user by ID endpoint (admin only)
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing user ID
 * @returns JSON response with user data or error
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/users/user-id-here', {
 *   headers: { 'Authorization': 'Bearer <admin_jwt_token>' }
 * });
 * ```
 */
export async function GET(
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
            message: 'Admin access required to view user details',
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

    // Get user by ID
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

    // Return successful user response
    return NextResponse.json(
      {
        success: true,
        data: userResult.data,
        message: userResult.message,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get user by ID endpoint error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while fetching user',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/users/[id]
 * 
 * Update user endpoint (admin only)
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing user ID
 * @returns JSON response with updated user data or error
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/users/user-id-here', {
 *   method: 'PUT',
 *   headers: { 
 *     'Authorization': 'Bearer <admin_jwt_token>',
 *     'Content-Type': 'application/json' 
 *   },
 *   body: JSON.stringify({
 *     firstName: 'Jane',
 *     lastName: 'Smith',
 *     role: 'admin'
 *   })
 * });
 * ```
 */
export async function PUT(
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
            message: 'Admin access required to update users',
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

    // Validate request body
    const validation = await validateRequestBody(userSchemas.updateUser, request)
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors)
    }

    const updateData = validation.data

    // Update user
    const updateResult = await updateUser(id, updateData)

    if (!updateResult.success) {
      const statusCode = updateResult.error === 'USER_NOT_FOUND' ? 404 : 
                        updateResult.error === 'EMAIL_EXISTS' ? 409 : 500
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: updateResult.error || 'UPDATE_USER_FAILED',
            message: updateResult.message,
          },
        },
        { status: statusCode }
      )
    }

    // Return successful user update response
    return NextResponse.json(
      {
        success: true,
        data: updateResult.data,
        message: updateResult.message,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update user endpoint error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while updating user',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/[id]
 * 
 * Deactivate user endpoint (admin only)
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing user ID
 * @returns JSON response confirming user deactivation or error
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/users/user-id-here', {
 *   method: 'DELETE',
 *   headers: { 'Authorization': 'Bearer <admin_jwt_token>' }
 * });
 * ```
 */
export async function DELETE(
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
            message: 'Admin access required to deactivate users',
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

    // Prevent admin from deactivating themselves
    if (id === session.userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_OPERATION',
            message: 'Cannot deactivate your own account',
          },
        },
        { status: 400 }
      )
    }

    // Deactivate user
    const deactivateResult = await deactivateUser(id)

    if (!deactivateResult.success) {
      const statusCode = deactivateResult.error === 'USER_NOT_FOUND' ? 404 : 500
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: deactivateResult.error || 'DEACTIVATE_USER_FAILED',
            message: deactivateResult.message,
          },
        },
        { status: statusCode }
      )
    }

    // Return successful user deactivation response
    return NextResponse.json(
      {
        success: true,
        message: deactivateResult.message,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete user endpoint error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while deactivating user',
        },
      },
      { status: 500 }
    )
  }
}
