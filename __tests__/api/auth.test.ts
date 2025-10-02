import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as loginHandler } from '@/app/api/auth/login/route'
import { POST as registerHandler } from '@/app/api/auth/register/route'
import { POST as logoutHandler } from '@/app/api/auth/logout/route'
import { POST as verifyEmailHandler } from '@/app/api/auth/verify-email/route'
import { POST as forgotPasswordHandler } from '@/app/api/auth/forgot-password/route'
import { POST as resetPasswordHandler } from '@/app/api/auth/reset-password/route'
import { POST as changePasswordHandler } from '@/app/api/auth/change-password/route'

// Mock the auth service
const mockAuthService = {
  authenticateUser: vi.fn(),
  createUser: vi.fn(),
  logoutUser: vi.fn(),
  verifyEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  resetPassword: vi.fn(),
  changePassword: vi.fn(),
  getSessionFromToken: vi.fn(),
  isAdmin: vi.fn(),
}

// Mock the auth service module
vi.mock('@/lib/auth-service', () => mockAuthService)

// Mock validation
const mockValidation = {
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
}

vi.mock('@/lib/validation', () => mockValidation)

// Mock rate limiting
const mockRateLimit = {
  rateLimit: vi.fn(),
}

vi.mock('@/lib/rate-limit', () => mockRateLimit)

// Mock email services
const mockEmailServices = {
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  resetPassword: vi.fn(),
  changePassword: vi.fn(),
}

vi.mock('@/lib/email-verification', () => ({
  sendVerificationEmail: mockEmailServices.sendVerificationEmail,
}))

