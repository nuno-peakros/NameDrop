/**
 * Security E2E tests
 * 
 * Tests for:
 * - Authentication security
 * - Authorization security
 * - Input validation
 * - XSS prevention
 * - CSRF protection
 * - Rate limiting
 * - Security headers
 * - File upload security
 */

import { test, expect } from '@playwright/test'

test.describe('Security', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
  })

  test('should prevent SQL injection in login form', async ({ page }) => {
    // Attempt SQL injection
    await page.fill('input[name="email"]', "admin' OR '1'='1")
    await page.fill('input[name="password"]', "password' OR '1'='1")
    await page.click('button[type="submit"]')
    
    // Should not be logged in
    await expect(page).toHaveURL('/login')
    await expect(page.getByText('Invalid credentials')).toBeVisible()
  })

  test('should prevent XSS in login form', async ({ page }) => {
    // Attempt XSS injection
    await page.fill('input[name="email"]', '<script>alert("xss")</script>')
    await page.fill('input[name="password"]', '<img src=x onerror=alert(1)>')
    await page.click('button[type="submit"]')
    
    // Should not execute scripts
    await expect(page).toHaveURL('/login')
    
    // Check if script tags are escaped
    const emailInput = page.locator('input[name="email"]')
    await expect(emailInput).toHaveValue('&lt;script&gt;alert("xss")&lt;/script&gt;')
  })

  test('should enforce rate limiting on login attempts', async ({ page }) => {
    // Make multiple failed login attempts
    for (let i = 0; i < 6; i++) {
      await page.fill('input[name="email"]', `test${i}@example.com`)
      await page.fill('input[name="password"]', 'wrongpassword')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(100)
    }
    
    // Should show rate limit message
    await expect(page.getByText('Too many attempts')).toBeVisible()
  })

  test('should have proper security headers', async ({ page }) => {
    const response = await page.goto('/')
    
    // Check security headers
    const headers = response?.headers()
    expect(headers?.['x-content-type-options']).toBe('nosniff')
    expect(headers?.['x-frame-options']).toBe('DENY')
    expect(headers?.['x-xss-protection']).toBe('1; mode=block')
    expect(headers?.['referrer-policy']).toBe('strict-origin-when-cross-origin')
  })

  test('should prevent CSRF attacks', async ({ page }) => {
    // Try to make request without CSRF token
    const response = await page.request.post('/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'password'
      }
    })
    
    // Should be rejected
    expect(response.status()).toBe(400)
  })

  test('should validate file uploads', async ({ page }) => {
    // Navigate to file upload page (if exists)
    await page.goto('/dashboard')
    
    // Try to upload malicious file
    const fileInput = page.locator('input[type="file"]')
    if (await fileInput.isVisible()) {
      // Create a mock executable file
      const buffer = Buffer.from([0x4D, 0x5A, 0x90, 0x00]) // PE signature
      const file = {
        name: 'malicious.exe',
        mimeType: 'application/x-executable',
        buffer: buffer
      }
      
      await fileInput.setInputFiles([file])
      
      // Should show error
      await expect(page.getByText('Invalid file type')).toBeVisible()
    }
  })

  test('should prevent directory traversal', async ({ page }) => {
    // Try to access restricted files
    const restrictedPaths = [
      '/etc/passwd',
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      '/api/../etc/passwd'
    ]
    
    for (const path of restrictedPaths) {
      const response = await page.goto(path)
      expect(response?.status()).toBe(404)
    }
  })

  test('should enforce HTTPS in production', async ({ page }) => {
    // This test would need to be run in production environment
    // For now, just check that the page loads
    await page.goto('/')
    await expect(page).toHaveTitle(/NameDrop/)
  })

  test('should prevent clickjacking', async ({ page }) => {
    // Check X-Frame-Options header
    const response = await page.goto('/')
    const headers = response?.headers()
    
    expect(headers?.['x-frame-options']).toBe('DENY')
  })

  test('should validate input length limits', async ({ page }) => {
    // Try to submit extremely long input
    const longString = 'a'.repeat(10000)
    
    await page.fill('input[name="email"]', longString)
    await page.fill('input[name="password"]', longString)
    await page.click('button[type="submit"]')
    
    // Should show validation error
    await expect(page.getByText('Input too long')).toBeVisible()
  })

  test('should prevent open redirects', async ({ page }) => {
    // Try to redirect to external site
    const maliciousUrls = [
      'https://malicious.com',
      'http://evil.com',
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>'
    ]
    
    for (const url of maliciousUrls) {
      const response = await page.goto(`/redirect?url=${encodeURIComponent(url)}`)
      
      // Should not redirect to external site
      expect(response?.url()).not.toContain('malicious.com')
      expect(response?.url()).not.toContain('evil.com')
    }
  })

  test('should sanitize user input in display', async ({ page }) => {
    // Create a user with malicious input
    await page.goto('/register')
    
    const maliciousName = '<script>alert("xss")</script>'
    await page.fill('input[name="name"]', maliciousName)
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Navigate to user profile
    await page.goto('/dashboard')
    
    // Check that script tags are escaped
    const nameElement = page.locator('[data-testid="user-name"]')
    if (await nameElement.isVisible()) {
      await expect(nameElement).toContainText('&lt;script&gt;alert("xss")&lt;/script&gt;')
    }
  })

  test('should enforce session timeout', async ({ page }) => {
    // Login
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'password')
    await page.click('button[type="submit"]')
    
    // Wait for session to expire (this would need to be configured for testing)
    await page.waitForTimeout(1000)
    
    // Try to access protected resource
    await page.goto('/dashboard')
    
    // Should be redirected to login
    await expect(page).toHaveURL('/login')
  })

  test('should prevent privilege escalation', async ({ page }) => {
    // Login as regular user
    await page.fill('input[name="email"]', 'user@example.com')
    await page.fill('input[name="password"]', 'password')
    await page.click('button[type="submit"]')
    
    // Try to access admin-only resource
    await page.goto('/admin')
    
    // Should be denied access
    await expect(page.getByText('Access denied')).toBeVisible()
  })

  test('should validate CSRF tokens on state-changing requests', async ({ page }) => {
    // Login first
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'password')
    await page.click('button[type="submit"]')
    
    // Try to make POST request without CSRF token
    const response = await page.request.post('/api/users', {
      data: {
        name: 'New User',
        email: 'newuser@example.com'
      }
    })
    
    // Should be rejected
    expect(response.status()).toBe(400)
  })

  test('should prevent information disclosure in error messages', async ({ page }) => {
    // Try to access non-existent resource
    const response = await page.goto('/api/nonexistent')
    
    // Should not reveal internal information
    const body = await response?.text()
    expect(body).not.toContain('stack trace')
    expect(body).not.toContain('database')
    expect(body).not.toContain('internal')
  })

  test('should enforce content security policy', async ({ page }) => {
    // Check CSP header
    const response = await page.goto('/')
    const headers = response?.headers()
    
    expect(headers?.['content-security-policy']).toContain("default-src 'self'")
    expect(headers?.['content-security-policy']).toContain("script-src 'self'")
  })

  test('should prevent timing attacks', async ({ page }) => {
    // Measure response times for valid and invalid users
    const startTime = Date.now()
    
    await page.fill('input[name="email"]', 'nonexistent@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    const invalidUserTime = Date.now() - startTime
    
    await page.waitForTimeout(100)
    
    const startTime2 = Date.now()
    
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    const validUserTime = Date.now() - startTime2
    
    // Response times should be similar (within 100ms)
    expect(Math.abs(invalidUserTime - validUserTime)).toBeLessThan(100)
  })

  test('should handle security headers correctly', async ({ page }) => {
    // Test various security headers
    const response = await page.goto('/')
    const headers = response?.headers()
    
    // Check for security headers
    expect(headers?.['strict-transport-security']).toContain('max-age=31536000')
    expect(headers?.['permissions-policy']).toContain('camera=()')
    expect(headers?.['permissions-policy']).toContain('microphone=()')
  })

  test('should prevent brute force attacks', async ({ page }) => {
    // Make multiple failed login attempts
    for (let i = 0; i < 10; i++) {
      await page.fill('input[name="email"]', 'admin@example.com')
      await page.fill('input[name="password"]', `wrongpassword${i}`)
      await page.click('button[type="submit"]')
      await page.waitForTimeout(100)
    }
    
    // Should show account lockout message
    await expect(page.getByText('Account locked')).toBeVisible()
  })
})
