import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateSecurePassword,
  shouldChangePassword,
  getPasswordPolicyDescription,
} from '@/lib/auth-utils'

/**
 * Unit tests for authentication utilities
 * 
 * Tests cover:
 * - Password hashing and verification
 * - Password strength validation
 * - Secure password generation
 * - Password change requirements
 * - Policy descriptions
 */
describe('Auth Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'testPassword123'
      const hashedPassword = await hashPassword(password)
      
      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(password)
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/)
    })

    it('should throw error when hashing fails', async () => {
      const password = 'testPassword123'
      
      // Mock bcrypt.hash to throw an error
      vi.spyOn(bcrypt, 'hash').mockRejectedValueOnce(new Error('Hashing failed'))
      
      await expect(hashPassword(password)).rejects.toThrow('Failed to hash password: Hashing failed')
    })

    it('should use correct salt rounds', async () => {
      const password = 'testPassword123'
      const hashSpy = vi.spyOn(bcrypt, 'hash')
      
      await hashPassword(password)
      
      expect(hashSpy).toHaveBeenCalledWith(password, 12)
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123'
      const hashedPassword = await bcrypt.hash(password, 12)
      
      const result = await verifyPassword(password, hashedPassword)
      
      expect(result).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'testPassword123'
      const wrongPassword = 'wrongPassword'
      const hashedPassword = await bcrypt.hash(password, 12)
      
      const result = await verifyPassword(wrongPassword, hashedPassword)
      
      expect(result).toBe(false)
    })

    it('should handle verification errors gracefully', async () => {
      const password = 'testPassword123'
      const hashedPassword = 'invalid-hash'
      
      // Mock bcrypt.compare to throw an error
      vi.spyOn(bcrypt, 'compare').mockRejectedValueOnce(new Error('Verification failed'))
      
      const result = await verifyPassword(password, hashedPassword)
      
      expect(result).toBe(false)
    })
  })

  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const password = 'StrongPassword123!'
      const result = validatePasswordStrength(password)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.strength).toBe('strong')
    })

    it('should validate medium password', () => {
      const password = 'MediumPass123'
      const result = validatePasswordStrength(password)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.strength).toBe('medium')
    })

    it('should reject weak password', () => {
      const password = 'weak'
      const result = validatePasswordStrength(password)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters long')
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
      expect(result.errors).toContain('Password must contain at least one number')
      expect(result.strength).toBe('weak')
    })

    it('should require minimum length', () => {
      const password = 'Short1'
      const result = validatePasswordStrength(password)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters long')
    })

    it('should require uppercase letter', () => {
      const password = 'lowercase123'
      const result = validatePasswordStrength(password)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
    })

    it('should require lowercase letter', () => {
      const password = 'UPPERCASE123'
      const result = validatePasswordStrength(password)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one lowercase letter')
    })

    it('should require numbers', () => {
      const password = 'NoNumbers'
      const result = validatePasswordStrength(password)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one number')
    })

    it('should calculate strength correctly', () => {
      // Strong password (12+ chars, no errors)
      const strongPassword = 'VeryStrongPassword123'
      const strongResult = validatePasswordStrength(strongPassword)
      expect(strongResult.strength).toBe('strong')

      // Medium password (8+ chars, 1 error)
      const mediumPassword = 'MediumPass'
      const mediumResult = validatePasswordStrength(mediumPassword)
      expect(mediumResult.strength).toBe('medium')

      // Weak password (short or many errors)
      const weakPassword = 'weak'
      const weakResult = validatePasswordStrength(weakPassword)
      expect(weakResult.strength).toBe('weak')
    })
  })

  describe('generateSecurePassword', () => {
    it('should generate password with default length', () => {
      const password = generateSecurePassword()
      
      expect(password).toBeDefined()
      expect(password.length).toBe(12)
    })

    it('should generate password with custom length', () => {
      const length = 16
      const password = generateSecurePassword(length)
      
      expect(password).toBeDefined()
      expect(password.length).toBe(length)
    })

    it('should generate password without special characters', () => {
      const password = generateSecurePassword(12, false)
      
      expect(password).toBeDefined()
      expect(password.length).toBe(12)
      // Should not contain special characters
      expect(password).not.toMatch(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
    })

    it('should generate password with special characters', () => {
      const password = generateSecurePassword(12, true)
      
      expect(password).toBeDefined()
      expect(password.length).toBe(12)
      // Should contain at least one special character
      expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
    })

    it('should include required character types', () => {
      const password = generateSecurePassword(12, true)
      
      // Should contain at least one lowercase letter
      expect(password).toMatch(/[a-z]/)
      // Should contain at least one uppercase letter
      expect(password).toMatch(/[A-Z]/)
      // Should contain at least one number
      expect(password).toMatch(/\d/)
    })

    it('should generate different passwords each time', () => {
      const password1 = generateSecurePassword()
      const password2 = generateSecurePassword()
      
      expect(password1).not.toBe(password2)
    })
  })

  describe('shouldChangePassword', () => {
    it('should return true for null passwordChangedAt', () => {
      const result = shouldChangePassword(null)
      expect(result).toBe(true)
    })

    it('should return true for old password', () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 100) // 100 days ago
      
      const result = shouldChangePassword(oldDate)
      expect(result).toBe(true)
    })

    it('should return false for recent password', () => {
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 30) // 30 days ago
      
      const result = shouldChangePassword(recentDate)
      expect(result).toBe(false)
    })

    it('should use custom max age', () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 50) // 50 days ago
      
      const result = shouldChangePassword(oldDate, 30) // 30 day max age
      expect(result).toBe(true)
    })

    it('should handle exact boundary', () => {
      const boundaryDate = new Date()
      boundaryDate.setDate(boundaryDate.getDate() - 90) // Exactly 90 days ago
      
      const result = shouldChangePassword(boundaryDate, 90)
      expect(result).toBe(true)
    })
  })

  describe('getPasswordPolicyDescription', () => {
    it('should return policy description', () => {
      const policy = getPasswordPolicyDescription()
      
      expect(policy).toBeDefined()
      expect(policy).toContain('at least 8 characters')
      expect(policy).toContain('one uppercase letter')
      expect(policy).toContain('one lowercase letter')
      expect(policy).toContain('one number')
    })

    it('should format requirements correctly', () => {
      const policy = getPasswordPolicyDescription()
      
      expect(policy).toBe('Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number.')
    })
  })
})
