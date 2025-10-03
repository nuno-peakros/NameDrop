import { NextRequest, NextResponse } from 'next/server'
import { searchUsers, createUser } from '@/lib/user-service'
import { validateQueryParams, validateRequestBody, createValidationErrorResponse } from '@/lib/validation'
import { userSchemas } from '@/lib/validation'
import { getSessionFromToken, isAdmin } from '@/lib/auth-service'

// Use Node.js runtime instead of Edge runtime for crypto support
export const runtime = 'nodejs'

/**
 * GET /api/users
 * 
 * Get all users with optional search and filtering (admin only)
 * 
 * @param request - Next.js request object
 * @returns JSON response with paginated user list or error
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/users?page=1&limit=20&search=john&role=user', {
 *   headers: { 'Authorization': 'Bearer <admin_jwt_token>' }
 * });
 * ```
 */
export async function GET(request: NextRequest) {
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
    
    // For demo purposes, check if it's a demo token
    // Check if the token payload contains demo-admin-123
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.id === 'demo-admin-123') {
      // Demo mode - return mock data
      const mockUsers = {
        users: [
          {
            id: 'demo-admin-123',
            firstName: 'Demo',
            lastName: 'Administrator',
            email: 'admin@namedrop.com',
            role: 'admin',
            isActive: true,
            emailVerified: true,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          },
          {
            id: 'demo-user-456',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: 'user',
            isActive: true,
            emailVerified: true,
            createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            lastLoginAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          },
          {
            id: 'demo-user-789',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            role: 'user',
            isActive: false,
            emailVerified: false,
            createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            lastLoginAt: null,
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 3,
          totalPages: 1,
        },
      }
      
      return NextResponse.json(
        {
          success: true,
          data: mockUsers,
          message: 'Demo users retrieved successfully',
        },
        { status: 200 }
      )
      }
    } catch {
      // If token parsing fails, continue to regular validation
    }
    
    // Regular token validation for production
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
            message: 'Admin access required to view users',
          },
        },
        { status: 403 }
      )
    }

    // Parse URL and validate query parameters
    const { searchParams } = new URL(request.url)
    const filtersValidation = validateQueryParams(userSchemas.searchFilters, searchParams)
    const paginationValidation = validateQueryParams(userSchemas.pagination, searchParams)

    if (!filtersValidation.success) {
      return createValidationErrorResponse(filtersValidation.errors)
    }

    if (!paginationValidation.success) {
      return createValidationErrorResponse(paginationValidation.errors)
    }

    const filters = filtersValidation.data
    const pagination = paginationValidation.data

    // Get users with search and pagination
    const usersResult = await searchUsers(filters, pagination)

    if (!usersResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: usersResult.error || 'GET_USERS_FAILED',
            message: usersResult.message,
          },
        },
        { status: 500 }
      )
    }

    // Return successful users response
    return NextResponse.json(
      {
        success: true,
        data: usersResult.data,
        message: usersResult.message,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get users endpoint error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while fetching users',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users
 * 
 * Create new user endpoint (admin only)
 * 
 * @param request - Next.js request object
 * @returns JSON response with user data and temporary password or error
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/users', {
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
    const validation = await validateRequestBody(userSchemas.createUser, request)
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
    console.error('Create user endpoint error:', error)
    
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
