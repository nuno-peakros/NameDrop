import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { POST as loginHandler } from '@/app/api/auth/login/route'
import { POST as registerHandler } from '@/app/api/auth/register/route'
import { POST as logoutHandler } from '@/app/api/auth/logout/route'
import { POST as verifyEmailHandler } from '@/app/api/auth/verify-email/route'
import { POST as forgotPasswordHandler } from '@/app/api/auth/forgot-password/route'
import { POST as resetPasswordHandler } from '@/app/api/auth/reset-password/route'
import { POST as changePasswordHandler } from '@/app/api/auth/change-password/route'
import * as authService from '@/lib/auth-service'
import * as validation from '@/lib/validation'
import * as emailVerification from '@/lib/email-verification'
import * as passwordReset from '@/lib/password-reset'
import * as rateLimit from '@/lib/rate-limit'
import * as userService from '@/lib/user-service'

// Mock the auth service module
vi.mock('@/lib/auth-service', () => ({
  authenticateUser: vi.fn(),
  createUser: vi.fn(),
  logoutUser: vi.fn(),
  verifyEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  resetPassword: vi.fn(),
  changePassword: vi.fn(),
  getSessionFromToken: vi.fn(),
  isAdmin: vi.fn(),
}))

// Mock validation
vi.mock('@/lib/validation', () => ({
  validateRequestBody: vi.fn(),
  createValidationErrorResponse: vi.fn(),
  authSchemas: {
    login: 'login-schema',
    register: 'register-schema',
    verifyEmail: 'verify-email-schema',
    forgotPassword: 'forgot-password-schema',
    resetPassword: 'reset-password-schema',
    changePassword: 'change-password-schema',
  },
}))

// Mock rate limiting
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
  applyRateLimit: vi.fn(),
}))

// Mock email services
vi.mock('@/lib/email-verification', () => ({
  sendVerificationEmail: vi.fn(),
  verifyEmail: vi.fn(),
}))

vi.mock('@/lib/password-reset', () => ({
  sendPasswordResetEmail: vi.fn(),
  resetPassword: vi.fn(),
  changePassword: vi.fn(),
}))

vi.mock('@/lib/user-service', () => ({
  createUser: vi.fn(),
}))

/**
 * Unit tests for authentication API endpoints
 * 
 * Tests cover:
 * - Login endpoint
 * - Register endpoint
 * - Logout endpoint
 * - Email verification endpoint
 * - Password reset endpoints
 * - Change password endpoint
 * - Error handling and validation
 */
