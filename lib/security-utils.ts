/**
 * Security utilities
 * 
 * This module provides:
 * - Input sanitization and validation
 * - XSS prevention
 * - CSRF protection
 * - Rate limiting utilities
 * - Security headers
 * - Password security
 * - Session security
 * - Content Security Policy
 */

import crypto from 'crypto'
import { z } from 'zod'

/**
 * Security configuration
 */
export const SECURITY_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBERS: true,
  PASSWORD_REQUIRE_SYMBOLS: true,
  SESSION_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  CSRF_TOKEN_LENGTH: 32,
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_ORIGINS: ['http://localhost:3000', 'https://yourdomain.com'],
} as const

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHTML(input: string): string {
    if (typeof input !== 'string') return ''
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  /**
   * Sanitize user input for database queries
   */
  static sanitizeForDatabase(input: string): string {
    if (typeof input !== 'string') return ''
    
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[;]/g, '') // Remove semicolons
      .replace(/[()]/g, '') // Remove parentheses
      .trim()
  }

  /**
   * Sanitize file name to prevent path traversal
   */
  static sanitizeFileName(fileName: string): string {
    if (typeof fileName !== 'string') return ''
    
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/\.\./g, '') // Remove path traversal attempts
      .replace(/^\.+/, '') // Remove leading dots
      .substring(0, 255) // Limit length
  }

  /**
   * Validate and sanitize email address
   */
  static sanitizeEmail(email: string): string | null {
    if (typeof email !== 'string') return null
    
    const sanitized = email.toLowerCase().trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    return emailRegex.test(sanitized) ? sanitized : null
  }

  /**
   /**
    * Sanitize URL to prevent open redirects
    */
   static sanitizeURL(
     url: string,
     allowedOrigins: readonly string[] = SECURITY_CONFIG.ALLOWED_ORIGINS
   ): string | null {
     if (typeof url !== 'string' || !url.trim()) return null

     let parsedURL: URL
     try {
       // If the URL is relative, treat it as relative to a dummy origin
       if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url)) {
         parsedURL = new URL(url)
       } else {
         // Use a dummy origin for relative URLs
         parsedURL = new URL(url, 'http://dummy.local')
       }
     } catch {
       return null
     }

     // If the URL is relative (no protocol/host), allow it
     if (!parsedURL.host || parsedURL.origin === 'http://dummy.local') {
       // Prevent path traversal
       if (parsedURL.pathname.includes('..')) return null
       return parsedURL.pathname + parsedURL.search + parsedURL.hash
     }

     // Check if URL is from allowed origins
     const isAllowed = allowedOrigins.some(origin =>
       parsedURL.origin === origin || parsedURL.hostname === origin
     )

     if (!isAllowed) return null

     return parsedURL.toString()
  }
}

/**
 * XSS prevention utilities
 */
export class XSSPrevention {
  /**
   * Escape HTML entities
   */
  static escapeHTML(input: string): string {
    if (typeof input !== 'string') return ''
    
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    }
    
    return input.replace(/[&<>"'/]/g, (match) => htmlEscapes[match])
  }

  /**
   * Validate and sanitize JSON input
   */
  static sanitizeJSON(input: string): unknown {
    try {
      const parsed = JSON.parse(input)
      return this.recursivelySanitize(parsed)
    } catch {
      return null
    }
  }

  /**
   * Recursively sanitize object properties
   */
  private static recursivelySanitize(obj: unknown): unknown {
    if (typeof obj === 'string') {
      return this.escapeHTML(obj)
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.recursivelySanitize(item))
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.escapeHTML(key)
        const sanitizedValue = this.recursivelySanitize(value)
        sanitized[sanitizedKey] = sanitizedValue
      }
      return sanitized
    }
    
    return obj
  }

  /**
   * Check for potential XSS patterns
   */
  static detectXSS(input: string): boolean {
    if (typeof input !== 'string') return false
    
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /<link[^>]*>.*?<\/link>/gi,
      /<meta[^>]*>.*?<\/meta>/gi,
      /<style[^>]*>.*?<\/style>/gi,
      /<form[^>]*>.*?<\/form>/gi,
    ]
    
    return xssPatterns.some(pattern => pattern.test(input))
  }
}

/**
 * CSRF protection utilities
 */
export class CSRFProtection {
  /**
   * Generate CSRF token
   */
  static generateToken(): string {
    return crypto.randomBytes(SECURITY_CONFIG.CSRF_TOKEN_LENGTH).toString('hex')
  }

