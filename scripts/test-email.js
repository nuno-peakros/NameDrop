/**
 * Test script to verify Resend email integration
 * 
 * This script sends a test email to verify that the Resend API
 * is properly configured and working.
 */

const { emailTemplates } = require('../lib/email.ts')

async function testEmailService() {
  try {
    console.log('Testing Resend email service...')
    
    // Test verification email
    console.log('Sending verification email...')
    const verificationResult = await emailTemplates.sendVerificationEmail(
      'test@example.com',
      'test-verification-token-123',
      'Test User'
    )
    console.log('Verification email result:', verificationResult)
    
    // Test password reset email
    console.log('Sending password reset email...')
    const resetResult = await emailTemplates.sendPasswordResetEmail(
      'test@example.com',
      'test-reset-token-123',
      'Test User'
    )
    console.log('Password reset email result:', resetResult)
    
    // Test temporary password email
    console.log('Sending temporary password email...')
    const tempPasswordResult = await emailTemplates.sendTemporaryPasswordEmail(
      'test@example.com',
      'temp-password-123',
      'Test User'
    )
    console.log('Temporary password email result:', tempPasswordResult)
    
    console.log('✅ Email service test completed successfully!')
    
  } catch (error) {
    console.error('❌ Email service test failed:', error)
  }
}

// Run the test
testEmailService()
