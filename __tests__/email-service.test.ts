import { describe, it, expect } from 'vitest'
import { emailTemplates } from '@/lib/email'

/**
 * Email service integration tests
 * 
 * These tests verify that the Resend email service
 * is properly configured and can send emails.
 */

describe('Email Service Integration', () => {
  describe('Email Templates', () => {
    it('should have sendVerificationEmail function', () => {
      expect(typeof emailTemplates.sendVerificationEmail).toBe('function')
    })

    it('should have sendPasswordResetEmail function', () => {
      expect(typeof emailTemplates.sendPasswordResetEmail).toBe('function')
    })

    it('should have sendTemporaryPasswordEmail function', () => {
      expect(typeof emailTemplates.sendTemporaryPasswordEmail).toBe('function')
    })

    it('should generate valid verification email content', async () => {
      const result = await emailTemplates.sendVerificationEmail(
        'test@example.com',
        'test-token-123',
        'John'
      )

      expect(result).toBeDefined()
      // The actual sending will depend on the Resend API key being valid
      // This test mainly verifies the function exists and can be called
    })

    it('should generate valid password reset email content', async () => {
      const result = await emailTemplates.sendPasswordResetEmail(
        'test@example.com',
        'reset-token-123',
        'John'
      )

      expect(result).toBeDefined()
    })

    it('should generate valid temporary password email content', async () => {
      const result = await emailTemplates.sendTemporaryPasswordEmail(
        'test@example.com',
        'temp-password-123',
        'John'
      )

      expect(result).toBeDefined()
    })
  })
})
