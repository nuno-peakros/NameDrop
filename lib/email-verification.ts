import { db } from '@/lib/db'
import { emailTemplates } from '@/lib/email'
import { generateSecurePassword } from '@/lib/auth-utils'
import { Prisma } from '@prisma/client'

type User = Prisma.UserGetPayload<Record<string, never>>

/**
 * Email verification service for user account verification
 * 
 * This service handles:
 * - Email verification token generation
 * - Email verification token validation
 * - Sending verification emails
 * - User account activation
 */

/**
 * Email verification result
 */
export interface EmailVerificationResult {
  success: boolean
  message: string
  user?: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'emailVerified'>
}

/**
 * Email verification token data
 */
interface VerificationTokenData {
  userId: string
  email: string
  token: string
  expiresAt: Date
}

/**
 * Configuration for email verification
 */
const VERIFICATION_CONFIG = {
  /** Token expiration time in hours */
  TOKEN_EXPIRY_HOURS: 24,
  /** Token length for verification */
  TOKEN_LENGTH: 32,
} as const

/**
 * Generate a secure email verification token
 * 
 * @returns Secure random token string
 * 
 * @example
 * ```typescript
 * const token = generateVerificationToken();
 * console.log(token); // Random 32-character token
 * ```
 */
function generateVerificationToken(): string {
  return generateSecurePassword(VERIFICATION_CONFIG.TOKEN_LENGTH, false)
}

/**
 * Create email verification token for a user
 * 
 * @param userId - User ID to create token for
 * @param email - User email address
 * @returns Created verification token data
 * 
 * @throws {Error} If token creation fails
 * 
 * @example
 * ```typescript
 * const tokenData = await createVerificationToken(user.id, user.email);
 * console.log('Token:', tokenData.token);
 * ```
 */
async function createVerificationToken(userId: string, email: string): Promise<VerificationTokenData> {
  try {
    // Clean up any existing verification tokens for this user
    await db.passwordResetToken.deleteMany({
      where: {
        userId,
        usedAt: null,
      },
    })

    const token = generateVerificationToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + VERIFICATION_CONFIG.TOKEN_EXPIRY_HOURS)

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
    throw new Error(`Failed to create verification token: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Send email verification email to user
 * 
 * @param user - User object with email and name
 * @returns Promise resolving to send result
 * 
 * @throws {Error} If email sending fails
 * 
 * @example
 * ```typescript
 * const result = await sendVerificationEmail(user);
 * if (result.success) {
 *   console.log('Verification email sent');
 * }
 * ```
 */
export async function sendVerificationEmail(user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>): Promise<EmailVerificationResult> {
  try {
    // Check if user is already verified
    const existingUser = await db.user.findUnique({
      where: { id: user.id },
      select: { emailVerified: true },
    })

    if (!existingUser) {
      return {
        success: false,
        message: 'User not found',
      }
    }

    if (existingUser.emailVerified) {
      return {
        success: false,
        message: 'Email is already verified',
      }
    }

    // Create verification token
    const tokenData = await createVerificationToken(user.id, user.email)

    // Send verification email
    await emailTemplates.sendVerificationEmail(
      user.email,
      tokenData.token,
      user.firstName
    )

    return {
      success: true,
      message: 'Verification email sent successfully',
    }
  } catch (error) {
    console.error('Email verification send error:', error)
    return {
      success: false,
      message: `Failed to send verification email: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Verify email address using verification token
 * 
 * @param token - Email verification token
 * @returns Verification result with user data if successful
 * 
 * @example
 * ```typescript
 * const result = await verifyEmail(token);
 * if (result.success) {
 *   console.log('Email verified for:', result.user?.email);
 * }
 * ```
 */
export async function verifyEmail(token: string): Promise<EmailVerificationResult> {
  try {
    // Find the verification token
    const tokenRecord = await db.passwordResetToken.findUnique({
      where: { token },
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

    if (!tokenRecord) {
      return {
        success: false,
        message: 'Invalid verification token',
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
        message: 'Verification token has expired',
      }
    }

    // Check if token is already used
    if (tokenRecord.usedAt) {
      return {
        success: false,
        message: 'Verification token has already been used',
      }
    }

    // Check if user is active
    if (!tokenRecord.user.isActive) {
      return {
        success: false,
        message: 'User account is not active',
      }
    }

    // Check if email is already verified
    if (tokenRecord.user.emailVerified) {
      return {
        success: false,
        message: 'Email is already verified',
      }
    }

    // Mark token as used
    await db.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() },
    })

    // Update user email verification status
    const updatedUser = await db.user.update({
      where: { id: tokenRecord.user.id },
      data: { emailVerified: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
      },
    })

    return {
      success: true,
      message: 'Email verified successfully',
      user: updatedUser,
    }
  } catch (error) {
    console.error('Email verification error:', error)
    return {
      success: false,
      message: `Email verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Resend email verification to user
 * 
 * @param userId - User ID to resend verification to
 * @returns Promise resolving to send result
 * 
 * @example
 * ```typescript
 * const result = await resendVerificationEmail(userId);
 * if (result.success) {
 *   console.log('Verification email resent');
 * }
 * ```
 */
export async function resendVerificationEmail(userId: string): Promise<EmailVerificationResult> {
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
        message: 'User account is not active',
      }
    }

    if (user.emailVerified) {
      return {
        success: false,
        message: 'Email is already verified',
      }
    }

    // Send verification email
    return await sendVerificationEmail(user)
  } catch (error) {
    console.error('Resend verification email error:', error)
    return {
      success: false,
      message: `Failed to resend verification email: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Check if user needs email verification
 * 
 * @param userId - User ID to check
 * @returns True if user needs email verification
 * 
 * @example
 * ```typescript
 * const needsVerification = await needsEmailVerification(userId);
 * if (needsVerification) {
 *   // Show verification prompt
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
 * Clean up expired verification tokens
 * 
 * @returns Number of tokens cleaned up
 * 
 * @example
 * ```typescript
 * const cleaned = await cleanupExpiredTokens();
 * console.log(`Cleaned up ${cleaned} expired tokens`);
 * ```
 */
export async function cleanupExpiredTokens(): Promise<number> {
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
    console.error('Cleanup expired tokens error:', error)
    return 0
  }
}

/**
 * Get verification token status
 * 
 * @param token - Verification token to check
 * @returns Token status information
 * 
 * @example
 * ```typescript
 * const status = await getTokenStatus(token);
 * console.log('Token valid:', status.isValid);
 * ```
 */
export async function getTokenStatus(token: string): Promise<{
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
    console.error('Get token status error:', error)
    return {
      isValid: false,
      isExpired: false,
      isUsed: false,
    }
  }
}
