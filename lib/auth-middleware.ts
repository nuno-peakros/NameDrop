import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/jwt-utils';
import { db } from '@/lib/db';

/**
 * Authentication middleware utilities for API routes
 * 
 * This module provides utilities for:
 * - Token validation and user extraction
 * - Role-based access control
 * - Session management
 * - Authentication error handling
 */

/**
 * User information extracted from JWT token
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
}

/**
 * Authentication result from middleware
 */
export interface AuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Role-based access control levels
 */
export type AccessLevel = 'public' | 'user' | 'admin';

/**
 * Route access configuration
 */
export interface RouteAccessConfig {
  path: string;
  accessLevel: AccessLevel;
  methods?: string[];
}

/**
 * Predefined route access configurations
 */
export const ROUTE_ACCESS_CONFIGS: RouteAccessConfig[] = [
  // Public routes (no authentication required)
  { path: '/api/health', accessLevel: 'public' },
  { path: '/api/auth/login', accessLevel: 'public' },
  { path: '/api/auth/register', accessLevel: 'public' },
  { path: '/api/auth/verify-email', accessLevel: 'public' },
  { path: '/api/auth/forgot-password', accessLevel: 'public' },
  { path: '/api/auth/reset-password', accessLevel: 'public' },
  
  // User routes (authenticated users)
  { path: '/api/auth/logout', accessLevel: 'user' },
  { path: '/api/auth/change-password', accessLevel: 'user' },
  
  // Admin routes (admin only)
  { path: '/api/users', accessLevel: 'admin' },
  { path: '/api/users/[id]', accessLevel: 'admin' },
  { path: '/api/users/[id]/reactivate', accessLevel: 'admin' },
  { path: '/api/users/[id]/resend-verification', accessLevel: 'admin' },
  { path: '/api/users/[id]/reset-password', accessLevel: 'admin' },
];

/**
 * Extract JWT token from Authorization header
 * 
 * @param request - Next.js request object
 * @returns JWT token or null if not found
 * 
 * @example
 * ```typescript
 * const token = extractTokenFromRequest(request);
 * if (token) {
 *   // Process token
 * }
 * ```
 */
export function extractTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Validate JWT token and extract user information
 * 
 * @param token - JWT token to validate
 * @returns Authentication result with user data or error
 * 
 * @example
 * ```typescript
 * const authResult = await validateAuthentication(token);
 * if (authResult.success) {
 *   console.log('User:', authResult.user);
 * } else {
 *   console.error('Auth failed:', authResult.error);
 * }
 * ```
 */
export async function validateAuthentication(token: string): Promise<AuthResult> {
  try {
    // Validate JWT token
    const validation = await validateToken(token);
    
    if (!validation.isValid || !validation.user) {
      return {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: validation.error || 'Invalid or expired token',
        },
      };
    }

    // Verify user still exists and is active
    const user = await db.user.findUnique({
      where: { id: validation.user.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      };
    }

    if (!user.isActive) {
      return {
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Account is inactive',
        },
      };
    }

    return {
      success: true,
      user: {
        userId: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
      },
    };

  } catch (error) {
    console.error('Authentication validation error:', error);
    return {
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication validation failed',
      },
    };
  }
}

/**
 * Get access level required for a route
 * 
 * @param pathname - Request pathname
 * @param method - HTTP method
 * @returns Required access level or null if not found
 * 
 * @example
 * ```typescript
 * const accessLevel = getRequiredAccessLevel('/api/users', 'GET');
 * if (accessLevel === 'admin') {
 *   // Check admin permissions
 * }
 * ```
 */
export function getRequiredAccessLevel(pathname: string, method: string = 'GET'): AccessLevel | null {
  // Find matching route configuration
  const config = ROUTE_ACCESS_CONFIGS.find(routeConfig => {
    const pathMatch = pathname.startsWith(routeConfig.path);
    const methodMatch = !routeConfig.methods || routeConfig.methods.includes(method);
    return pathMatch && methodMatch;
  });

  return config?.accessLevel || null;
}

/**
 * Check if user has required access level
 * 
 * @param user - Authenticated user
 * @param requiredLevel - Required access level
 * @returns True if user has access
 * 
 * @example
 * ```typescript
 * const hasAccess = checkUserAccess(user, 'admin');
 * if (!hasAccess) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 * }
 * ```
 */
export function checkUserAccess(user: AuthenticatedUser, requiredLevel: AccessLevel): boolean {
  switch (requiredLevel) {
    case 'public':
      return true;
    case 'user':
      return user.isActive && user.emailVerified;
    case 'admin':
      return user.isActive && user.emailVerified && user.role === 'admin';
    default:
      return false;
  }
}

