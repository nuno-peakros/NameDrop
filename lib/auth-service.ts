import { db } from '@/lib/db'
import { verifyPassword, shouldChangePassword } from '@/lib/auth-utils'
import { generateToken, verifyToken, isTokenExpired } from '@/lib/jwt-utils'
import { sendVerificationEmail } from '@/lib/email-verification'
import { Prisma, $Enums } from '@prisma/client'

type User = Prisma.UserGetPayload<Record<string, never>>
type UserRole = $Enums.UserRole

/**
 * Authentication service for user login and session management
 * 
 * This service handles:
 * - User authentication (login)
 * - Session management
 * - Token validation
 * - User authorization checks
 * - Authentication result handling
 */

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string
  password: string
}

/**
 * Authentication result
 */
export interface AuthResult {
  success: boolean
  message: string
  data?: {
    user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role' | 'emailVerified' | 'passwordChangedAt'>
    token: string
    expiresAt: string
    needsPasswordChange?: boolean
  }
  error?: string
}

/**
 * Session data
 */
export interface SessionData {
  userId: string
  email: string
  role: UserRole
  emailVerified: boolean
  passwordChangedAt: string | null
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  isValid: boolean
  user?: SessionData
  error?: string
}

/**
 * Authenticate user with email and password
 * 
 * @param credentials - User login credentials
 * @returns Promise resolving to authentication result
 * 
 * @example
 * ```typescript
 * const result = await authenticateUser({
 *   email: 'user@example.com',
 *   password: 'password123'
 * });
 * 
 * if (result.success) {
 *   console.log('User authenticated:', result.data?.user);
 *   console.log('Token:', result.data?.token);
 * }
 * ```
 */
export async function authenticateUser(credentials: LoginCredentials): Promise<AuthResult> {
  try {
    const { email, password } = credentials

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
        emailVerified: true,
        passwordChangedAt: true,
      },
    })

    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS',
      }
    }

    // Check if user is active
    if (!user.isActive) {
      return {
        success: false,
        message: 'Account is deactivated',
        error: 'ACCOUNT_INACTIVE',
      }
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return {
        success: false,
        message: 'Email address must be verified before logging in',
        error: 'EMAIL_NOT_VERIFIED',
      }
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash)
    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS',
      }
    }

    // Generate JWT token
    const token = generateToken(user)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Check if password needs to be changed
    const needsPasswordChange = shouldChangePassword(user.passwordChangedAt)

    // Remove password hash from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _passwordHash, ...userWithoutPassword } = user

    return {
      success: true,
      message: 'Authentication successful',
      data: {
        user: userWithoutPassword,
        token,
        expiresAt: expiresAt.toISOString(),
        needsPasswordChange,
      },
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      message: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: 'AUTHENTICATION_FAILED',
    }
  }
}

/**
 * Validate JWT token and return user session data
 * 
 * @param token - JWT token to validate
 * @returns Promise resolving to token validation result
 * 
 * @example
 * ```typescript
 * const result = await validateToken(token);
 * if (result.isValid) {
 *   console.log('User session:', result.user);
 * }
 * ```
 */
export async function validateToken(token: string): Promise<TokenValidationResult> {
  try {
    // Verify token
    const payload = verifyToken(token)

    // Check if token is expired
    if (isTokenExpired(token)) {
      return {
        isValid: false,
        error: 'Token has expired',
      }
    }

    // Get current user data to ensure account is still active
    const user = await db.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        passwordChangedAt: true,
      },
    })

    if (!user) {
      return {
        isValid: false,
        error: 'User not found',
      }
    }

    if (!user.isActive) {
      return {
        isValid: false,
        error: 'Account is deactivated',
      }
    }

    // Check if password was changed after token was issued
    if (user.passwordChangedAt && payload.passwordChangedAt) {
      const tokenPasswordChangedAt = new Date(payload.passwordChangedAt)
      if (user.passwordChangedAt > tokenPasswordChangedAt) {
        return {
          isValid: false,
          error: 'Password was changed, please login again',
        }
      }
    }

    return {
      isValid: true,
      user: {
        userId: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        passwordChangedAt: user.passwordChangedAt?.toISOString() || null,
      },
    }
  } catch (error) {
    console.error('Token validation error:', error)
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid token',
    }
  }
}

/**
 * Refresh user session (extend token)
 * 
 * @param userId - User ID
 * @returns Promise resolving to new token data
 * 
 * @example
 * ```typescript
 * const result = await refreshSession(userId);
 * if (result.success) {
 *   console.log('New token:', result.data?.token);
 * }
 * ```
 */
