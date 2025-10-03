import jwt from 'jsonwebtoken'
import { config } from '@/lib/config'
import { Prisma, $Enums } from '@prisma/client'

type User = Prisma.UserGetPayload<Record<string, never>>
type UserRole = $Enums.UserRole

/**
 * JWT token utilities for authentication and authorization
 * 
 * This module provides secure JWT token handling including:
 * - Token generation and signing
 * - Token verification and validation
 * - Token payload typing
 * - Token expiration management
 */

/**
 * JWT token payload interface
 */
export interface TokenPayload {
  /** User ID */
  id: string
  /** User email */
  email: string
  /** User role */
  role: UserRole
  /** Email verification status */
  emailVerified: boolean
  /** Password change timestamp */
  passwordChangedAt: string | null
  /** Token issued at timestamp */
  iat: number
  /** Token expiration timestamp */
  exp: number
}

/**
 * JWT token configuration
 */
const JWT_CONFIG = {
  /** Default token expiration time in seconds (7 days) */
  DEFAULT_EXPIRES_IN: 7 * 24 * 60 * 60,
  /** Short-lived token expiration time in seconds (1 hour) */
  SHORT_EXPIRES_IN: 60 * 60,
  /** Algorithm used for signing tokens */
  ALGORITHM: 'HS256' as const,
} as const

/**
 * Generate a JWT token for a user
 * 
 * @param user - User object to create token for
 * @param expiresIn - Token expiration time in seconds (default: 7 days)
 * @returns Signed JWT token
 * 
 * @throws {Error} If token generation fails
 * 
 * @example
 * ```typescript
 * const token = await generateToken(user, 3600); // 1 hour
 * console.log(token); // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * ```
 */