/**
 * Create authentication error response
 * 
 * @param code - Error code
 * @param message - Error message
 * @param status - HTTP status code
 * @returns NextResponse with error
 * 
 * @example
 * ```typescript
 * return createAuthErrorResponse('UNAUTHORIZED', 'Token required', 401);
 * ```
 */
export function createAuthErrorResponse(
  code: string,
  message: string,
  status: number = 401
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

/**
 * Add user information to request headers
 * 
 * @param request - Next.js request
 * @param user - Authenticated user
 * @returns Modified request with user headers
 * 
 * @example
 * ```typescript
 * const modifiedRequest = addUserToRequest(request, user);
 * ```
 */
export function addUserToRequest(request: NextRequest, user: AuthenticatedUser): NextRequest {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', user.userId);
  requestHeaders.set('x-user-email', user.email);
  requestHeaders.set('x-user-role', user.role);
  requestHeaders.set('x-user-active', user.isActive.toString());
  requestHeaders.set('x-user-verified', user.emailVerified.toString());

  return new NextRequest(request.url, {
    method: request.method,
    headers: requestHeaders,
    body: request.body,
  });
}

/**
 * Extract user information from request headers
 * 
 * @param request - Next.js request
 * @returns User information or null if not found
 * 
 * @example
 * ```typescript
 * const user = extractUserFromRequest(request);
 * if (user) {
 *   console.log('Current user:', user.email);
 * }
 * ```
 */
export function extractUserFromRequest(request: NextRequest): AuthenticatedUser | null {
  const userId = request.headers.get('x-user-id');
  const email = request.headers.get('x-user-email');
  const role = request.headers.get('x-user-role') as 'user' | 'admin' | null;
  const isActive = request.headers.get('x-user-active') === 'true';
  const emailVerified = request.headers.get('x-user-verified') === 'true';

  if (!userId || !email || !role) {
    return null;
  }

  return {
    userId,
    email,
    role,
    isActive,
    emailVerified,
  };
}

/**
 * Comprehensive authentication middleware for API routes
 * 
 * @param request - Next.js request
 * @param requiredLevel - Required access level
 * @returns Authentication result or null if public route
 * 
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authResult = await authenticateRequest(request, 'admin');
 *   if (!authResult.success) {
 *     return createAuthErrorResponse(authResult.error!.code, authResult.error!.message);
 *   }
 *   
 *   const user = authResult.user!;
 *   // Process authenticated request
 * }
 * ```
 */
export async function authenticateRequest(
  request: NextRequest,
  requiredLevel: AccessLevel
): Promise<AuthResult | null> {
  // Public routes don't need authentication
  if (requiredLevel === 'public') {
    return null;
  }

  // Extract token from request
  const token = extractTokenFromRequest(request);
  if (!token) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authorization token required',
      },
    };
  }

  // Validate authentication
  const authResult = await validateAuthentication(token);
  if (!authResult.success) {
    return authResult;
  }

  // Check access level
  const hasAccess = checkUserAccess(authResult.user!, requiredLevel);
  if (!hasAccess) {
    return {
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: `${requiredLevel} access required`,
      },
    };
  }

  return authResult;
}

/**
 * Middleware helper for role-based access control
 * 
 * @param user - Authenticated user
 * @param requiredRole - Required role
 * @returns True if user has required role
 * 
 * @example
 * ```typescript
 * if (!hasRole(user, 'admin')) {
 *   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
 * }
 * ```
 */
export function hasRole(user: AuthenticatedUser, requiredRole: 'user' | 'admin'): boolean {
  if (requiredRole === 'admin') {
    return user.role === 'admin';
  }
  return true; // All authenticated users have 'user' role
}

/**
 * Middleware helper for email verification check
 * 
 * @param user - Authenticated user
 * @returns True if user's email is verified
 * 
 * @example
 * ```typescript
 * if (!isEmailVerified(user)) {
 *   return NextResponse.json({ error: 'Email verification required' }, { status: 403 });
 * }
 * ```
 */
export function isEmailVerified(user: AuthenticatedUser): boolean {
  return user.emailVerified;
}

/**
 * Middleware helper for account status check
 * 
 * @param user - Authenticated user
 * @returns True if user account is active
 * 
 * @example
 * ```typescript
 * if (!isAccountActive(user)) {
 *   return NextResponse.json({ error: 'Account is inactive' }, { status: 403 });
 * }
 * ```
 */
export function isAccountActive(user: AuthenticatedUser): boolean {
  return user.isActive;
}
