import { NextRequest, NextResponse } from 'next/server'
import { logoutUser, getSessionFromToken } from '@/lib/auth-service'

/**
 * POST /api/auth/logout
 * 
 * User logout endpoint that invalidates the current session
 * 
 * @param request - Next.js request object
 * @returns JSON response confirming logout
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/auth/logout', {
 *   method: 'POST',
 *   headers: { 
 *     'Authorization': 'Bearer <jwt_token>',
 *     'Content-Type': 'application/json' 
 *   }
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

    // Extract token
    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Validate token and get user session
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

    // Logout user
    const logoutResult = await logoutUser(session.userId)

    if (!logoutResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LOGOUT_FAILED',
            message: logoutResult.message,
          },
        },
        { status: 500 }
      )
    }

    // Return successful logout response
    return NextResponse.json(
      {
        success: true,
        message: logoutResult.message,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Logout endpoint error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during logout',
        },
      },
      { status: 500 }
    )
  }
}