vi.mock('@/lib/password-reset', () => ({
  sendPasswordResetEmail: mockEmailServices.sendPasswordResetEmail,
  resetPassword: mockEmailServices.resetPassword,
  changePassword: mockEmailServices.changePassword,
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
    passwordChangedAt: new Date('2023-01-01T00:00:00Z'),
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
      mockRateLimit.rateLimit.mockResolvedValue({ success: true })

      // Mock validation
      mockValidation.validateRequestBody.mockResolvedValue({
        success: true,
        data: { email: 'john@example.com', password: 'password123' },
      })

      // Mock authentication
      mockAuthService.authenticateUser.mockResolvedValue(mockAuthResult)

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockAuthResult.data)
      expect(data.message).toBe('Login successful')

      expect(mockRateLimit.rateLimit).toHaveBeenCalledWith(request, {
        max: 5,
        window: 15 * 60 * 1000,
        keyGenerator: expect.any(Function),
      })
      expect(mockValidation.validateRequestBody).toHaveBeenCalledWith('login-schema', request)
      expect(mockAuthService.authenticateUser).toHaveBeenCalledWith({
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
      mockRateLimit.rateLimit.mockResolvedValue({
        success: false,
        retryAfter: 900,
      })

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
      mockRateLimit.rateLimit.mockResolvedValue({ success: true })

      // Mock validation failure
      mockValidation.validateRequestBody.mockResolvedValue({
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
      mockValidation.createValidationErrorResponse.mockReturnValue(mockValidationErrorResponse)

      const response = await loginHandler(request)

      expect(response.status).toBe(400)
      expect(mockValidation.createValidationErrorResponse).toHaveBeenCalledWith([
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
      mockRateLimit.rateLimit.mockResolvedValue({ success: true })

      // Mock validation
      mockValidation.validateRequestBody.mockResolvedValue({
        success: true,
        data: { email: 'john@example.com', password: 'wrongpassword' },
      })

      // Mock authentication failure
      mockAuthService.authenticateUser.mockResolvedValue({
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
      mockRateLimit.rateLimit.mockResolvedValue({ success: true })

      // Mock validation
      mockValidation.validateRequestBody.mockResolvedValue({
        success: true,
        data: { email: 'john@example.com', password: 'password123' },
      })

      // Mock authentication error
      mockAuthService.authenticateUser.mockRejectedValue(new Error('Database connection failed'))

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
        },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: 'user',
        }),
      })

      // Mock validation
      mockValidation.validateRequestBody.mockResolvedValue({
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
      mockAuthService.createUser.mockResolvedValue(mockCreateResult)

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockCreateResult.data)
      expect(data.message).toBe('User created successfully')

      expect(mockValidation.validateRequestBody).toHaveBeenCalledWith('register-schema', request)
      expect(mockAuthService.createUser).toHaveBeenCalledWith({
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
        },
        body: JSON.stringify({
          firstName: '',
          lastName: 'Doe',
          email: 'invalid-email',
          role: 'invalid-role',
        }),
      })

      // Mock validation failure
      mockValidation.validateRequestBody.mockResolvedValue({
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
      mockValidation.createValidationErrorResponse.mockReturnValue(mockValidationErrorResponse)

      const response = await registerHandler(request)

      expect(response.status).toBe(400)
      expect(mockValidation.createValidationErrorResponse).toHaveBeenCalledWith([
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
        },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'existing@example.com',
          role: 'user',
        }),
      })

      // Mock validation
      mockValidation.validateRequestBody.mockResolvedValue({
        success: true,
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'existing@example.com',
          role: 'user',
        },
      })

      // Mock user creation failure
      mockAuthService.createUser.mockResolvedValue({
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
      mockAuthService.getSessionFromToken.mockResolvedValue({
        id: 'user-123',
        email: 'john@example.com',
        role: 'user',
      })

      // Mock logout
      mockAuthService.logoutUser.mockResolvedValue({
        success: true,
        message: 'Logged out successfully',
      })

      const response = await logoutHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Logged out successfully')

      expect(mockAuthService.getSessionFromToken).toHaveBeenCalledWith('jwt-token-123')
      expect(mockAuthService.logoutUser).toHaveBeenCalledWith('user-123')
    })

    it('should return 401 for invalid token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid-token',
        },
      })

      // Mock session validation failure
      mockAuthService.getSessionFromToken.mockResolvedValue(null)

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
      mockValidation.validateRequestBody.mockResolvedValue({
        success: true,
        data: { token: 'verification-token-123' },
      })

      // Mock email verification
      mockEmailServices.verifyEmail.mockResolvedValue({
        success: true,
        message: 'Email verified successfully',
        user: mockUser,
      })

      const response = await verifyEmailHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Email verified successfully')
      expect(data.user).toEqual(mockUser)

      expect(mockValidation.validateRequestBody).toHaveBeenCalledWith('verify-email-schema', request)
      expect(mockEmailServices.verifyEmail).toHaveBeenCalledWith('verification-token-123')
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
      mockValidation.validateRequestBody.mockResolvedValue({
        success: true,
        data: { token: 'invalid-token' },
      })

      // Mock email verification failure
      mockEmailServices.verifyEmail.mockResolvedValue({
        success: false,
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
      mockValidation.validateRequestBody.mockResolvedValue({
        success: true,
        data: { email: 'john@example.com' },
      })

      // Mock password reset email
      mockEmailServices.sendPasswordResetEmail.mockResolvedValue({
        success: true,
        message: 'Password reset email sent successfully',
      })

      const response = await forgotPasswordHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Password reset email sent successfully')

      expect(mockValidation.validateRequestBody).toHaveBeenCalledWith('forgot-password-schema', request)
      expect(mockEmailServices.sendPasswordResetEmail).toHaveBeenCalledWith('john@example.com')
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
      mockValidation.validateRequestBody.mockResolvedValue({
        success: true,
        data: { token: 'reset-token-123', newPassword: 'newPassword123' },
      })

      // Mock password reset
      mockEmailServices.resetPassword.mockResolvedValue({
        success: true,
        message: 'Password reset successfully',
      })

      const response = await resetPasswordHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Password reset successfully')

      expect(mockValidation.validateRequestBody).toHaveBeenCalledWith('reset-password-schema', request)
      expect(mockEmailServices.resetPassword).toHaveBeenCalledWith('reset-token-123', 'newPassword123')
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
      mockAuthService.getSessionFromToken.mockResolvedValue({
        id: 'user-123',
        email: 'john@example.com',
        role: 'user',
      })

      // Mock validation
      mockValidation.validateRequestBody.mockResolvedValue({
        success: true,
        data: { currentPassword: 'currentPassword123', newPassword: 'newPassword123' },
      })

      // Mock password change
      mockEmailServices.changePassword.mockResolvedValue({
        success: true,
        message: 'Password changed successfully',
      })

      const response = await changePasswordHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Password changed successfully')

      expect(mockAuthService.getSessionFromToken).toHaveBeenCalledWith('jwt-token-123')
      expect(mockValidation.validateRequestBody).toHaveBeenCalledWith('change-password-schema', request)
      expect(mockEmailServices.changePassword).toHaveBeenCalledWith(
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
      mockAuthService.getSessionFromToken.mockResolvedValue(null)

      const response = await changePasswordHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INVALID_TOKEN')
      expect(data.error.message).toBe('Invalid or expired token')
    })
  })
})