describe('Auth API Endpoints', () => {
  const mockUser = {
    id: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'user',
    emailVerified: true,
    passwordChangedAt: '2023-01-01T00:00:00.000Z',
  }

  const mockToken = 'jwt-token-123'
  const mockAuthResult = {
    success: true,
    data: {
      user: mockUser,
      token: mockToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    message: 'Login successful',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'john@example.com',
          password: 'password123',
        }),
      })

      // Mock rate limiting
      vi.mocked(rateLimit.applyRateLimit).mockReturnValue(null)

      // Mock validation
      vi.mocked(validation).validateRequestBody.mockResolvedValue({
        success: true,
        data: { email: 'john@example.com', password: 'password123' },
      })

      // Mock authentication
      vi.mocked(authService).authenticateUser.mockResolvedValue(mockAuthResult)

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockAuthResult.data)
      expect(data.message).toBe('Login successful')

      expect(vi.mocked(rateLimit.applyRateLimit)).toHaveBeenCalledWith(request, {
        maxRequests: 50,
        windowMs: 15 * 60 * 1000,
      })
      expect(vi.mocked(validation).validateRequestBody).toHaveBeenCalledWith('login-schema', request)
      expect(vi.mocked(authService).authenticateUser).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
      })
    })

    it('should return 429 for rate limit exceeded', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'john@example.com',
          password: 'password123',
        }),
      })

      // Mock rate limiting failure
      vi.mocked(rateLimit.applyRateLimit).mockReturnValue(
        NextResponse.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              retryAfter: 900,
            },
          },
          { status: 429 }
        )
      )

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(data.error.retryAfter).toBe(900)
    })

    it('should return 400 for validation errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invalid-email',
          password: '123',
        }),
      })

      // Mock rate limiting
      vi.mocked(rateLimit.applyRateLimit).mockReturnValue(null)

      // Mock validation failure
      vi.mocked(validation).validateRequestBody.mockResolvedValue({
        success: false,
        errors: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Password too short' },
        ],
      })

      const mockValidationErrorResponse = NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed' } },
        { status: 400 }
      )
      vi.mocked(validation).createValidationErrorResponse.mockReturnValue(mockValidationErrorResponse)

      const response = await loginHandler(request)

      expect(response.status).toBe(400)
      expect(vi.mocked(validation).createValidationErrorResponse).toHaveBeenCalledWith([
        { field: 'email', message: 'Invalid email format' },
        { field: 'password', message: 'Password too short' },
      ])
    })

    it('should return 401 for invalid credentials', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'john@example.com',
          password: 'wrongpassword',
        }),
      })

      // Mock rate limiting
      vi.mocked(rateLimit.applyRateLimit).mockReturnValue(null)

      // Mock validation
      vi.mocked(validation).validateRequestBody.mockResolvedValue({
        success: true,
        data: { email: 'john@example.com', password: 'wrongpassword' },
      })

      // Mock authentication failure
      vi.mocked(authService).authenticateUser.mockResolvedValue({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INVALID_CREDENTIALS')
      expect(data.error.message).toBe('Invalid email or password')
    })

    it('should return 500 for internal errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'john@example.com',
          password: 'password123',
        }),
      })

      // Mock rate limiting
      vi.mocked(rateLimit.applyRateLimit).mockReturnValue(null)

      // Mock validation
      vi.mocked(validation).validateRequestBody.mockResolvedValue({
        success: true,
        data: { email: 'john@example.com', password: 'password123' },
      })

      // Mock authentication error
      vi.mocked(authService).authenticateUser.mockRejectedValue(new Error('Database connection failed'))

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
      expect(data.error.message).toBe('An unexpected error occurred during login')
    })
  })

  describe('POST /api/auth/register', () => {
    it('should register user successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token-123',
        },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: 'user',
        }),
      })

      // Mock authentication
      vi.mocked(authService).getSessionFromToken.mockResolvedValue({
        userId: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
      })
      vi.mocked(authService).isAdmin.mockResolvedValue(true)

      // Mock validation
      vi.mocked(validation).validateRequestBody.mockResolvedValue({
        success: true,
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: 'user',
        },
      })

      // Mock user creation
      const mockCreateResult = {
        success: true,
        data: {
          user: mockUser,
          temporaryPassword: 'tempPassword123',
        },
        message: 'User created successfully',
      }
      vi.mocked(userService).createUser.mockResolvedValue(mockCreateResult)

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockCreateResult.data)
      expect(data.message).toBe('User created successfully')

      expect(vi.mocked(validation).validateRequestBody).toHaveBeenCalledWith('register-schema', request)
      expect(vi.mocked(userService).createUser).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'user',
      })
    })

    it('should return 400 for validation errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token-123',
        },
        body: JSON.stringify({
          firstName: '',
          lastName: 'Doe',
          email: 'invalid-email',
          role: 'invalid-role',
        }),
      })

      // Mock authentication
      vi.mocked(authService).getSessionFromToken.mockResolvedValue({
        userId: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
      })
      vi.mocked(authService).isAdmin.mockResolvedValue(true)

      // Mock validation failure
      vi.mocked(validation).validateRequestBody.mockResolvedValue({
        success: false,
        errors: [
          { field: 'firstName', message: 'First name is required' },
          { field: 'email', message: 'Invalid email format' },
          { field: 'role', message: 'Invalid role' },
        ],
      })

      const mockValidationErrorResponse = NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed' } },
        { status: 400 }
      )
      vi.mocked(validation).createValidationErrorResponse.mockReturnValue(mockValidationErrorResponse)

      const response = await registerHandler(request)

      expect(response.status).toBe(400)
      expect(vi.mocked(validation).createValidationErrorResponse).toHaveBeenCalledWith([
        { field: 'firstName', message: 'First name is required' },
        { field: 'email', message: 'Invalid email format' },
        { field: 'role', message: 'Invalid role' },
      ])
    })

    it('should return 409 for email already exists', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token-123',
        },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'existing@example.com',
          role: 'user',
        }),
      })

      // Mock authentication
      vi.mocked(authService).getSessionFromToken.mockResolvedValue({
        userId: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
      })
      vi.mocked(authService).isAdmin.mockResolvedValue(true)

      // Mock validation
      vi.mocked(validation).validateRequestBody.mockResolvedValue({
        success: true,
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'existing@example.com',
          role: 'user',
        },
      })

      // Mock user creation failure
      vi.mocked(userService).createUser.mockResolvedValue({
        success: false,
        error: 'EMAIL_EXISTS',
        message: 'Email address already exists',
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('EMAIL_EXISTS')
      expect(data.error.message).toBe('Email address already exists')
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer jwt-token-123',
        },
      })

      // Mock session validation
      vi.mocked(authService).getSessionFromToken.mockResolvedValue({
        userId: 'user-123',
        email: 'john@example.com',
        role: 'user',
      })

      // Mock logout
      vi.mocked(authService).logoutUser.mockResolvedValue({
        success: true,
        message: 'Logged out successfully',
      })

      const response = await logoutHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Logged out successfully')

      expect(vi.mocked(authService).getSessionFromToken).toHaveBeenCalledWith('jwt-token-123')
      expect(vi.mocked(authService).logoutUser).toHaveBeenCalledWith('user-123')
    })

    it('should return 401 for invalid token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid-token',
        },
      })

      // Mock session validation failure
      vi.mocked(authService).getSessionFromToken.mockResolvedValue(null)

      const response = await logoutHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INVALID_TOKEN')
      expect(data.error.message).toBe('Invalid or expired token')
    })
  })

  describe('POST /api/auth/verify-email', () => {
    it('should verify email successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: 'verification-token-123',
        }),
      })

      // Mock validation
      vi.mocked(validation).validateRequestBody.mockResolvedValue({
        success: true,
        data: { token: 'verification-token-123' },
      })

      // Mock email verification
      vi.mocked(emailVerification.verifyEmail).mockResolvedValue({
        success: true,
        message: 'Email verified successfully',
        user: mockUser,
      })

      const response = await verifyEmailHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Email verified successfully')

      expect(vi.mocked(validation).validateRequestBody).toHaveBeenCalledWith('verify-email-schema', request)
      expect(vi.mocked(emailVerification.verifyEmail)).toHaveBeenCalledWith('verification-token-123')
    })

    it('should return 400 for invalid token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: 'invalid-token',
        }),
      })

      // Mock validation
      vi.mocked(validation).validateRequestBody.mockResolvedValue({
        success: true,
        data: { token: 'invalid-token' },
      })

      // Mock email verification failure
      vi.mocked(emailVerification.verifyEmail).mockResolvedValue({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid verification token',
      })

      const response = await verifyEmailHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('Invalid verification token')
    })
  })

  describe('POST /api/auth/forgot-password', () => {
    it('should send password reset email successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'john@example.com',
        }),
      })

      // Mock validation
      vi.mocked(validation).validateRequestBody.mockResolvedValue({
        success: true,
        data: { email: 'john@example.com' },
      })

      // Mock password reset email
      vi.mocked(passwordReset.sendPasswordResetEmail).mockResolvedValue({
        success: true,
        message: 'Password reset email sent successfully',
      })

      const response = await forgotPasswordHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('If an account with that email exists, a password reset link has been sent.')

      expect(vi.mocked(validation).validateRequestBody).toHaveBeenCalledWith('forgot-password-schema', request)
      expect(vi.mocked(passwordReset.sendPasswordResetEmail)).toHaveBeenCalledWith('john@example.com')
    })
  })

  describe('POST /api/auth/reset-password', () => {
    it('should reset password successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: 'reset-token-123',
          newPassword: 'newPassword123',
        }),
      })

      // Mock validation
      vi.mocked(validation).validateRequestBody.mockResolvedValue({
        success: true,
        data: { token: 'reset-token-123', newPassword: 'newPassword123' },
      })

      // Mock password reset
      vi.mocked(passwordReset.resetPassword).mockResolvedValue({
        success: true,
        message: 'Password reset successfully',
      })

      const response = await resetPasswordHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Password reset successfully')

      expect(vi.mocked(validation).validateRequestBody).toHaveBeenCalledWith('reset-password-schema', request)
      expect(vi.mocked(passwordReset.resetPassword)).toHaveBeenCalledWith('reset-token-123', 'newPassword123')
    })
  })

  describe('POST /api/auth/change-password', () => {
    it('should change password successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer jwt-token-123',
        },
        body: JSON.stringify({
          currentPassword: 'currentPassword123',
          newPassword: 'newPassword123',
        }),
      })

      // Mock session validation
      vi.mocked(authService).getSessionFromToken.mockResolvedValue({
        userId: 'user-123',
        email: 'john@example.com',
        role: 'user',
      })

      // Mock validation
      vi.mocked(validation).validateRequestBody.mockResolvedValue({
        success: true,
        data: { currentPassword: 'currentPassword123', newPassword: 'newPassword123' },
      })

      // Mock password change
      vi.mocked(passwordReset.changePassword).mockResolvedValue({
        success: true,
        message: 'Password changed successfully',
      })

      const response = await changePasswordHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Password changed successfully')

      expect(vi.mocked(authService).getSessionFromToken).toHaveBeenCalledWith('jwt-token-123')
      expect(vi.mocked(validation).validateRequestBody).toHaveBeenCalledWith('change-password-schema', request)
      expect(vi.mocked(passwordReset.changePassword)).toHaveBeenCalledWith(
        'user-123',
        'currentPassword123',
        'newPassword123'
      )
    })

    it('should return 401 for invalid token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token',
        },
        body: JSON.stringify({
          currentPassword: 'currentPassword123',
          newPassword: 'newPassword123',
        }),
      })

      // Mock session validation failure
      vi.mocked(authService).getSessionFromToken.mockResolvedValue(null)

      const response = await changePasswordHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INVALID_TOKEN')
      expect(data.error.message).toBe('Invalid or expired token')
    })
  })
})