export function generateToken(user: Pick<User, 'id' | 'email' | 'role' | 'emailVerified' | 'passwordChangedAt'>, expiresIn: number = JWT_CONFIG.DEFAULT_EXPIRES_IN): string {
  try {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      passwordChangedAt: user.passwordChangedAt?.toISOString() || null,
    }

    return jwt.sign(payload, config.auth.jwtSecret, {
      expiresIn,
      algorithm: JWT_CONFIG.ALGORITHM,
    })
    } catch (error) {
    throw new Error(`Failed to generate token: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate a short-lived token (e.g., for password reset)
 * 
 * @param user - User object to create token for
 * @returns Short-lived JWT token (1 hour)
 * 
 * @example
 * ```typescript
 * const resetToken = generateShortToken(user);
 * // Use for password reset links
 * ```
 */
export function generateShortToken(user: Pick<User, 'id' | 'email' | 'role' | 'emailVerified' | 'passwordChangedAt'>): string {
  return generateToken(user, JWT_CONFIG.SHORT_EXPIRES_IN)
}

/**
 * Verify and decode a JWT token
 * 
 * @param token - JWT token to verify
 * @returns Decoded token payload if valid
 * 
 * @throws {Error} If token is invalid, expired, or malformed
 * 
 * @example
 * ```typescript
 * try {
 *   const payload = verifyToken(token);
 *   console.log('User ID:', payload.id);
 * } catch (error) {
 *   console.error('Invalid token:', error.message);
 * }
 * ```
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret, {
      algorithms: [JWT_CONFIG.ALGORITHM],
    }) as TokenPayload

    return payload
    } catch (_error) {
    if (_error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired')
    } else if (_error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token')
    } else {
      throw new Error(`Token verification failed: ${_error instanceof Error ? _error.message : 'Unknown error'}`)
    }
  }
}

/**
 * Decode a JWT token without verification (for debugging)
 * 
 * @param token - JWT token to decode
 * @returns Decoded token payload (not verified)
 * 
 * @example
 * ```typescript
 * const payload = decodeToken(token);
 * console.log('Token expires at:', new Date(payload.exp * 1000));
 * ```
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload
    return decoded
    } catch (_error) {
    console.error('Token decode error:', _error)
    return null
  }
}

/**
 * Check if a token is expired
 * 
 * @param token - JWT token to check
 * @returns True if token is expired, false otherwise
 * 
 * @example
 * ```typescript
 * if (isTokenExpired(token)) {
 *   // Redirect to login
 * }
 * ```
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeToken(token)
    if (!payload) return true

    const now = Math.floor(Date.now() / 1000)
    return payload.exp < now
    } catch {
    return true
  }
}

/**
 * Get token expiration date
 * 
 * @param token - JWT token to check
 * @returns Date when token expires, or null if invalid
 * 
 * @example
 * ```typescript
 * const expiresAt = getTokenExpiration(token);
 * if (expiresAt) {
 *   console.log('Token expires at:', expiresAt.toISOString());
 * }
 * ```
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const payload = decodeToken(token)
    if (!payload) return null

    return new Date(payload.exp * 1000)
    } catch {
    return null
  }
}

/**
 * Extract token from Authorization header
 * 
 * @param authHeader - Authorization header value
 * @returns Extracted token or null if not found
 * 
 * @example
 * ```typescript
 * const token = extractTokenFromHeader('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
 * if (token) {
 *   const payload = verifyToken(token);
 * }
 * ```
 */
export function extractTokenFromHeader(authHeader: string | null | undefined): string | null {
  if (!authHeader) return null

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1]
}

/**
 * Create a token refresh payload (for extending sessions)
 * 
 * @param user - User object
 * @returns New token with extended expiration
 * 
 * @example
 * ```typescript
 * const newToken = refreshToken(user);
 * // Use to extend user session
 * ```
 */
export function refreshToken(user: Pick<User, 'id' | 'email' | 'role' | 'emailVerified' | 'passwordChangedAt'>): string {
  return generateToken(user, JWT_CONFIG.DEFAULT_EXPIRES_IN)
}

/**
 * Validate token payload structure
 * 
 * @param payload - Token payload to validate
 * @returns True if payload is valid, false otherwise
 * 
 * @example
 * ```typescript
 * const isValid = validateTokenPayload(payload);
 * if (!isValid) {
 *   // Handle invalid payload
 * }
 * ```
 */
export function validateTokenPayload(payload: unknown): payload is TokenPayload {
  if (typeof payload !== 'object' || payload === null) return false;
  const obj = payload as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.role === 'string' &&
    typeof obj.emailVerified === 'boolean' &&
    (obj.passwordChangedAt === null || typeof obj.passwordChangedAt === 'string') &&
    typeof obj.iat === 'number' &&
    typeof obj.exp === 'number'
  );
}

/**
 * Get token time until expiration in seconds
 * 
 * @param token - JWT token to check
 * @returns Seconds until expiration, or 0 if expired/invalid
 * 
 * @example
 * ```typescript
 * const timeLeft = getTokenTimeLeft(token);
 * if (timeLeft < 3600) { // Less than 1 hour
 *   // Consider refreshing token
 * }
 * ```
 */
export function getTokenTimeLeft(token: string): number {
  try {
    const payload = decodeToken(token)
    if (!payload) return 0

    const now = Math.floor(Date.now() / 1000)
    const timeLeft = payload.exp - now

    return Math.max(0, timeLeft)
    } catch {
    return 0
  }
}

/**
 * Check if user role has admin privileges
 * 
 * @param role - User role to check
 * @returns True if role has admin privileges
 * 
 * @example
 * ```typescript
 * if (isAdminRole(payload.role)) {
 *   // Allow admin operations
 * }
 * ```
 */
export function isAdminRole(role: UserRole): boolean {
  return role === 'admin'
}

/**
 * Check if user role has user privileges
 * 
 * @param role - User role to check
 * @returns True if role has user privileges
 * 
 * @example
 * ```typescript
 * if (isUserRole(payload.role)) {
 *   // Allow user operations
 * }
 * ```
 */
export function isUserRole(role: UserRole): boolean {
  return role === 'user' || role === 'admin'
}

/**
 * Validation result interface for token validation
 */
export interface TokenValidationResult {
  /** Whether the token is valid */
  isValid: boolean
  /** Error message if validation failed */
  error?: string
  /** User information if token is valid */
  user?: {
    userId: string
    email: string
    role: UserRole
  }
}

/**
 * Validate a JWT token and return structured validation result
 * 
 * This function is designed for middleware use and provides a consistent
 * validation result structure with user information.
 * 
 * @param token - JWT token to validate
 * @returns Validation result with user information if valid
 * 
 * @example
 * ```typescript
 * const result = await validateToken(token);
 * if (result.isValid) {
 *   console.log('User ID:', result.user?.userId);
 * } else {
 *   console.error('Validation failed:', result.error);
 * }
 * ```
 */
export async function validateToken(token: string): Promise<TokenValidationResult> {
  try {
    // Verify the token
    const payload = verifyToken(token)
    
    // Validate payload structure
    if (!validateTokenPayload(payload)) {
      return {
        isValid: false,
        error: 'Invalid token payload structure'
      }
    }
    
    // Check if token is expired
    if (isTokenExpired(token)) {
      return {
        isValid: false,
        error: 'Token has expired'
      }
    }
    
    // Return successful validation with user info
    return {
      isValid: true,
      user: {
        userId: payload.id,
        email: payload.email,
        role: payload.role
      }
    }
    } catch (_error) {
    return {
      isValid: false,
      error: _error instanceof Error ? _error.message : 'Token validation failed'
    }
  }
}
