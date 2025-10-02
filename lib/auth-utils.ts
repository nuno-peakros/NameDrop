import bcrypt from 'bcryptjs'

/**
 * Password hashing and validation utilities
 * 
 * This module provides secure password handling functions including:
 * - Password hashing with bcrypt
 * - Password validation
 * - Password strength checking
 * - Secure password generation
 */

/**
 * Configuration for password hashing
 */
const PASSWORD_CONFIG = {
  /** Salt rounds for bcrypt hashing (minimum 12 for security) */
  SALT_ROUNDS: 12,
  /** Minimum password length */
  MIN_LENGTH: 8,
  /** Password strength requirements */
  REQUIREMENTS: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false, // Optional but recommended
  },
} as const

/**
 * Password strength validation result
 */
export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
}

/**
 * Hash a password using bcrypt with configured salt rounds
 * 
 * @param password - Plain text password to hash
 * @returns Promise resolving to hashed password
 * 
 * @throws {Error} If hashing fails
 * 
 * @example
 * ```typescript
 * const hashedPassword = await hashPassword('mySecurePassword123');
 * console.log(hashedPassword); // $2a$12$...
 * ```
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    return await bcrypt.hash(password, PASSWORD_CONFIG.SALT_ROUNDS)
  } catch (error) {
    throw new Error(`Failed to hash password: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Verify a password against its hash
 * 
 * @param password - Plain text password to verify
 * @param hashedPassword - Hashed password to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 * 
 * @example
 * ```typescript
 * const isValid = await verifyPassword('myPassword', hashedPassword);
 * if (isValid) {
 *   console.log('Password is correct');
 * }
 * ```
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

/**
 * Validate password strength and requirements
 * 
 * @param password - Password to validate
 * @returns Password validation result with errors and strength rating
 * 
 * @example
 * ```typescript
 * const result = validatePasswordStrength('myPassword123');
 * if (!result.isValid) {
 *   console.log('Password errors:', result.errors);
 * }
 * ```
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = []
  const { REQUIREMENTS } = PASSWORD_CONFIG

  // Check minimum length
  if (password.length < REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${REQUIREMENTS.minLength} characters long`)
  }

  // Check for uppercase letter
  if (REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  // Check for lowercase letter
  if (REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  // Check for numbers
  if (REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  // Check for special characters (optional)
  if (REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  if (password.length >= 12 && errors.length === 0) {
    strength = 'strong'
  } else if (password.length >= 8 && errors.length <= 1) {
    strength = 'medium'
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  }
}

/**
 * Generate a secure random password
 * 
 * @param length - Length of password to generate (default: 12)
 * @param includeSpecialChars - Whether to include special characters (default: true)
 * @returns Generated secure password
 * 
 * @example
 * ```typescript
 * const tempPassword = generateSecurePassword(12);
 * console.log(tempPassword); // Random secure password
 * ```
 */
export function generateSecurePassword(length: number = 12, includeSpecialChars: boolean = true): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  let charset = lowercase + uppercase + numbers
  if (includeSpecialChars) {
    charset += specialChars
  }
  
  let password = ''
  
  // Ensure at least one character from each required category
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  
  if (includeSpecialChars) {
    password += specialChars[Math.floor(Math.random() * specialChars.length)]
  }
  
  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * Check if a password needs to be changed
 * 
 * @param passwordChangedAt - Date when password was last changed
 * @param maxAgeDays - Maximum age in days before password should be changed (default: 90)
 * @returns True if password should be changed
 * 
 * @example
 * ```typescript
 * const shouldChange = shouldChangePassword(user.passwordChangedAt, 90);
 * if (shouldChange) {
 *   // Prompt user to change password
 * }
 * ```
 */
export function shouldChangePassword(passwordChangedAt: Date | null, maxAgeDays: number = 90): boolean {
  if (!passwordChangedAt) {
    return true // Never changed, should change
  }
  
  const now = new Date()
  const daysSinceChange = Math.floor((now.getTime() - passwordChangedAt.getTime()) / (1000 * 60 * 60 * 24))
  
  return daysSinceChange >= maxAgeDays
}

/**
 * Get password policy description for user display
 * 
 * @returns Human-readable password policy description
 * 
 * @example
 * ```typescript
 * const policy = getPasswordPolicyDescription();
 * console.log(policy); // "Password must be at least 8 characters..."
 * ```
 */
export function getPasswordPolicyDescription(): string {
  const { REQUIREMENTS } = PASSWORD_CONFIG
  const requirements = []
  
  requirements.push(`at least ${REQUIREMENTS.minLength} characters`)
  
  if (REQUIREMENTS.requireUppercase) {
    requirements.push('one uppercase letter')
  }
  
  if (REQUIREMENTS.requireLowercase) {
    requirements.push('one lowercase letter')
  }
  
  if (REQUIREMENTS.requireNumbers) {
    requirements.push('one number')
  }
  
  if (REQUIREMENTS.requireSpecialChars) {
    requirements.push('one special character')
  }
  
  return `Password must contain ${requirements.join(', ')}.`
}