  /**
   * Verify CSRF token
   */
  static verifyToken(token: string, sessionToken: string): boolean {
    if (!token || !sessionToken) return false
    if (token.length !== sessionToken.length) return false
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(sessionToken))
  }

  /**
   * Generate CSRF token for form
   */
  static generateFormToken(): { token: string; field: string } {
    const token = this.generateToken()
    const field = `csrf_token_${crypto.randomBytes(8).toString('hex')}`
    return { token, field }
  }
}

/**
 * Rate limiting utilities
 */
export class RateLimiter {
  private static requests: Map<string, { count: number; resetTime: number }> = new Map()

  /**
   * Check if request is within rate limit
   */
  static checkRateLimit(identifier: string, maxRequests: number = SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS): boolean {
    const now = Date.now()
    const windowStart = now - SECURITY_CONFIG.RATE_LIMIT_WINDOW
    
    const current = this.requests.get(identifier)
    
    if (!current || current.resetTime < windowStart) {
      this.requests.set(identifier, { count: 1, resetTime: now })
      return true
    }
    
    if (current.count >= maxRequests) {
      return false
    }
    
    current.count++
    return true
  }

  /**
   * Get remaining requests for identifier
   */
  static getRemainingRequests(identifier: string, maxRequests: number = SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS): number {
    const current = this.requests.get(identifier)
    if (!current) return maxRequests
    
    const now = Date.now()
    const windowStart = now - SECURITY_CONFIG.RATE_LIMIT_WINDOW
    
    if (current.resetTime < windowStart) {
      return maxRequests
    }
    
    return Math.max(0, maxRequests - current.count)
  }

  /**
   * Clear expired rate limit entries
   */
  static cleanup(): void {
    const now = Date.now()
    const windowStart = now - SECURITY_CONFIG.RATE_LIMIT_WINDOW
    
    for (const [key, value] of this.requests.entries()) {
      if (value.resetTime < windowStart) {
        this.requests.delete(key)
      }
    }
  }
}

/**
 * Security headers utilities
 */
export class SecurityHeaders {
  /**
   * Get security headers for responses
   */
  static getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Content-Security-Policy': this.getCSPHeader(),
    }
  }

  /**
   * Get Content Security Policy header
   */
  static getCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join('; ')
  }

  /**
   * Get CORS headers
   */
  static getCORSHeaders(allowedOrigins: readonly string[] = SECURITY_CONFIG.ALLOWED_ORIGINS): Record<string, string> {
    return {
      'Access-Control-Allow-Origin': Array.from(allowedOrigins).join(', '),
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  }
}

/**
 * Password security utilities
 */
export class PasswordSecurity {
  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
      errors.push(`Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters long`)
    }
    
    if (password.length > SECURITY_CONFIG.PASSWORD_MAX_LENGTH) {
      errors.push(`Password must be no more than ${SECURITY_CONFIG.PASSWORD_MAX_LENGTH} characters long`)
    }
    
    if (SECURITY_CONFIG.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    
    if (SECURITY_CONFIG.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    
    if (SECURITY_CONFIG.PASSWORD_REQUIRE_NUMBERS && !/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    
    if (SECURITY_CONFIG.PASSWORD_REQUIRE_SYMBOLS && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Check if password is in common passwords list
   */
  static isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
      '1234567890', 'password1', 'qwerty123', 'dragon', 'master'
    ]
    
    return commonPasswords.includes(password.toLowerCase())
  }

  /**
   * Generate secure password
   */
  static generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
    let password = ''
    
    // Ensure at least one character from each required category
    if (SECURITY_CONFIG.PASSWORD_REQUIRE_UPPERCASE) {
      password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
    }
    
    if (SECURITY_CONFIG.PASSWORD_REQUIRE_LOWERCASE) {
      password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
    }
    
    if (SECURITY_CONFIG.PASSWORD_REQUIRE_NUMBERS) {
      password += '0123456789'[Math.floor(Math.random() * 10)]
    }
    
    if (SECURITY_CONFIG.PASSWORD_REQUIRE_SYMBOLS) {
      password += '!@#$%^&*()_+-=[]{}|;:,.<>?'[Math.floor(Math.random() * 26)]
    }
    
    // Fill remaining length with random characters
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)]
    }
    
    // Shuffle the password using Fisher-Yates algorithm
    const chars = password.split('')
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[chars[i], chars[j]] = [chars[j], chars[i]]
    }
    return chars.join('')
  }
}

/**
 * Session security utilities
 */