export async function refreshSession(userId: string): Promise<AuthResult> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        passwordChangedAt: true,
      },
    })

    if (!user) {
      return {
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      }
    }

    if (!user.isActive) {
      return {
        success: false,
        message: 'Account is deactivated',
        error: 'ACCOUNT_INACTIVE',
      }
    }

    // Generate new token
    const token = generateToken(user)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    return {
      success: true,
      message: 'Session refreshed successfully',
      data: {
        user,
        token,
        expiresAt: expiresAt.toISOString(),
      },
    }
  } catch (error) {
    console.error('Refresh session error:', error)
    return {
      success: false,
      message: `Failed to refresh session: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: 'REFRESH_SESSION_FAILED',
    }
  }
}

/**
 * Logout user (invalidate session)
 * 
 * @param userId - User ID
 * @returns Promise resolving to logout result
 * 
 * @example
 * ```typescript
 * const result = await logoutUser(userId);
 * if (result.success) {
 *   console.log('User logged out');
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function logoutUser(_userId: string): Promise<{ success: boolean; message: string }> {
  // _userId parameter is kept for future implementation (token blacklisting, session cleanup)
  try {
    // In a more sophisticated system, you might want to:
    // 1. Store invalidated tokens in a blacklist
    // 2. Remove user sessions from database
    // 3. Clear any server-side session data
    
    // For now, we'll just return success since JWT tokens are stateless
    // The client should remove the token from storage
    
    return {
      success: true,
      message: 'Logged out successfully',
    }
  } catch (error) {
    console.error('Logout error:', error)
    return {
      success: false,
      message: `Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Check if user has required role
 * 
 * @param userRole - User's role
 * @param requiredRole - Required role
 * @returns True if user has required role or higher
 * 
 * @example
 * ```typescript
 * const isAdmin = hasRole('admin', 'admin'); // true
 * const canAccess = hasRole('user', 'admin'); // false
 * ```
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  if (requiredRole === 'admin') {
    return userRole === 'admin'
  }
  
  // For now, both 'user' and 'admin' can access user-level resources
  return userRole === 'user' || userRole === 'admin'
}

/**
 * Check if user is admin
 * 
 * @param userRole - User's role
 * @returns True if user is admin
 * 
 * @example
 * ```typescript
 * const isAdmin = isAdmin(userRole);
 * if (isAdmin) {
 *   // Allow admin operations
 * }
 * ```
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === 'admin'
}

/**
 * Get user session from token
 * 
 * @param token - JWT token
 * @returns Promise resolving to user session data or null
 * 
 * @example
 * ```typescript
 * const session = await getSessionFromToken(token);
 * if (session) {
 *   console.log('User ID:', session.userId);
 * }
 * ```
 */
export async function getSessionFromToken(token: string): Promise<SessionData | null> {
  try {
    const validation = await validateToken(token)
    
    if (!validation.isValid || !validation.user) {
      return null
    }

    return validation.user
  } catch (error) {
    console.error('Get session from token error:', error)
    return null
  }
}

/**
 * Check if user needs email verification
 * 
 * @param userId - User ID
 * @returns Promise resolving to true if user needs email verification
 * 
 * @example
 * ```typescript
 * const needsVerification = await needsEmailVerification(userId);
 * if (needsVerification) {
 *   // Send verification email
 * }
 * ```
 */
export async function needsEmailVerification(userId: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true, isActive: true },
    })

    return !!(user && user.isActive && !user.emailVerified)
  } catch (error) {
    console.error('Check email verification error:', error)
    return false
  }
}

/**
 * Send email verification for user
 * 
 * @param userId - User ID
 * @returns Promise resolving to send result
 * 
 * @example
 * ```typescript
 * const result = await sendUserEmailVerification(userId);
 * if (result.success) {
 *   console.log('Verification email sent');
 * }
 * ```
 */
export async function sendUserEmailVerification(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        isActive: true,
      },
    })

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      }
    }

    if (!user.isActive) {
      return {
        success: false,
        message: 'Account is not active',
      }
    }

    if (user.emailVerified) {
      return {
        success: false,
        message: 'Email is already verified',
      }
    }

    const result = await sendVerificationEmail(user)
    return {
      success: result.success,
      message: result.message,
    }
  } catch (error) {
    console.error('Send email verification error:', error)
    return {
      success: false,
      message: `Failed to send verification email: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Check if user needs password change
 * 
 * @param userId - User ID
 * @returns Promise resolving to true if user needs password change
 * 
 * @example
 * ```typescript
 * const needsChange = await needsPasswordChange(userId);
 * if (needsChange) {
 *   // Prompt user to change password
 * }
 * ```
 */
export async function needsPasswordChange(userId: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { passwordChangedAt: true },
    })

    if (!user) {
      return false
    }

    return shouldChangePassword(user.passwordChangedAt)
  } catch (error) {
    console.error('Check password change error:', error)
    return false
  }
}
