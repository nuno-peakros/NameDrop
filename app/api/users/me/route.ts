import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromToken } from '@/lib/auth-service'
import { db } from '@/lib/db'

/**
 * GET /api/users/me
 * 
 * Get current user's information
 * 
 * @param request - Next.js request object
 * @returns JSON response with current user data or error
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/users/me', {
 *   headers: { 'Authorization': 'Bearer <jwt_token>' }
 * });
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    console.log('API /users/me: Request received')
    
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    console.log('API /users/me: Auth header present:', !!authHeader)
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('API /users/me: No valid auth header, returning 401')
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
    console.log('API /users/me: Token extracted, length:', token.length)
    
    const session = await getSessionFromToken(token)
    console.log('API /users/me: Session validation result:', session ? 'Valid' : 'Invalid')
    
    if (!session) {
      console.log('API /users/me: Session invalid, returning 401')
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

    // Get user data from database
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        passwordChangedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        },
        { status: 404 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ACCOUNT_INACTIVE',
            message: 'Account is deactivated',
          },
        },
        { status: 403 }
      )
    }

    // Return successful user response
    return NextResponse.json(
      {
        success: true,
        data: user,
        message: 'User data retrieved successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get current user endpoint error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while fetching user data',
        },
      },
      { status: 500 }
    )
  }
}
