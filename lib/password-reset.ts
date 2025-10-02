import { db } from '@/lib/db'
import { emailTemplates } from '@/lib/email'
import { generateSecurePassword, hashPassword, verifyPassword } from '@/lib/auth-utils'
// import { User } from '@prisma/client'

/**
 * Password reset service for user password management
 * 
 * This service handles:
 * - Password reset token generation
 * - Password reset token validation
 * - Sending password reset emails
 * - Password reset completion
 * - Admin password reset functionality
 */

/**
 * Password reset result
 */
export interface PasswordResetResult {
  success: boolean
  message: string
  temporaryPassword?: string
}

/**
 * Password reset token data
 */
interface ResetTokenData {
  userId: string
  email: string
  token: string
  expiresAt: Date
}

/**
 * Configuration for password reset
 */
const RESET_CONFIG = {
  /** Token expiration time in hours */
  TOKEN_EXPIRY_HOURS: 1,
  /** Token length for reset */
  TOKEN_LENGTH: 32,
  /** Temporary password length */
  TEMP_PASSWORD_LENGTH: 12,
} as const

/**
 * Generate a secure password reset token
 * 
 * @returns Secure random token string
 * 
 * @example
 * ```typescript
 * const token = generateResetToken();
 * console.log(token); // Random 32-character token
 * ```
 */
function generateResetToken(): string {
  return generateSecurePassword(RESET_CONFIG.TOKEN_LENGTH, false)
}

/**
 * Create password reset token for a user
 * 
 * @param userId - User ID to create token for
 * @param email - User email address
 * @returns Created reset token data
 * 
 * @throws {Error} If token creation fails
 * 
 * @example
 * ```typescript
 * const tokenData = await createResetToken(user.id, user.email);
 * console.log('Reset token:', tokenData.token);
 * ```
 */