export class SessionSecurity {
  /**
   * Generate secure session ID
   */
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Validate session ID format
   */
  static validateSessionId(sessionId: string): boolean {
    return /^[a-f0-9]{64}$/.test(sessionId)
  }

  /**
   * Check if session is expired
   */
  static isSessionExpired(createdAt: Date): boolean {
    const now = new Date()
    const age = now.getTime() - createdAt.getTime()
    return age > SECURITY_CONFIG.SESSION_MAX_AGE
  }

  /**
   * Generate session fingerprint
   */
  static generateFingerprint(userAgent: string, ipAddress: string): string {
    const data = `${userAgent}:${ipAddress}`
    return crypto.createHash('sha256').update(data).digest('hex')
  }
}

/**
 * File security utilities
 */
export class FileSecurity {
  /**
   * Validate file type
   */
  static validateFileType(mimeType: string): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return SECURITY_CONFIG.ALLOWED_FILE_TYPES.includes(mimeType as any)
  }

  /**
   * Validate file size
   */
  static validateFileSize(size: number): boolean {
    return size <= SECURITY_CONFIG.MAX_FILE_SIZE
  }

  /**
   * Scan file for malicious content
   */
  static scanFile(buffer: Buffer): { isSafe: boolean; threats: string[] } {
    const threats: string[] = []
    
    // Check for executable signatures
    const executableSignatures = [
      Buffer.from([0x4D, 0x5A]), // PE executable
      Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF executable
      Buffer.from([0xCA, 0xFE, 0xBA, 0xBE]), // Mach-O executable
    ]
    
    for (const signature of executableSignatures) {
      if (buffer.includes(signature)) {
        threats.push('Executable file detected')
      }
    }
    
    // Check for script content
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024))
    if (XSSPrevention.detectXSS(content)) {
      threats.push('Potential XSS content detected')
    }
    
    return {
      isSafe: threats.length === 0,
      threats
    }
  }
}

/**
 * Security validation schemas
 */
export const SecuritySchemas = {
  email: z.string().email().transform(InputSanitizer.sanitizeEmail),
  password: z.string().min(SECURITY_CONFIG.PASSWORD_MIN_LENGTH).max(SECURITY_CONFIG.PASSWORD_MAX_LENGTH),
  username: z.string().min(3).max(50).transform(InputSanitizer.sanitizeForDatabase),
  url: z.string().url().transform((url) => InputSanitizer.sanitizeURL(url)),
  fileName: z.string().transform(InputSanitizer.sanitizeFileName),
  html: z.string().transform(InputSanitizer.sanitizeHTML),
  json: z.string().transform(XSSPrevention.sanitizeJSON),
} as const

/**
 * Security audit utilities
 */
export class SecurityAudit {
  /**
   * Run comprehensive security audit
   */
  static async runAudit(): Promise<{
    score: number
    issues: Array<{ severity: 'low' | 'medium' | 'high' | 'critical'; message: string; recommendation: string }>
  }> {
    const issues: Array<{ severity: 'low' | 'medium' | 'high' | 'critical'; message: string; recommendation: string }> = []
    
    // Check environment variables
    if (!process.env.NEXTAUTH_SECRET) {
      issues.push({
        severity: 'critical',
        message: 'NEXTAUTH_SECRET is not set',
        recommendation: 'Set a strong, random secret for NextAuth'
      })
    }
    
    if (!process.env.DATABASE_URL) {
      issues.push({
        severity: 'critical',
        message: 'DATABASE_URL is not set',
        recommendation: 'Configure database connection string'
      })
    }
    
    // Check HTTPS configuration
    if (process.env.NODE_ENV === 'production' && !process.env.HTTPS) {
      issues.push({
        severity: 'high',
        message: 'HTTPS is not enforced in production',
        recommendation: 'Enable HTTPS and redirect HTTP traffic'
      })
    }
    
    // Check rate limiting
    if (!process.env.RATE_LIMIT_ENABLED) {
      issues.push({
        severity: 'medium',
        message: 'Rate limiting is not enabled',
        recommendation: 'Enable rate limiting to prevent abuse'
      })
    }
    
    // Calculate score
    const criticalIssues = issues.filter(i => i.severity === 'critical').length
    const highIssues = issues.filter(i => i.severity === 'high').length
    const mediumIssues = issues.filter(i => i.severity === 'medium').length
    const lowIssues = issues.filter(i => i.severity === 'low').length
    
    const score = Math.max(0, 100 - (criticalIssues * 25) - (highIssues * 15) - (mediumIssues * 10) - (lowIssues * 5))
    
    return { score, issues }
  }
}
