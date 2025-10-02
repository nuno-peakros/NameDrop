/**
 * Security utilities tests
 * 
 * Tests for:
 * - Input sanitization
 * - XSS prevention
 * - CSRF protection
 * - Rate limiting
 * - Password security
 * - Session security
 * - File security
 * - Security audit
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  InputSanitizer,
  XSSPrevention,
  CSRFProtection,
  RateLimiter,
  PasswordSecurity,
  SessionSecurity,
  FileSecurity,
  SecurityAudit,
  SecurityHeaders,
  SecuritySchemas
} from '@/lib/security-utils'

describe('Security Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('InputSanitizer', () => {
    it('should sanitize HTML content', () => {
      const malicious = '<script>alert("xss")</script>'
      const sanitized = InputSanitizer.sanitizeHTML(malicious)
      
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;')
    })

    it('should sanitize database input', () => {
      const malicious = "'; DROP TABLE users; --"
      const sanitized = InputSanitizer.sanitizeForDatabase(malicious)
      
      expect(sanitized).toBe('DROP TABLE users --')
    })

    it('should sanitize file names', () => {
      const malicious = '../../../etc/passwd'
      const sanitized = InputSanitizer.sanitizeFileName(malicious)
      
      expect(sanitized).toBe('___etc_passwd')
    })

    it('should validate email addresses', () => {
      expect(InputSanitizer.sanitizeEmail('test@example.com')).toBe('test@example.com')
      expect(InputSanitizer.sanitizeEmail('invalid-email')).toBeNull()
      expect(InputSanitizer.sanitizeEmail('')).toBeNull()
    })

    it('should sanitize URLs', () => {
      const allowedOrigins = ['https://example.com']
      
      expect(InputSanitizer.sanitizeURL('https://example.com/path', allowedOrigins)).toBe('https://example.com/path')
      expect(InputSanitizer.sanitizeURL('https://malicious.com/path', allowedOrigins)).toBeNull()
      expect(InputSanitizer.sanitizeURL('invalid-url', allowedOrigins)).toBeNull()
    })
  })

  describe('XSSPrevention', () => {
    it('should escape HTML entities', () => {
      const malicious = '<script>alert("xss")</script>'
      const escaped = XSSPrevention.escapeHTML(malicious)
      
      expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;')
    })

    it('should sanitize JSON input', () => {
      const malicious = '{"name": "<script>alert(1)</script>"}'
      const sanitized = XSSPrevention.sanitizeJSON(malicious)
      
      expect(sanitized).toEqual({ name: '&lt;script&gt;alert(1)&lt;&#x2F;script&gt;' })
    })

    it('should detect XSS patterns', () => {
      expect(XSSPrevention.detectXSS('<script>alert(1)</script>')).toBe(true)
      expect(XSSPrevention.detectXSS('javascript:alert(1)')).toBe(true)
      expect(XSSPrevention.detectXSS('onclick="alert(1)"')).toBe(true)
      expect(XSSPrevention.detectXSS('Normal text')).toBe(false)
    })

    it('should recursively sanitize objects', () => {
      const malicious = {
        name: '<script>alert(1)</script>',
        items: ['<img src=x onerror=alert(1)>', 'normal text']
      }
      
      const sanitized = XSSPrevention.sanitizeJSON(JSON.stringify(malicious))
      
      expect(sanitized.name).toBe('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;')
      expect(sanitized.items[0]).toBe('&lt;img src=x onerror=alert(1)&gt;')
      expect(sanitized.items[1]).toBe('normal text')
    })
  })

  describe('CSRFProtection', () => {
    it('should generate CSRF tokens', () => {
      const token1 = CSRFProtection.generateToken()
      const token2 = CSRFProtection.generateToken()
      
      expect(token1).toHaveLength(64) // 32 bytes = 64 hex chars
      expect(token2).toHaveLength(64)
      expect(token1).not.toBe(token2)
    })

    it('should verify CSRF tokens', () => {
      const token = CSRFProtection.generateToken()
      
      expect(CSRFProtection.verifyToken(token, token)).toBe(true)
      expect(CSRFProtection.verifyToken(token, 'invalid')).toBe(false)
      expect(CSRFProtection.verifyToken('', '')).toBe(false)
    })

    it('should generate form tokens', () => {
      const { token, field } = CSRFProtection.generateFormToken()
      
      expect(token).toHaveLength(64)
      expect(field).toMatch(/^csrf_token_[a-f0-9]{16}$/)
    })
  })

  describe('RateLimiter', () => {
    beforeEach(() => {
      // Clear rate limiter state
      RateLimiter['requests'].clear()
    })

    it('should allow requests within rate limit', () => {
      const identifier = 'test-user'
      
      expect(RateLimiter.checkRateLimit(identifier, 5)).toBe(true)
      expect(RateLimiter.checkRateLimit(identifier, 5)).toBe(true)
      expect(RateLimiter.checkRateLimit(identifier, 5)).toBe(true)
    })

    it('should block requests exceeding rate limit', () => {
      const identifier = 'test-user'
      
      // Make 5 requests (within limit)
      for (let i = 0; i < 5; i++) {
        expect(RateLimiter.checkRateLimit(identifier, 5)).toBe(true)
      }
      
      // 6th request should be blocked
      expect(RateLimiter.checkRateLimit(identifier, 5)).toBe(false)
    })

    it('should reset rate limit after window', () => {
      const identifier = 'test-user'
      
      // Mock Date.now to simulate time passing
      // const originalNow = Date.now
      let currentTime = 1000000
      vi.spyOn(Date, 'now').mockImplementation(() => currentTime)
      
      // Make requests
      expect(RateLimiter.checkRateLimit(identifier, 5)).toBe(true)
      
      // Advance time beyond window
      currentTime += 16 * 60 * 1000 // 16 minutes
      
      // Should allow requests again
      expect(RateLimiter.checkRateLimit(identifier, 5)).toBe(true)
      
      vi.restoreAllMocks()
    })

    it('should get remaining requests', () => {
      const identifier = 'test-user'
      
      expect(RateLimiter.getRemainingRequests(identifier, 5)).toBe(5)
      
      RateLimiter.checkRateLimit(identifier, 5)
      expect(RateLimiter.getRemainingRequests(identifier, 5)).toBe(4)
    })

    it('should cleanup expired entries', () => {
      const identifier = 'test-user'
      
      // Mock Date.now
      // const originalNow = Date.now
      let currentTime = 1000000
      vi.spyOn(Date, 'now').mockImplementation(() => currentTime)
      
      // Make request
      RateLimiter.checkRateLimit(identifier, 5)
      
      // Advance time beyond window
      currentTime += 16 * 60 * 1000
      
      // Cleanup should remove expired entry
      RateLimiter.cleanup()
      expect(RateLimiter.getRemainingRequests(identifier, 5)).toBe(5)
      
      vi.restoreAllMocks()
    })
  })

  describe('PasswordSecurity', () => {
    it('should validate password strength', () => {
      const weakPassword = '123'
      const strongPassword = 'StrongP@ssw0rd!'
      
      const weakResult = PasswordSecurity.validatePassword(weakPassword)
      const strongResult = PasswordSecurity.validatePassword(strongPassword)
      
      expect(weakResult.isValid).toBe(false)
      expect(weakResult.errors.length).toBeGreaterThan(0)
      
      expect(strongResult.isValid).toBe(true)
      expect(strongResult.errors.length).toBe(0)
    })

    it('should detect common passwords', () => {
      expect(PasswordSecurity.isCommonPassword('password')).toBe(true)
      expect(PasswordSecurity.isCommonPassword('123456')).toBe(true)
      expect(PasswordSecurity.isCommonPassword('StrongP@ssw0rd!')).toBe(false)
    })

    it('should generate secure passwords', () => {
      // Test multiple passwords to ensure reliability
      for (let i = 0; i < 10; i++) {
        const password = PasswordSecurity.generateSecurePassword(16)
        
        expect(password).toHaveLength(16)
        expect(/[A-Z]/.test(password)).toBe(true) // Uppercase
        expect(/[a-z]/.test(password)).toBe(true) // Lowercase
        expect(/\d/.test(password)).toBe(true) // Numbers
        expect(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)).toBe(true) // Symbols
      }
    })
  })

  describe('SessionSecurity', () => {
    it('should generate secure session IDs', () => {
      const sessionId1 = SessionSecurity.generateSessionId()
      const sessionId2 = SessionSecurity.generateSessionId()
      
      expect(sessionId1).toHaveLength(64) // 32 bytes = 64 hex chars
      expect(sessionId2).toHaveLength(64)
      expect(sessionId1).not.toBe(sessionId2)
    })

    it('should validate session ID format', () => {
      const validSessionId = SessionSecurity.generateSessionId()
      const invalidSessionId = 'invalid-session-id'
      
      expect(SessionSecurity.validateSessionId(validSessionId)).toBe(true)
      expect(SessionSecurity.validateSessionId(invalidSessionId)).toBe(false)
    })

    it('should check session expiration', () => {
      const now = new Date()
      const expired = new Date(now.getTime() - 25 * 60 * 60 * 1000) // 25 hours ago
      const valid = new Date(now.getTime() - 1 * 60 * 60 * 1000) // 1 hour ago
      
      expect(SessionSecurity.isSessionExpired(expired)).toBe(true)
      expect(SessionSecurity.isSessionExpired(valid)).toBe(false)
    })

    it('should generate session fingerprints', () => {
      const userAgent = 'Mozilla/5.0'
      const ipAddress = '192.168.1.1'
      
      const fingerprint1 = SessionSecurity.generateFingerprint(userAgent, ipAddress)
      const fingerprint2 = SessionSecurity.generateFingerprint(userAgent, ipAddress)
      
      expect(fingerprint1).toHaveLength(64) // SHA256 hex length
      expect(fingerprint2).toHaveLength(64)
      expect(fingerprint1).toBe(fingerprint2) // Same input should produce same fingerprint
    })
  })

  describe('FileSecurity', () => {
    it('should validate file types', () => {
      expect(FileSecurity.validateFileType('image/jpeg')).toBe(true)
      expect(FileSecurity.validateFileType('image/png')).toBe(true)
      expect(FileSecurity.validateFileType('application/exe')).toBe(false)
    })

    it('should validate file sizes', () => {
      expect(FileSecurity.validateFileSize(1024)).toBe(true) // 1KB
      expect(FileSecurity.validateFileSize(10 * 1024 * 1024)).toBe(true) // 10MB
      expect(FileSecurity.validateFileSize(11 * 1024 * 1024)).toBe(false) // 11MB
    })

    it('should scan files for malicious content', () => {
      const safeBuffer = Buffer.from('This is safe content')
      const maliciousBuffer = Buffer.from([0x4D, 0x5A, 0x90, 0x00]) // PE signature
      
      const safeResult = FileSecurity.scanFile(safeBuffer)
      const maliciousResult = FileSecurity.scanFile(maliciousBuffer)
      
      expect(safeResult.isSafe).toBe(true)
      expect(safeResult.threats).toHaveLength(0)
      
      expect(maliciousResult.isSafe).toBe(false)
      expect(maliciousResult.threats).toContain('Executable file detected')
    })
  })

  describe('SecurityHeaders', () => {
    it('should generate security headers', () => {
      const headers = SecurityHeaders.getSecurityHeaders()
      
      expect(headers['X-Content-Type-Options']).toBe('nosniff')
      expect(headers['X-Frame-Options']).toBe('DENY')
      expect(headers['X-XSS-Protection']).toBe('1; mode=block')
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    })

    it('should generate CSP header', () => {
      const csp = SecurityHeaders.getCSPHeader()
      
      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("script-src 'self'")
      expect(csp).toContain("style-src 'self'")
      expect(csp).toContain("img-src 'self' data: https:")
    })

    it('should generate CORS headers', () => {
      const corsHeaders = SecurityHeaders.getCORSHeaders(['https://example.com'])
      
      expect(corsHeaders['Access-Control-Allow-Origin']).toBe('https://example.com')
      expect(corsHeaders['Access-Control-Allow-Methods']).toBe('GET, POST, PUT, DELETE, OPTIONS')
      expect(corsHeaders['Access-Control-Allow-Headers']).toBe('Content-Type, Authorization, X-CSRF-Token')
    })
  })

  describe('SecuritySchemas', () => {
    it('should validate email schema', async () => {
      const validEmail = 'test@example.com'
      const invalidEmail = 'invalid-email'
      
      expect(SecuritySchemas.email.parse(validEmail)).toBe('test@example.com')
      expect(() => SecuritySchemas.email.parse(invalidEmail)).toThrow()
    })

    it('should validate password schema', async () => {
      const validPassword = 'StrongP@ssw0rd!'
      const invalidPassword = '123'
      
      expect(SecuritySchemas.password.parse(validPassword)).toBe(validPassword)
      expect(() => SecuritySchemas.password.parse(invalidPassword)).toThrow()
    })

    it('should validate username schema', async () => {
      const validUsername = 'testuser123'
      const invalidUsername = 'a'
      
      expect(SecuritySchemas.username.parse(validUsername)).toBe('testuser123')
      expect(() => SecuritySchemas.username.parse(invalidUsername)).toThrow()
    })
  })

  describe('SecurityAudit', () => {
    it('should run security audit', async () => {
      const audit = await SecurityAudit.runAudit()
      
      expect(audit).toHaveProperty('score')
      expect(audit).toHaveProperty('issues')
      expect(typeof audit.score).toBe('number')
      expect(Array.isArray(audit.issues)).toBe(true)
    })

    it('should identify missing environment variables', async () => {
      const originalEnv = process.env.NEXTAUTH_SECRET
      delete process.env.NEXTAUTH_SECRET
      
      const audit = await SecurityAudit.runAudit()
      
      const criticalIssues = audit.issues.filter(i => i.severity === 'critical')
      expect(criticalIssues.length).toBeGreaterThan(0)
      
      // Restore environment variable
      if (originalEnv) {
        process.env.NEXTAUTH_SECRET = originalEnv
      }
    })
  })
})
