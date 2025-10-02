import { Resend } from 'resend'
import { config } from '@/lib/config'

/**
 * Resend email service client
 * 
 * This service handles all email operations including:
 * - Email verification
 * - Password reset notifications
 * - User management notifications
 * 
 * @example
 * ```typescript
 * import { emailService } from '@/lib/email';
 * 
 * await emailService.sendVerificationEmail(user.email, token);
 * await emailService.sendPasswordResetEmail(user.email, token);
 * ```
 */
export const emailService = new Resend(config.email.resendApiKey)

/**
 * Email templates and sending functions
 */
export const emailTemplates = {
  /**
   * Send email verification email
   * @param to - Recipient email address
   * @param token - Email verification token
   * @param firstName - User's first name
   * @returns Promise with send result
   */
  async sendVerificationEmail(
    to: string, 
    token: string, 
    firstName: string
  ) {
    const verificationUrl = `${config.auth.nextAuthUrl}/verify-email?token=${token}`
    
    return await emailService.emails.send({
      from: 'NameDrop <noreply@namedrop.com>',
      to,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to NameDrop!</h1>
          <p>Hi ${firstName},</p>
          <p>Thank you for joining NameDrop. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>Best regards,<br>The NameDrop Team</p>
        </div>
      `,
    })
  },

  /**
   * Send password reset email
   * @param to - Recipient email address
   * @param token - Password reset token
   * @param firstName - User's first name
   * @returns Promise with send result
   */
  async sendPasswordResetEmail(
    to: string, 
    token: string, 
    firstName: string
  ) {
    const resetUrl = `${config.auth.nextAuthUrl}/reset-password?token=${token}`
    
    return await emailService.emails.send({
      from: 'NameDrop <noreply@namedrop.com>',
      to,
      subject: 'Reset your password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Password Reset Request</h1>
          <p>Hi ${firstName},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>The NameDrop Team</p>
        </div>
      `,
    })
  },

  /**
   * Send temporary password email (admin only)
   * @param to - Recipient email address
   * @param temporaryPassword - Temporary password
   * @param firstName - User's first name
   * @returns Promise with send result
   */
  async sendTemporaryPasswordEmail(
    to: string, 
    temporaryPassword: string, 
    firstName: string
  ) {
    const loginUrl = `${config.auth.nextAuthUrl}/login`
    
    return await emailService.emails.send({
      from: 'NameDrop <noreply@namedrop.com>',
      to,
      subject: 'Your NameDrop account has been created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to NameDrop!</h1>
          <p>Hi ${firstName},</p>
          <p>Your NameDrop account has been created. Here are your login credentials:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <p><strong>Email:</strong> ${to}</p>
            <p><strong>Temporary Password:</strong> <code style="background-color: #e9ecef; padding: 2px 4px; border-radius: 2px;">${temporaryPassword}</code></p>
          </div>
          <p>Please log in and change your password immediately:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Log In Now
            </a>
          </div>
          <p><strong>Important:</strong> For security reasons, please change your password after your first login.</p>
          <p>Best regards,<br>The NameDrop Team</p>
        </div>
      `,
    })
  },
}
