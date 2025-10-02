import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserRole } from '@prisma/client'
import {
  sendPasswordResetEmail,
  resetPassword,
  adminResetPassword,
  changePassword,
  validateResetToken,
  cleanupExpiredResetTokens,
  getPasswordChangeHistory,
  type PasswordResetResult,
} from '@/lib/password-reset'

// Mock the database
const mockDb = {
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
  $transaction: vi.fn(),
}

// Mock the database module
vi.mock('@/lib/db', () => ({
  db: mockDb,
}))

// Mock auth utilities
vi.mock('@/lib/auth-utils', () => ({
  generateSecurePassword: vi.fn(),
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}))

// Mock email templates
vi.mock('@/lib/email', () => ({
  emailTemplates: {
    sendPasswordResetEmail: vi.fn(),
    sendTemporaryPasswordEmail: vi.fn(),
  },
}))

/**
 * Unit tests for password reset service
 * 
 * Tests cover:
 * - Password reset token generation
 * - Password reset token validation
 * - Sending password reset emails
 * - Password reset completion
 * - Admin password reset functionality
 * - Password change functionality
 */
describe('Password Reset Service', () => {
  const mockUser = {
    id: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    passwordHash: 'hashed-password',
    isActive: true,
    emailVerified: true,
  }

  const mockInactiveUser = {
    ...mockUser,
    isActive: false,
  }

  const mockUnverifiedUser = {
    ...mockUser,
    emailVerified: false,
  }

  const mockTokenRecord = {
    id: 'token-123',
    userId: 'user-123',
    token: 'reset-token-123',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    usedAt: null,
    user: mockUser,
  }

  const mockExpiredTokenRecord = {
    ...mockTokenRecord,
    expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
  }

  const mockUsedTokenRecord = {
    ...mockTokenRecord,
    usedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      // Mock database responses
      mockDb.user.findUnique.mockResolvedValue(mockUser)
      mockDb.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 })
      mockDb.passwordResetToken.create.mockResolvedValue(mockTokenRecord)

      // Mock auth utilities
      const { generateSecurePassword } = await import('@/lib/auth-utils')
      vi.mocked(generateSecurePassword).mockReturnValue('reset-token-123')

      // Mock email templates
      const { emailTemplates } = await import('@/lib/email')
      vi.mocked(emailTemplates.sendPasswordResetEmail).mockResolvedValue(undefined)

      const result = await sendPasswordResetEmail('john@example.com')

      expect(result.success).toBe(true)
      expect(result.message).toBe('Password reset email sent successfully')

      // Verify database calls
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          emailVerified: true,
        },
      })
      expect(mockDb.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          usedAt: null,
        },
      })
      expect(mockDb.passwordResetToken.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          token: 'reset-token-123',
          expiresAt: expect.any(Date),
        },
      })

      // Verify email was sent
      expect(emailTemplates.sendPasswordResetEmail).toHaveBeenCalledWith(
        'john@example.com',
        'reset-token-123',
        'John'
      )
    })

    it('should return success for non-existent user (security)', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)

      const result = await sendPasswordResetEmail('nonexistent@example.com')

      expect(result.success).toBe(true)
      expect(result.message).toBe('If an account with that email exists, a password reset email has been sent')
    })

    it('should return error for inactive user', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockInactiveUser)

      const result = await sendPasswordResetEmail('john@example.com')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Account is not active')
    })

    it('should return error for unverified user', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUnverifiedUser)

      const result = await sendPasswordResetEmail('john@example.com')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Email address must be verified before resetting password')
    })

    it('should handle database errors', async () => {
      mockDb.user.findUnique.mockRejectedValue(new Error('Database error'))

      const result = await sendPasswordResetEmail('john@example.com')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Failed to send password reset email')
    })
  })

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      mockDb.passwordResetToken.findUnique.mockResolvedValue(mockTokenRecord)
      mockDb.$transaction.mockImplementation(async (callback) => {
        return await callback({
          user: {
            update: vi.fn().mockResolvedValue({}),
          },
          passwordResetToken: {
            update: vi.fn().mockResolvedValue({}),
          },
        })
      })

      const { hashPassword } = await import('@/lib/auth-utils')
      vi.mocked(hashPassword).mockResolvedValue('new-hashed-password')

      const result = await resetPassword('reset-token-123', 'newPassword123')

      expect(result.success).toBe(true)
      expect(result.message).toBe('Password reset successfully')

      expect(mockDb.passwordResetToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'reset-token-123' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isActive: true,
              emailVerified: true,
            },
          },
        },
      })
      expect(hashPassword).toHaveBeenCalledWith('newPassword123')
    })

    it('should return error for invalid token', async () => {
      mockDb.passwordResetToken.findUnique.mockResolvedValue(null)

      const result = await resetPassword('invalid-token', 'newPassword123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Invalid reset token')
    })

    it('should return error for expired token', async () => {
      mockDb.passwordResetToken.findUnique.mockResolvedValue(mockExpiredTokenRecord)
      mockDb.passwordResetToken.delete.mockResolvedValue({})

      const result = await resetPassword('expired-token', 'newPassword123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Reset token has expired')
      expect(mockDb.passwordResetToken.delete).toHaveBeenCalledWith({
        where: { id: 'token-123' },
      })
    })

    it('should return error for used token', async () => {
      mockDb.passwordResetToken.findUnique.mockResolvedValue(mockUsedTokenRecord)

      const result = await resetPassword('used-token', 'newPassword123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Reset token has already been used')
    })

    it('should return error for inactive user', async () => {
      const inactiveUserToken = {
        ...mockTokenRecord,
        user: mockInactiveUser,
      }
      mockDb.passwordResetToken.findUnique.mockResolvedValue(inactiveUserToken)

      const result = await resetPassword('inactive-user-token', 'newPassword123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('User account is not active')
    })

    it('should return error for unverified user', async () => {
      const unverifiedUserToken = {
        ...mockTokenRecord,
        user: mockUnverifiedUser,
      }
      mockDb.passwordResetToken.findUnique.mockResolvedValue(unverifiedUserToken)

      const result = await resetPassword('unverified-user-token', 'newPassword123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Email address must be verified before resetting password')
    })

    it('should handle database errors', async () => {
      mockDb.passwordResetToken.findUnique.mockRejectedValue(new Error('Database error'))

      const result = await resetPassword('reset-token-123', 'newPassword123')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Password reset failed')
    })
  })

  describe('adminResetPassword', () => {
    it('should reset password as admin successfully', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser)
      mockDb.user.update.mockResolvedValue({})

      const { generateSecurePassword, hashPassword } = await import('@/lib/auth-utils')
      vi.mocked(generateSecurePassword).mockReturnValue('tempPassword123')
      vi.mocked(hashPassword).mockResolvedValue('hashed-temp-password')

      const { emailTemplates } = await import('@/lib/email')
      vi.mocked(emailTemplates.sendTemporaryPasswordEmail).mockResolvedValue(undefined)

      const result = await adminResetPassword('user-123')

      expect(result.success).toBe(true)
      expect(result.message).toBe('Password reset successfully. Temporary password sent to user.')
      expect(result.temporaryPassword).toBe('tempPassword123')

      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          emailVerified: true,
        },
      })
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          passwordHash: 'hashed-temp-password',
          passwordChangedAt: expect.any(Date),
        },
      })
      expect(emailTemplates.sendTemporaryPasswordEmail).toHaveBeenCalledWith(
        'john@example.com',
        'tempPassword123',
        'John'
      )
    })

    it('should return error if user not found', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)

      const result = await adminResetPassword('nonexistent-user')

      expect(result.success).toBe(false)
      expect(result.message).toBe('User not found')
    })

    it('should return error for inactive user', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockInactiveUser)

      const result = await adminResetPassword('user-123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('User account is not active')
    })

    it('should handle database errors', async () => {
      mockDb.user.findUnique.mockRejectedValue(new Error('Database error'))

      const result = await adminResetPassword('user-123')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Password reset failed')
    })
  })

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser)
      mockDb.user.update.mockResolvedValue({})

      const { verifyPassword, hashPassword } = await import('@/lib/auth-utils')
      vi.mocked(verifyPassword).mockResolvedValue(true)
      vi.mocked(hashPassword).mockResolvedValue('new-hashed-password')

      const result = await changePassword('user-123', 'currentPassword', 'newPassword123')

      expect(result.success).toBe(true)
      expect(result.message).toBe('Password changed successfully')

      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          passwordHash: true,
          isActive: true,
        },
      })
      expect(verifyPassword).toHaveBeenCalledWith('currentPassword', 'hashed-password')
      expect(hashPassword).toHaveBeenCalledWith('newPassword123')
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          passwordHash: 'new-hashed-password',
          passwordChangedAt: expect.any(Date),
        },
      })
    })

    it('should return error if user not found', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)

      const result = await changePassword('nonexistent-user', 'currentPassword', 'newPassword123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('User not found')
    })

    it('should return error for inactive user', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockInactiveUser)

      const result = await changePassword('user-123', 'currentPassword', 'newPassword123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('User account is not active')
    })

    it('should return error for incorrect current password', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser)

      const { verifyPassword } = await import('@/lib/auth-utils')
      vi.mocked(verifyPassword).mockResolvedValue(false)

      const result = await changePassword('user-123', 'wrongPassword', 'newPassword123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Current password is incorrect')
    })

    it('should handle database errors', async () => {
      mockDb.user.findUnique.mockRejectedValue(new Error('Database error'))

      const result = await changePassword('user-123', 'currentPassword', 'newPassword123')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Password change failed')
    })
  })

  describe('validateResetToken', () => {
    it('should return valid token status', async () => {
      mockDb.passwordResetToken.findUnique.mockResolvedValue({
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        usedAt: null,
      })

      const result = await validateResetToken('valid-token')

      expect(result).toEqual({
        isValid: true,
        isExpired: false,
        isUsed: false,
        userId: 'user-123',
        expiresAt: expect.any(Date),
      })
    })

    it('should return expired token status', async () => {
      mockDb.passwordResetToken.findUnique.mockResolvedValue({
        userId: 'user-123',
        expiresAt: new Date(Date.now() - 60 * 60 * 1000),
        usedAt: null,
      })

      const result = await validateResetToken('expired-token')

      expect(result).toEqual({
        isValid: false,
        isExpired: true,
        isUsed: false,
        userId: 'user-123',
        expiresAt: expect.any(Date),
      })
    })

    it('should return used token status', async () => {
      mockDb.passwordResetToken.findUnique.mockResolvedValue({
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        usedAt: new Date(),
      })

      const result = await validateResetToken('used-token')

      expect(result).toEqual({
        isValid: false,
        isExpired: false,
        isUsed: true,
        userId: 'user-123',
        expiresAt: expect.any(Date),
      })
    })

    it('should return invalid status for non-existent token', async () => {
      mockDb.passwordResetToken.findUnique.mockResolvedValue(null)

      const result = await validateResetToken('nonexistent-token')

      expect(result).toEqual({
        isValid: false,
        isExpired: false,
        isUsed: false,
      })
    })

    it('should return invalid status on database error', async () => {
      mockDb.passwordResetToken.findUnique.mockRejectedValue(new Error('Database error'))

      const result = await validateResetToken('error-token')

      expect(result).toEqual({
        isValid: false,
        isExpired: false,
        isUsed: false,
      })
    })
  })

  describe('cleanupExpiredResetTokens', () => {
    it('should clean up expired tokens', async () => {
      mockDb.passwordResetToken.deleteMany.mockResolvedValue({ count: 3 })

      const result = await cleanupExpiredResetTokens()

      expect(result).toBe(3)
      expect(mockDb.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date),
          },
        },
      })
    })

    it('should return 0 on database error', async () => {
      mockDb.passwordResetToken.deleteMany.mockRejectedValue(new Error('Database error'))

      const result = await cleanupExpiredResetTokens()

      expect(result).toBe(0)
    })
  })

  describe('getPasswordChangeHistory', () => {
    it('should return password change history for user with changed password', async () => {
      const userWithPasswordChange = {
        passwordChangedAt: new Date('2023-01-01T00:00:00Z'),
      }
      mockDb.user.findUnique.mockResolvedValue(userWithPasswordChange)

      const result = await getPasswordChangeHistory('user-123')

      expect(result).toEqual({
        lastChanged: new Date('2023-01-01T00:00:00Z'),
        needsChange: false,
      })
    })

    it('should return needs change for user without password change', async () => {
      const userWithoutPasswordChange = {
        passwordChangedAt: null,
      }
      mockDb.user.findUnique.mockResolvedValue(userWithoutPasswordChange)

      const result = await getPasswordChangeHistory('user-123')

      expect(result).toEqual({
        lastChanged: null,
        needsChange: true,
      })
    })

    it('should return needs change for non-existent user', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)

      const result = await getPasswordChangeHistory('nonexistent-user')

      expect(result).toEqual({
        lastChanged: null,
        needsChange: true,
      })
    })

    it('should return needs change on database error', async () => {
      mockDb.user.findUnique.mockRejectedValue(new Error('Database error'))

      const result = await getPasswordChangeHistory('user-123')

      expect(result).toEqual({
        lastChanged: null,
        needsChange: true,
      })
    })
  })
})
