import { describe, it, expect, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'
import { UserRole } from '@prisma/client'
import {
  generateToken,
  generateShortToken,
  verifyToken,
  decodeToken,
  isTokenExpired,
  getTokenExpiration,
  extractTokenFromHeader,
  refreshToken,
  validateTokenPayload,
  getTokenTimeLeft,
  isAdminRole,
  isUserRole,
  type TokenPayload,
} from '@/lib/jwt-utils'

/**
 * Unit tests for JWT token utilities
 * 
 * Tests cover:
 * - Token generation and signing
 * - Token verification and validation
 * - Token expiration handling
 * - Token extraction from headers
 * - Role-based access control
 * - Token payload validation
 */
describe('JWT Utils', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'user' as UserRole,
    emailVerified: true,
    passwordChangedAt: new Date('2023-01-01T00:00:00Z'),
  }

  // const mockAdminUser = {
  //   id: 'admin-123',
  //   email: 'admin@example.com',
  //   role: 'admin' as UserRole,
  //   emailVerified: true,
  //   passwordChangedAt: new Date('2023-01-01T00:00:00Z'),
  // }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockUser)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should generate token with custom expiration', () => {
      const token = generateToken(mockUser, 3600) // 1 hour
      
      expect(token).toBeDefined()
      
      // Decode and check expiration
      const decoded = jwt.decode(token) as Record<string, unknown>
      // const now = Math.floor(Date.now() / 1000)
      const expiration = decoded.exp - decoded.iat
      
      expect(expiration).toBe(3600)
    })

    it('should include all user data in token', () => {
      const token = generateToken(mockUser)
      const decoded = decodeToken(token)
      
      expect(decoded).toBeDefined()
      expect(decoded?.id).toBe(mockUser.id)
      expect(decoded?.email).toBe(mockUser.email)
      expect(decoded?.role).toBe(mockUser.role)
      expect(decoded?.emailVerified).toBe(mockUser.emailVerified)
      expect(decoded?.passwordChangedAt).toBe(mockUser.passwordChangedAt.toISOString())
    })

    it('should handle null passwordChangedAt', () => {
      const userWithoutPasswordChange = { ...mockUser, passwordChangedAt: null }
      const token = generateToken(userWithoutPasswordChange)
      const decoded = decodeToken(token)
      
      expect(decoded?.passwordChangedAt).toBe(null)
    })

    it('should throw error on generation failure', () => {
      // Mock jwt.sign to throw an error
      vi.spyOn(jwt, 'sign').mockImplementationOnce(() => {
        throw new Error('Signing failed')
      })
      
      expect(() => generateToken(mockUser)).toThrow('Failed to generate token: Signing failed')
    })
  })

  describe('generateShortToken', () => {
    it('should generate short-lived token', () => {
      const token = generateShortToken(mockUser)
      
      expect(token).toBeDefined()
      
      // Decode and check expiration (should be 1 hour)
      const decoded = jwt.decode(token) as Record<string, unknown>
      // const now = Math.floor(Date.now() / 1000)
      const expiration = decoded.exp - decoded.iat
      
      expect(expiration).toBe(3600) // 1 hour in seconds
    })
  })

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = generateToken(mockUser)
      const payload = verifyToken(token)
      
      expect(payload).toBeDefined()
      expect(payload.id).toBe(mockUser.id)
      expect(payload.email).toBe(mockUser.email)
      expect(payload.role).toBe(mockUser.role)
    })

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here'
      
      expect(() => verifyToken(invalidToken)).toThrow('Invalid token')
    })

    it('should throw error for expired token', () => {
      // Generate token with very short expiration
      const token = generateToken(mockUser, 1) // 1 second
      
      // Wait for token to expire
      setTimeout(() => {
        expect(() => verifyToken(token)).toThrow('Token has expired')
      }, 1100)
    })

    it('should throw error for malformed token', () => {
      const malformedToken = 'not.a.valid.jwt'
      
      expect(() => verifyToken(malformedToken)).toThrow('Invalid token')
    })
  })

  describe('decodeToken', () => {
    it('should decode valid token', () => {
      const token = generateToken(mockUser)
      const payload = decodeToken(token)
      
      expect(payload).toBeDefined()
      expect(payload?.id).toBe(mockUser.id)
      expect(payload?.email).toBe(mockUser.email)
    })

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here'
      const payload = decodeToken(invalidToken)
      
      expect(payload).toBeNull()
    })

    it('should return null for malformed token', () => {
      const malformedToken = 'not.a.valid.jwt'
      const payload = decodeToken(malformedToken)
      
      expect(payload).toBeNull()
    })
  })

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const token = generateToken(mockUser)
      const expired = isTokenExpired(token)
      
      expect(expired).toBe(false)
    })

    it('should return true for expired token', () => {
      const token = generateToken(mockUser, 1) // 1 second
      
      // Wait for token to expire
      setTimeout(() => {
        const expired = isTokenExpired(token)
        expect(expired).toBe(true)
      }, 1100)
    })

    it('should return true for invalid token', () => {
      const invalidToken = 'invalid.token.here'
      const expired = isTokenExpired(invalidToken)
      
      expect(expired).toBe(true)
    })
  })

  describe('getTokenExpiration', () => {
    it('should return expiration date for valid token', () => {
      const token = generateToken(mockUser)
      const expiration = getTokenExpiration(token)
      
      expect(expiration).toBeDefined()
      expect(expiration).toBeInstanceOf(Date)
      expect(expiration!.getTime()).toBeGreaterThan(Date.now())
    })

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here'
      const expiration = getTokenExpiration(invalidToken)
      
      expect(expiration).toBeNull()
    })
  })

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      const header = `Bearer ${token}`
      
      const extracted = extractTokenFromHeader(header)
      
      expect(extracted).toBe(token)
    })

    it('should return null for invalid header format', () => {
      const header = 'InvalidHeader token'
      
      const extracted = extractTokenFromHeader(header)
      
      expect(extracted).toBeNull()
    })

    it('should return null for null header', () => {
      const extracted = extractTokenFromHeader(null)
      
      expect(extracted).toBeNull()
    })

    it('should return null for undefined header', () => {
      const extracted = extractTokenFromHeader(undefined)
      
      expect(extracted).toBeNull()
    })

    it('should return null for empty header', () => {
      const extracted = extractTokenFromHeader('')
      
      expect(extracted).toBeNull()
    })
  })

  describe('refreshToken', () => {
    it('should generate new token with default expiration', () => {
      const newToken = refreshToken(mockUser)
      
      expect(newToken).toBeDefined()
      expect(typeof newToken).toBe('string')
      
      // Should be a valid token
      const payload = verifyToken(newToken)
      expect(payload.id).toBe(mockUser.id)
    })
  })

  describe('validateTokenPayload', () => {
    it('should validate correct payload', () => {
      const validPayload: TokenPayload = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        emailVerified: true,
        passwordChangedAt: '2023-01-01T00:00:00.000Z',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      }
      
      const isValid = validateTokenPayload(validPayload)
      
      expect(isValid).toBe(true)
    })

    it('should reject invalid payload with missing fields', () => {
      const invalidPayload = {
        id: 'user-123',
        email: 'test@example.com',
        // Missing required fields
      }
      
      const isValid = validateTokenPayload(invalidPayload)
      
      expect(isValid).toBe(false)
    })

    it('should reject payload with wrong types', () => {
      const invalidPayload = {
        id: 123, // Should be string
        email: 'test@example.com',
        role: 'user',
        emailVerified: 'true', // Should be boolean
        passwordChangedAt: null,
        iat: 'invalid', // Should be number
        exp: 'invalid', // Should be number
      }
      
      const isValid = validateTokenPayload(invalidPayload)
      
      expect(isValid).toBe(false)
    })

    it('should accept null passwordChangedAt', () => {
      const validPayload: TokenPayload = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        emailVerified: true,
        passwordChangedAt: null,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      }
      
      const isValid = validateTokenPayload(validPayload)
      
      expect(isValid).toBe(true)
    })
  })

  describe('getTokenTimeLeft', () => {
    it('should return time left for valid token', () => {
      const token = generateToken(mockUser, 3600) // 1 hour
      const timeLeft = getTokenTimeLeft(token)
      
      expect(timeLeft).toBeGreaterThan(0)
      expect(timeLeft).toBeLessThanOrEqual(3600)
    })

    it('should return 0 for expired token', () => {
      const token = generateToken(mockUser, 1) // 1 second
      
      // Wait for token to expire
      setTimeout(() => {
        const timeLeft = getTokenTimeLeft(token)
        expect(timeLeft).toBe(0)
      }, 1100)
    })

    it('should return 0 for invalid token', () => {
      const invalidToken = 'invalid.token.here'
      const timeLeft = getTokenTimeLeft(invalidToken)
      
      expect(timeLeft).toBe(0)
    })
  })

  describe('isAdminRole', () => {
    it('should return true for admin role', () => {
      const isAdmin = isAdminRole('admin')
      expect(isAdmin).toBe(true)
    })

    it('should return false for user role', () => {
      const isAdmin = isAdminRole('user')
      expect(isAdmin).toBe(false)
    })
  })

  describe('isUserRole', () => {
    it('should return true for user role', () => {
      const isUser = isUserRole('user')
      expect(isUser).toBe(true)
    })

    it('should return true for admin role', () => {
      const isUser = isUserRole('admin')
      expect(isUser).toBe(true)
    })

    it('should return false for invalid role', () => {
      const isUser = isUserRole('invalid' as UserRole)
      expect(isUser).toBe(false)
    })
  })
})
