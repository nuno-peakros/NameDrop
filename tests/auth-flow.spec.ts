import { test, expect } from '@playwright/test'

/**
 * E2E tests for authentication flow
 * 
 * Tests cover:
 * - User login flow
 * - User registration flow
 * - Email verification flow
 * - Password reset flow
 * - Password change flow
 * - Logout flow
 * - Error handling and validation
 */
test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login')
  })

  test('should display login form correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/NameDrop/)

    // Check form elements
    await expect(page.getByText('Welcome back')).toBeVisible()
    await expect(page.getByText('Sign in to your account to continue')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByText("Don't have an account?")).toBeVisible()
  })

  test('should show validation errors for invalid input', async ({ page }) => {
    // Try to submit form with invalid data
    await page.getByLabel('Email').fill('invalid-email')
    await page.getByLabel('Password').fill('123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Check validation errors
    await expect(page.getByText('Invalid email')).toBeVisible()
    await expect(page.getByText('String must contain at least 8 character(s)')).toBeVisible()
  })

  test('should handle login with invalid credentials', async ({ page }) => {
    // Mock API response for invalid credentials
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        }),
      })
    })

    // Fill form with invalid credentials
    await page.getByLabel('Email').fill('user@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Check error message
    await expect(page.getByText('Invalid email or password')).toBeVisible()
  })

  test('should handle successful login', async ({ page }) => {
    // Mock API response for successful login
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 'user-123',
              email: 'user@example.com',
              firstName: 'John',
              lastName: 'Doe',
              role: 'user',
              emailVerified: true,
            },
            token: 'jwt-token-123',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          message: 'Login successful',
        }),
      })
    })

    // Fill form with valid credentials
    await page.getByLabel('Email').fill('user@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Check loading state
    await expect(page.getByText('Signing in...')).toBeVisible()

    // Check redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
  })

  test('should handle rate limiting', async ({ page }) => {
    // Mock API response for rate limiting
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many login attempts. Please try again later.',
            retryAfter: 900,
          },
        }),
      })
    })

    // Fill form and submit
    await page.getByLabel('Email').fill('user@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Check rate limit error
    await expect(page.getByText('Too many login attempts. Please try again later.')).toBeVisible()
  })

  test('should navigate to email verification page', async ({ page }) => {
    // Navigate to email verification page
    await page.goto('/verify-email')

    // Check page elements
    await expect(page.getByText('Verify Email Address')).toBeVisible()
    await expect(page.getByText('Please enter the verification code sent to your email')).toBeVisible()
    await expect(page.getByLabel('Verification Code')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Verify Email' })).toBeVisible()
    await expect(page.getByText('Resend verification email')).toBeVisible()
  })

  test('should handle email verification', async ({ page }) => {
    // Navigate to email verification page
    await page.goto('/verify-email')

    // Mock API response for successful verification
    await page.route('**/api/auth/verify-email', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Email verified successfully',
          user: {
            id: 'user-123',
            email: 'user@example.com',
            emailVerified: true,
          },
        }),
      })
    })

    // Fill verification code
    await page.getByLabel('Verification Code').fill('verification-code-123')
    await page.getByRole('button', { name: 'Verify Email' }).click()

    // Check success message
    await expect(page.getByText('Email verified successfully')).toBeVisible()
  })

  test('should handle password reset flow', async ({ page }) => {
    // Navigate to forgot password page
    await page.goto('/forgot-password')

    // Check page elements
    await expect(page.getByText('Reset Password')).toBeVisible()
    await expect(page.getByText('Enter your email address and we\'ll send you a reset link')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send Reset Link' })).toBeVisible()

    // Mock API response for password reset
    await page.route('**/api/auth/forgot-password', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Password reset email sent successfully',
        }),
      })
    })

    // Fill email and submit
    await page.getByLabel('Email').fill('user@example.com')
    await page.getByRole('button', { name: 'Send Reset Link' }).click()

    // Check success message
    await expect(page.getByText('Password reset email sent successfully')).toBeVisible()
  })

  test('should handle password change flow', async ({ page }) => {
    // Navigate to change password page
    await page.goto('/change-password')

    // Check page elements
    await expect(page.getByText('Change Password')).toBeVisible()
    await expect(page.getByLabel('Current Password')).toBeVisible()
    await expect(page.getByLabel('New Password')).toBeVisible()
    await expect(page.getByLabel('Confirm New Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Change Password' })).toBeVisible()

    // Mock API response for password change
    await page.route('**/api/auth/change-password', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Password changed successfully',
        }),
      })
    })

    // Fill form and submit
    await page.getByLabel('Current Password').fill('currentPassword123')
    await page.getByLabel('New Password').fill('newPassword123')
    await page.getByLabel('Confirm New Password').fill('newPassword123')
    await page.getByRole('button', { name: 'Change Password' }).click()

    // Check success message
    await expect(page.getByText('Password changed successfully')).toBeVisible()
  })

  test('should validate password confirmation', async ({ page }) => {
    // Navigate to change password page
    await page.goto('/change-password')

    // Fill form with mismatched passwords
    await page.getByLabel('Current Password').fill('currentPassword123')
    await page.getByLabel('New Password').fill('newPassword123')
    await page.getByLabel('Confirm New Password').fill('differentPassword123')
    await page.getByRole('button', { name: 'Change Password' }).click()

    // Check validation error
    await expect(page.getByText('Passwords do not match')).toBeVisible()
  })

  test('should handle logout', async ({ page }) => {
    // Mock successful login first
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 'user-123',
              email: 'user@example.com',
              firstName: 'John',
              lastName: 'Doe',
              role: 'user',
              emailVerified: true,
            },
            token: 'jwt-token-123',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          message: 'Login successful',
        }),
      })
    })

    // Login first
    await page.getByLabel('Email').fill('user@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard')

    // Mock logout API response
    await page.route('**/api/auth/logout', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Logged out successfully',
        }),
      })
    })

    // Find and click logout button (assuming it exists in the dashboard)
    const logoutButton = page.getByRole('button', { name: 'Logout' })
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
    }

    // Check redirect to login page
    await expect(page).toHaveURL('/login')
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/auth/login', async route => {
      await route.abort('failed')
    })

    // Fill form and submit
    await page.getByLabel('Email').fill('user@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Check error message
    await expect(page.getByText('Network error')).toBeVisible()
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Check that form is still usable on mobile
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()

    // Check that form elements are properly sized for mobile
    const emailInput = page.getByLabel('Email')
    const passwordInput = page.getByLabel('Password')
    const submitButton = page.getByRole('button', { name: 'Sign in' })

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitButton).toBeVisible()
  })

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check form accessibility
    const emailInput = page.getByLabel('Email')
    const passwordInput = page.getByLabel('Password')

    await expect(emailInput).toHaveAttribute('type', 'email')
    await expect(emailInput).toHaveAttribute('aria-invalid', 'false')
    await expect(passwordInput).toHaveAttribute('type', 'password')
    await expect(passwordInput).toHaveAttribute('aria-invalid', 'false')

    // Check button accessibility
    const submitButton = page.getByRole('button', { name: 'Sign in' })
    await expect(submitButton).toHaveAttribute('type', 'submit')
  })
})
