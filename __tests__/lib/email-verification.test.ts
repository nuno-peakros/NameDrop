import { describe, it, expect, vi, beforeEach } from 'vitest'
// import { UserRole } from '@prisma/client'
import {
  sendVerificationEmail,
  verifyEmail,
  resendVerificationEmail,
  needsEmailVerification,
  cleanupExpiredTokens,
  getTokenStatus,
  // type EmailVerificationResult,
} from '@/lib/email-verification'
import { db } from '@/lib/db'

// Mock the database module
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    passwordResetToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

// Mock auth utilities
vi.mock('@/lib/auth-utils', () => ({
  generateSecurePassword: vi.fn(),
}))

// Mock email templates
vi.mock('@/lib/email', () => ({
  emailTemplates: {
    sendVerificationEmail: vi.fn(),
  },
}))

/**
 * Unit tests for email verification service
 * 
 * Tests cover:
 * - Email verification token generation
 * - Email verification token validation
 * - Sending verification emails
 * - User account activation
 * - Token cleanup and status checking
 */
describe('Email Verification Service', () => {
  const mockUser = {
    id: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    emailVerified: false,
    isActive: true,
  }

  const mockVerifiedUser = {
    ...mockUser,
    emailVerified: true,
  }

  const mockTokenRecord = {
    id: 'token-123',
    userId: 'user-123',
    token: 'verification-token-123',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    usedAt: null,
    user: mockUser,
  }

  const mockExpiredTokenRecord = {
    ...mockTokenRecord,
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
  }

  const mockUsedTokenRecord = {
    ...mockTokenRecord,
    usedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      // Mock database responses
      vi.mocked(db).user.findUnique.mockResolvedValue({ emailVerified: false })
      vi.mocked(db).passwordResetToken.deleteMany.mockResolvedValue({ count: 0 })
      vi.mocked(db).passwordResetToken.create.mockResolvedValue(mockTokenRecord)

      // Mock auth utilities
      const { generateSecurePassword } = await import('@/lib/auth-utils')
      vi.mocked(generateSecurePassword).mockReturnValue('verification-token-123')

      // Mock email templates
      const { emailTemplates } = await import('@/lib/email')
      vi.mocked(emailTemplates.sendVerificationEmail).mockResolvedValue(undefined)

      const result = await sendVerificationEmail(mockUser)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Verification email sent successfully')

      // Verify database calls
      expect(vi.mocked(db).user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: { emailVerified: true },
      })
      expect(vi.mocked(db).passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          usedAt: null,
        },
      })
      expect(vi.mocked(db).passwordResetToken.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          token: 'verification-token-123',
          expiresAt: expect.any(Date),
        },
      })

      // Verify email was sent
      expect(emailTemplates.sendVerificationEmail).toHaveBeenCalledWith(
        'john@example.com',
        'verification-token-123',
        'John'
      )
    })

    it('should return error if user not found', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue(null)

      const result = await sendVerificationEmail(mockUser)

      expect(result.success).toBe(false)
      expect(result.message).toBe('User not found')
    })

    it('should return error if email already verified', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue({ emailVerified: true })

      const result = await sendVerificationEmail(mockUser)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Email is already verified')
    })

    it('should handle database errors', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue({ emailVerified: false })
      vi.mocked(db).passwordResetToken.deleteMany.mockRejectedValue(new Error('Database error'))

      const result = await sendVerificationEmail(mockUser)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Failed to send verification email')
    })
  })

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      vi.mocked(db).passwordResetToken.findUnique.mockResolvedValue(mockTokenRecord)
      vi.mocked(db).passwordResetToken.update.mockResolvedValue(mockUsedTokenRecord)
      vi.mocked(db).user.update.mockResolvedValue(mockVerifiedUser)

      const result = await verifyEmail('verification-token-123')

      expect(result.success).toBe(true)
      expect(result.message).toBe('Email verified successfully')
      expect(result.user).toEqual(mockVerifiedUser)

      // Verify database calls
      expect(vi.mocked(db).passwordResetToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'verification-token-123' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              emailVerified: true,
              isActive: true,
            },
          },
        },
      })
      expect(vi.mocked(db).passwordResetToken.update).toHaveBeenCalledWith({
        where: { id: 'token-123' },
        data: { usedAt: expect.any(Date) },
      })
      expect(vi.mocked(db).user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { emailVerified: true },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          emailVerified: true,
        },
      })
    })

    it('should return error for invalid token', async () => {
      vi.mocked(db).passwordResetToken.findUnique.mockResolvedValue(null)

      const result = await verifyEmail('invalid-token')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Invalid verification token')
    })

    it('should return error for expired token', async () => {
      vi.mocked(db).passwordResetToken.findUnique.mockResolvedValue(mockExpiredTokenRecord)
      vi.mocked(db).passwordResetToken.delete.mockResolvedValue({})

      const result = await verifyEmail('expired-token')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Verification token has expired')
      expect(vi.mocked(db).passwordResetToken.delete).toHaveBeenCalledWith({
        where: { id: 'token-123' },
      })
    })

    it('should return error for used token', async () => {
      vi.mocked(db).passwordResetToken.findUnique.mockResolvedValue(mockUsedTokenRecord)

      const result = await verifyEmail('used-token')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Verification token has already been used')
    })

    it('should return error for inactive user', async () => {
      const inactiveUserToken = {
        ...mockTokenRecord,
        user: { ...mockUser, isActive: false },
      }
      vi.mocked(db).passwordResetToken.findUnique.mockResolvedValue(inactiveUserToken)

      const result = await verifyEmail('inactive-user-token')

      expect(result.success).toBe(false)
      expect(result.message).toBe('User account is not active')
    })

    it('should return error for already verified user', async () => {
      const verifiedUserToken = {
        ...mockTokenRecord,
        user: mockVerifiedUser,
      }
      vi.mocked(db).passwordResetToken.findUnique.mockResolvedValue(verifiedUserToken)

      const result = await verifyEmail('verified-user-token')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Email is already verified')
    })

    it('should handle database errors', async () => {
      vi.mocked(db).passwordResetToken.findUnique.mockRejectedValue(new Error('Database error'))

      const result = await verifyEmail('verification-token-123')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Email verification failed')
    })
  })

  describe('resendVerificationEmail', () => {
    it('should resend verification email successfully', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue(mockUser)
      vi.mocked(db).passwordResetToken.deleteMany.mockResolvedValue({ count: 0 })
      vi.mocked(db).passwordResetToken.create.mockResolvedValue(mockTokenRecord)

      const { generateSecurePassword } = await import('@/lib/auth-utils')
      vi.mocked(generateSecurePassword).mockReturnValue('verification-token-123')

      const { emailTemplates } = await import('@/lib/email')
      vi.mocked(emailTemplates.sendVerificationEmail).mockResolvedValue(undefined)

      const result = await resendVerificationEmail('user-123')

      expect(result.success).toBe(true)
      expect(result.message).toBe('Verification email sent successfully')

      expect(vi.mocked(db).user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          emailVerified: true,
          isActive: true,
        },
      })
    })

    it('should return error if user not found', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue(null)

      const result = await resendVerificationEmail('nonexistent-user')

      expect(result.success).toBe(false)
      expect(result.message).toBe('User not found')
    })

    it('should return error if user inactive', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue({ ...mockUser, isActive: false })

      const result = await resendVerificationEmail('user-123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('User account is not active')
    })

    it('should return error if email already verified', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue(mockVerifiedUser)

      const result = await resendVerificationEmail('user-123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Email is already verified')
    })
  })

  describe('needsEmailVerification', () => {
    it('should return true for unverified active user', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue({ emailVerified: false, isActive: true })

      const result = await needsEmailVerification('user-123')

      expect(result).toBe(true)
    })

    it('should return false for verified user', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue({ emailVerified: true, isActive: true })

      const result = await needsEmailVerification('user-123')

      expect(result).toBe(false)
    })

    it('should return false for inactive user', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue({ emailVerified: false, isActive: false })

      const result = await needsEmailVerification('user-123')

      expect(result).toBe(false)
    })

    it('should return false if user not found', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue(null)

      const result = await needsEmailVerification('nonexistent-user')

      expect(result).toBe(false)
    })

    it('should return false on database error', async () => {
      vi.mocked(db).user.findUnique.mockRejectedValue(new Error('Database error'))

      const result = await needsEmailVerification('user-123')

      expect(result).toBe(false)
    })
  })

  describe('cleanupExpiredTokens', () => {
    it('should clean up expired tokens', async () => {
      vi.mocked(db).passwordResetToken.deleteMany.mockResolvedValue({ count: 5 })

      const result = await cleanupExpiredTokens()

      expect(result).toBe(5)
      expect(vi.mocked(db).passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date),
          },
        },
      })
    })

    it('should return 0 on database error', async () => {
      vi.mocked(db).passwordResetToken.deleteMany.mockRejectedValue(new Error('Database error'))

      const result = await cleanupExpiredTokens()

      expect(result).toBe(0)
    })
  })

  describe('getTokenStatus', () => {
    it('should return valid token status', async () => {
      vi.mocked(db).passwordResetToken.findUnique.mockResolvedValue({
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        usedAt: null,
      })

      const result = await getTokenStatus('valid-token')

      expect(result).toEqual({
        isValid: true,
        isExpired: false,
        isUsed: false,
        userId: 'user-123',
        expiresAt: expect.any(Date),
      })
    })

    it('should return expired token status', async () => {
      vi.mocked(db).passwordResetToken.findUnique.mockResolvedValue({
        userId: 'user-123',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        usedAt: null,
      })

      const result = await getTokenStatus('expired-token')

      expect(result).toEqual({
        isValid: false,
        isExpired: true,
        isUsed: false,
        userId: 'user-123',
        expiresAt: expect.any(Date),
      })
    })

    it('should return used token status', async () => {
      vi.mocked(db).passwordResetToken.findUnique.mockResolvedValue({
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        usedAt: new Date(),
      })

      const result = await getTokenStatus('used-token')

      expect(result).toEqual({
        isValid: false,
        isExpired: false,
        isUsed: true,
        userId: 'user-123',
        expiresAt: expect.any(Date),
      })
    })

    it('should return invalid status for non-existent token', async () => {
      vi.mocked(db).passwordResetToken.findUnique.mockResolvedValue(null)

      const result = await getTokenStatus('nonexistent-token')

      expect(result).toEqual({
        isValid: false,
        isExpired: false,
        isUsed: false,
      })
    })

    it('should return invalid status on database error', async () => {
      vi.mocked(db).passwordResetToken.findUnique.mockRejectedValue(new Error('Database error'))

      const result = await getTokenStatus('error-token')

      expect(result).toEqual({
        isValid: false,
        isExpired: false,
        isUsed: false,
      })
    })
  })
})