async function createResetToken(userId: string, email: string): Promise<ResetTokenData> {
  try {
    // Clean up any existing reset tokens for this user
    await db.passwordResetToken.deleteMany({
      where: {
        userId,
        usedAt: null,
      },
    })

    const token = generateResetToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + RESET_CONFIG.TOKEN_EXPIRY_HOURS)

    const tokenRecord = await db.passwordResetToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    })

    return {
      userId: tokenRecord.userId,
      email,
      token: tokenRecord.token,
      expiresAt: tokenRecord.expiresAt,
    }
  } catch (error) {
    throw new Error(`Failed to create reset token: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Send password reset email to user
 * 
 * @param email - User email address
 * @returns Promise resolving to send result
 * 
 * @throws {Error} If email sending fails
 * 
 * @example
 * ```typescript
 * const result = await sendPasswordResetEmail('user@example.com');
 * if (result.success) {
 *   console.log('Password reset email sent');
 * }
 * ```
 */
export async function sendPasswordResetEmail(email: string): Promise<PasswordResetResult> {
  try {
    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        emailVerified: true,
      },
    })

    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        success: true,
        message: 'If an account with that email exists, a password reset email has been sent',
      }
    }

    if (!user.isActive) {
      return {
        success: false,
        message: 'Account is not active',
      }
    }

    if (!user.emailVerified) {
      return {
        success: false,
        message: 'Email address must be verified before resetting password',
      }
    }

    // Create reset token
    const tokenData = await createResetToken(user.id, user.email)

    // Send reset email
    await emailTemplates.sendPasswordResetEmail(
      user.email,
      tokenData.token,
      user.firstName
    )

    return {
      success: true,
      message: 'Password reset email sent successfully',
    }
  } catch (error) {
    console.error('Password reset email send error:', error)
    return {
      success: false,
      message: `Failed to send password reset email: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Reset password using reset token
 * 
 * @param token - Password reset token
 * @param newPassword - New password
 * @returns Reset result
 * 
 * @example
 * ```typescript
 * const result = await resetPassword(token, 'newPassword123');
 * if (result.success) {
 *   console.log('Password reset successfully');
 * }
 * ```
 */
export async function resetPassword(token: string, newPassword: string): Promise<PasswordResetResult> {
  try {
    // Find the reset token
    const tokenRecord = await db.passwordResetToken.findUnique({
      where: { token },
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

    if (!tokenRecord) {
      return {
        success: false,
        message: 'Invalid reset token',
      }
    }

    // Check if token is expired
    if (tokenRecord.expiresAt < new Date()) {
      // Clean up expired token
      await db.passwordResetToken.delete({
        where: { id: tokenRecord.id },
      })

      return {
        success: false,
        message: 'Reset token has expired',
      }
    }

    // Check if token is already used
    if (tokenRecord.usedAt) {
      return {
        success: false,
        message: 'Reset token has already been used',
      }
    }

    // Check if user is active
    if (!tokenRecord.user.isActive) {
      return {
        success: false,
        message: 'User account is not active',
      }
    }

    // Check if email is verified
    if (!tokenRecord.user.emailVerified) {
      return {
        success: false,
        message: 'Email address must be verified before resetting password',
      }
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword)

    // Update user password and mark token as used
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.$transaction(async (tx: any) => {
      // Update user password
      await tx.user.update({
        where: { id: tokenRecord.user.id },
        data: {
          passwordHash: hashedPassword,
          passwordChangedAt: new Date(),
        },
      })

      // Mark token as used
      await tx.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      })
    })

    return {
      success: true,
      message: 'Password reset successfully',
    }
  } catch (error) {
    console.error('Password reset error:', error)
    return {
      success: false,
      message: `Password reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Reset user password as admin (generates temporary password)
 * 
 * @param userId - User ID to reset password for
 * @returns Reset result with temporary password
 * 
 * @example
 * ```typescript
 * const result = await adminResetPassword(userId);
 * if (result.success) {
 *   console.log('Temporary password:', result.temporaryPassword);
 * }
 * ```
 */
export async function adminResetPassword(userId: string): Promise<PasswordResetResult> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        emailVerified: true,
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
        message: 'User account is not active',
      }
    }

    // Generate temporary password
    const temporaryPassword = generateSecurePassword(RESET_CONFIG.TEMP_PASSWORD_LENGTH, true)
    const hashedPassword = await hashPassword(temporaryPassword)

    // Update user password
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        passwordChangedAt: new Date(),
      },
    })

    // Send temporary password email
    await emailTemplates.sendTemporaryPasswordEmail(
      user.email,
      temporaryPassword,
      user.firstName
    )

    return {
      success: true,
      message: 'Password reset successfully. Temporary password sent to user.',
      temporaryPassword,
    }
  } catch (error) {
    console.error('Admin password reset error:', error)
    return {
      success: false,
      message: `Password reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Change user password (authenticated user)
 * 
 * @param userId - User ID
 * @param currentPassword - Current password
 * @param newPassword - New password
 * @returns Change result
 * 
 * @example
 * ```typescript
 * const result = await changePassword(userId, 'currentPass', 'newPass123');
 * if (result.success) {
 *   console.log('Password changed successfully');
 * }
 * ```
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<PasswordResetResult> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
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
        message: 'User account is not active',
      }
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.passwordHash)
    if (!isCurrentPasswordValid) {
      return {
        success: false,
        message: 'Current password is incorrect',
      }
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword)

    // Update user password
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        passwordChangedAt: new Date(),
      },
    })

    return {
      success: true,
      message: 'Password changed successfully',
    }
  } catch (error) {
    console.error('Change password error:', error)
    return {
      success: false,
      message: `Password change failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Validate reset token without using it
 * 
 * @param token - Reset token to validate
 * @returns Token validation result
 * 
 * @example
 * ```typescript
 * const result = await validateResetToken(token);
 * if (result.isValid) {
 *   // Show password reset form
 * }
 * ```
 */
export async function validateResetToken(token: string): Promise<{
  isValid: boolean
  isExpired: boolean
  isUsed: boolean
  userId?: string
  expiresAt?: Date
}> {
  try {
    const tokenRecord = await db.passwordResetToken.findUnique({
      where: { token },
      select: {
        userId: true,
        expiresAt: true,
        usedAt: true,
      },
    })

    if (!tokenRecord) {
      return {
        isValid: false,
        isExpired: false,
        isUsed: false,
      }
    }

    const isExpired = tokenRecord.expiresAt < new Date()
    const isUsed = !!tokenRecord.usedAt

    return {
      isValid: !isExpired && !isUsed,
      isExpired,
      isUsed,
      userId: tokenRecord.userId,
      expiresAt: tokenRecord.expiresAt,
    }
  } catch (error) {
    console.error('Validate reset token error:', error)
    return {
      isValid: false,
      isExpired: false,
      isUsed: false,
    }
  }
}

/**
 * Clean up expired reset tokens
 * 
 * @returns Number of tokens cleaned up
 * 
 * @example
 * ```typescript
 * const cleaned = await cleanupExpiredResetTokens();
 * console.log(`Cleaned up ${cleaned} expired tokens`);
 * ```
 */
export async function cleanupExpiredResetTokens(): Promise<number> {
  try {
    const result = await db.passwordResetToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    return result.count
  } catch (error) {
    console.error('Cleanup expired reset tokens error:', error)
    return 0
  }
}

/**
 * Get user's password change history (if needed for security)
 * 
 * @param userId - User ID
 * @returns Password change information
 * 
 * @example
 * ```typescript
 * const history = await getPasswordChangeHistory(userId);
 * console.log('Last changed:', history.lastChanged);
 * ```
 */
export async function getPasswordChangeHistory(userId: string): Promise<{
  lastChanged: Date | null
  needsChange: boolean
}> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        passwordChangedAt: true,
      },
    })

    if (!user) {
      return {
        lastChanged: null,
        needsChange: true,
      }
    }

    return {
      lastChanged: user.passwordChangedAt,
      needsChange: !user.passwordChangedAt,
    }
  } catch (error) {
    console.error('Get password change history error:', error)
    return {
      lastChanged: null,
      needsChange: true,
    }
  }
}
