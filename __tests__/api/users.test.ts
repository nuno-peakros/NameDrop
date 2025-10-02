import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as getUsersHandler, POST as createUserHandler } from '@/app/api/users/route'
import { GET as getUserHandler, PUT as updateUserHandler, DELETE as deleteUserHandler } from '@/app/api/users/[id]/route'
import { POST as reactivateUserHandler } from '@/app/api/users/[id]/reactivate/route'
import { POST as resendVerificationHandler } from '@/app/api/users/[id]/resend-verification/route'
import { POST as resetPasswordHandler } from '@/app/api/users/[id]/reset-password/route'

// Mock the user service
const mockUserService = {
  searchUsers: vi.fn(),
  createUser: vi.fn(),
  getUserById: vi.fn(),
  updateUser: vi.fn(),
  deactivateUser: vi.fn(),
  reactivateUser: vi.fn(),
}

// Mock the user service module
vi.mock('@/lib/user-service', () => mockUserService)

// Mock the auth service
const mockAuthService = {
  getSessionFromToken: vi.fn(),
  isAdmin: vi.fn(),
}

// Mock the auth service module
vi.mock('@/lib/auth-service', () => mockAuthService)

// Mock validation
const mockValidation = {
  validateQueryParams: vi.fn(),
  validateRequestBody: vi.fn(),
  createValidationErrorResponse: vi.fn(),
  userSchemas: {
    searchFilters: 'search-filters-schema',
    pagination: 'pagination-schema',
    createUser: 'create-user-schema',
    updateUser: 'update-user-schema',
  },
}

vi.mock('@/lib/validation', () => mockValidation)

// Mock email services
const mockEmailServices = {
  resendVerificationEmail: vi.fn(),
  adminResetPassword: vi.fn(),
}

vi.mock('@/lib/email-verification', () => ({
  resendVerificationEmail: mockEmailServices.resendVerificationEmail,
}))

vi.mock('@/lib/password-reset', () => ({
  adminResetPassword: mockEmailServices.adminResetPassword,
}))

/**
 * Unit tests for users API endpoints
 * 
 * Tests cover:
 * - GET /api/users (list users)
 * - POST /api/users (create user)
 * - GET /api/users/[id] (get user)
 * - PUT /api/users/[id] (update user)
 * - DELETE /api/users/[id] (deactivate user)
 * - POST /api/users/[id]/reactivate (reactivate user)
 * - POST /api/users/[id]/resend-verification (resend verification)
 * - POST /api/users/[id]/reset-password (admin reset password)
 * - Authentication and authorization
 * - Error handling and validation
 */
describe('Users API Endpoints', () => {
  const mockUser = {
    id: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'user',
    isActive: true,
    emailVerified: true,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  }

  const mockAdminUser = {
    id: 'admin-123',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    role: 'admin',
    isActive: true,
    emailVerified: true,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  }

  const mockSession = {
    id: 'admin-123',
    email: 'admin@example.com',
    role: 'admin',
  }

  const mockPaginatedUsers = {
    users: [mockUser, mockAdminUser],
    pagination: {
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/users', () => {
    it('should get users successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/users?page=1&limit=20&search=john&role=user', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer admin-token-123',
        },
      })

      // Mock session validation
      mockAuthService.getSessionFromToken.mockResolvedValue(mockSession)
      mockAuthService.isAdmin.mockReturnValue(true)

      // Mock validation
      mockValidation.validateQueryParams
        .mockResolvedValueOnce({ success: true, data: { search: 'john', role: 'user' } })
        .mockResolvedValueOnce({ success: true, data: { page: 1, limit: 20 } })

      // Mock user service
      mockUserService.searchUsers.mockResolvedValue({
        success: true,
        data: mockPaginatedUsers,
        message: 'Users retrieved successfully',
      })

      const response = await getUsersHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockPaginatedUsers)
      expect(data.message).toBe('Users retrieved successfully')

      expect(mockAuthService.getSessionFromToken).toHaveBeenCalledWith('admin-token-123')
      expect(mockAuthService.isAdmin).toHaveBeenCalledWith('admin')
      expect(mockUserService.searchUsers).toHaveBeenCalledWith(
        { search: 'john', role: 'user' },
        { page: 1, limit: 20 }
      )
    })

    it('should return 401 for missing authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'GET',
      })

      const response = await getUsersHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
      expect(data.error.message).toBe('Authorization token is required')
    })

    it('should return 401 for invalid token', async () => {
      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token',
        },
      })

      // Mock session validation failure
      mockAuthService.getSessionFromToken.mockResolvedValue(null)

      const response = await getUsersHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INVALID_TOKEN')
      expect(data.error.message).toBe('Invalid or expired token')
    })

    it('should return 403 for non-admin user', async () => {
      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer user-token-123',
        },
      })

      // Mock session validation
      mockAuthService.getSessionFromToken.mockResolvedValue({
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
      })
      mockAuthService.isAdmin.mockReturnValue(false)

      const response = await getUsersHandler(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INSUFFICIENT_PERMISSIONS')
      expect(data.error.message).toBe('Admin access required to view users')
    })

    it('should return 400 for validation errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/users?page=invalid&limit=abc', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer admin-token-123',
        },
      })

      // Mock session validation
      mockAuthService.getSessionFromToken.mockResolvedValue(mockSession)
      mockAuthService.isAdmin.mockReturnValue(true)

      // Mock validation failure
      mockValidation.validateQueryParams.mockResolvedValue({
        success: false,
        errors: [
          { field: 'page', message: 'Page must be a number' },
          { field: 'limit', message: 'Limit must be a number' },
        ],
      })

      const mockValidationErrorResponse = NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed' } },
        { status: 400 }
      )
      mockValidation.createValidationErrorResponse.mockReturnValue(mockValidationErrorResponse)

      const response = await getUsersHandler(request)

      expect(response.status).toBe(400)
      expect(mockValidation.createValidationErrorResponse).toHaveBeenCalledWith([
        { field: 'page', message: 'Page must be a number' },
        { field: 'limit', message: 'Limit must be a number' },
      ])
    })

    it('should return 500 for service errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer admin-token-123',
        },
      })

      // Mock session validation
      mockAuthService.getSessionFromToken.mockResolvedValue(mockSession)
      mockAuthService.isAdmin.mockReturnValue(true)

      // Mock validation
      mockValidation.validateQueryParams
        .mockResolvedValueOnce({ success: true, data: {} })
        .mockResolvedValueOnce({ success: true, data: { page: 1, limit: 20 } })

      // Mock user service error
      mockUserService.searchUsers.mockResolvedValue({
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Database connection failed',
      })

      const response = await getUsersHandler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('DATABASE_ERROR')
      expect(data.error.message).toBe('Database connection failed')
    })
  })

  describe('POST /api/users', () => {
    it('should create user successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer admin-token-123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          role: 'user',
        }),
      })

      // Mock session validation
      mockAuthService.getSessionFromToken.mockResolvedValue(mockSession)
      mockAuthService.isAdmin.mockReturnValue(true)

      // Mock validation
      mockValidation.validateRequestBody.mockResolvedValue({
        success: true,
        data: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          role: 'user',
        },
      })

      // Mock user creation
      const mockCreateResult = {
        success: true,
        data: {
          user: {
            id: 'user-456',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            role: 'user',
            isActive: true,
            emailVerified: false,
            createdAt: new Date('2023-01-01T00:00:00Z'),
          },
          temporaryPassword: 'tempPassword123',
        },
        message: 'User created successfully',
      }
      mockUserService.createUser.mockResolvedValue(mockCreateResult)

      const response = await createUserHandler(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockCreateResult.data)
      expect(data.message).toBe('User created successfully')

      expect(mockAuthService.getSessionFromToken).toHaveBeenCalledWith('admin-token-123')
      expect(mockAuthService.isAdmin).toHaveBeenCalledWith('admin')
      expect(mockValidation.validateRequestBody).toHaveBeenCalledWith('create-user-schema', request)
      expect(mockUserService.createUser).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        role: 'user',
      })
    })

    it('should return 409 for email already exists', async () => {
      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer admin-token-123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'existing@example.com',
          role: 'user',
        }),
      })

      // Mock session validation
      mockAuthService.getSessionFromToken.mockResolvedValue(mockSession)
      mockAuthService.isAdmin.mockReturnValue(true)

      // Mock validation
      mockValidation.validateRequestBody.mockResolvedValue({
        success: true,
        data: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'existing@example.com',
          role: 'user',
        },
      })

      // Mock user creation failure
      mockUserService.createUser.mockResolvedValue({
        success: false,
        error: 'EMAIL_EXISTS',
        message: 'Email address already exists',
      })

      const response = await createUserHandler(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('EMAIL_EXISTS')
      expect(data.error.message).toBe('Email address already exists')
    })
  })

  describe('GET /api/users/[id]', () => {
    it('should get user by ID successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/user-123', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer admin-token-123',
        },
      })

      // Mock session validation
      mockAuthService.getSessionFromToken.mockResolvedValue(mockSession)
      mockAuthService.isAdmin.mockReturnValue(true)

      // Mock user service
      mockUserService.getUserById.mockResolvedValue({
        success: true,
        data: mockUser,
        message: 'User retrieved successfully',
      })

      const response = await getUserHandler(request, { params: { id: 'user-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockUser)
      expect(data.message).toBe('User retrieved successfully')

      expect(mockAuthService.getSessionFromToken).toHaveBeenCalledWith('admin-token-123')
      expect(mockAuthService.isAdmin).toHaveBeenCalledWith('admin')
      expect(mockUserService.getUserById).toHaveBeenCalledWith('user-123')
    })

    it('should return 404 for user not found', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/nonexistent-user', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer admin-token-123',
        },
      })

      // Mock session validation
      mockAuthService.getSessionFromToken.mockResolvedValue(mockSession)
      mockAuthService.isAdmin.mockReturnValue(true)

      // Mock user service
      mockUserService.getUserById.mockResolvedValue({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found',
      })

      const response = await getUserHandler(request, { params: { id: 'nonexistent-user' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('USER_NOT_FOUND')
      expect(data.error.message).toBe('User not found')
    })
  })

  describe('PUT /api/users/[id]', () => {
    it('should update user successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/user-123', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer admin-token-123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'John Updated',
          lastName: 'Doe Updated',
        }),
      })

      // Mock session validation
      mockAuthService.getSessionFromToken.mockResolvedValue(mockSession)
      mockAuthService.isAdmin.mockReturnValue(true)

      // Mock validation
      mockValidation.validateRequestBody.mockResolvedValue({
        success: true,
        data: {
          firstName: 'John Updated',
          lastName: 'Doe Updated',
        },
      })

      // Mock user update
      const updatedUser = {
        ...mockUser,
        firstName: 'John Updated',
        lastName: 'Doe Updated',
        updatedAt: new Date('2023-01-02T00:00:00Z'),
      }
      mockUserService.updateUser.mockResolvedValue({
        success: true,
        data: updatedUser,
        message: 'User updated successfully',
      })

      const response = await updateUserHandler(request, { params: { id: 'user-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(updatedUser)
      expect(data.message).toBe('User updated successfully')

      expect(mockUserService.updateUser).toHaveBeenCalledWith('user-123', {
        firstName: 'John Updated',
        lastName: 'Doe Updated',
      })
    })
  })

  describe('DELETE /api/users/[id]', () => {
    it('should deactivate user successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/user-123', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer admin-token-123',
        },
      })

      // Mock session validation
      mockAuthService.getSessionFromToken.mockResolvedValue(mockSession)
      mockAuthService.isAdmin.mockReturnValue(true)

      // Mock user deactivation
      mockUserService.deactivateUser.mockResolvedValue({
        success: true,
        message: 'User deactivated successfully',
      })

      const response = await deleteUserHandler(request, { params: { id: 'user-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('User deactivated successfully')

      expect(mockUserService.deactivateUser).toHaveBeenCalledWith('user-123')
    })
  })

  describe('POST /api/users/[id]/reactivate', () => {
    it('should reactivate user successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/user-123/reactivate', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer admin-token-123',
        },
      })

      // Mock session validation
      mockAuthService.getSessionFromToken.mockResolvedValue(mockSession)
      mockAuthService.isAdmin.mockReturnValue(true)

      // Mock user reactivation
      mockUserService.reactivateUser.mockResolvedValue({
        success: true,
        message: 'User reactivated successfully',
      })

      const response = await reactivateUserHandler(request, { params: { id: 'user-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('User reactivated successfully')

      expect(mockUserService.reactivateUser).toHaveBeenCalledWith('user-123')
    })
  })

  describe('POST /api/users/[id]/resend-verification', () => {
    it('should resend verification email successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/user-123/resend-verification', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer admin-token-123',
        },
      })

      // Mock session validation
      mockAuthService.getSessionFromToken.mockResolvedValue(mockSession)
      mockAuthService.isAdmin.mockReturnValue(true)

      // Mock email service
      mockEmailServices.resendVerificationEmail.mockResolvedValue({
        success: true,
        message: 'Verification email sent',
      })

      const response = await resendVerificationHandler(request, { params: { id: 'user-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Verification email sent')

      expect(mockEmailServices.resendVerificationEmail).toHaveBeenCalledWith('user-123')
    })
  })

  describe('POST /api/users/[id]/reset-password', () => {
    it('should reset user password successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/user-123/reset-password', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer admin-token-123',
        },
      })

      // Mock session validation
      mockAuthService.getSessionFromToken.mockResolvedValue(mockSession)
      mockAuthService.isAdmin.mockReturnValue(true)

      // Mock password reset service
      mockEmailServices.adminResetPassword.mockResolvedValue({
        success: true,
        message: 'Password reset successfully',
        temporaryPassword: 'tempPassword123',
      })

      const response = await resetPasswordHandler(request, { params: { id: 'user-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Password reset successfully')
      expect(data.temporaryPassword).toBe('tempPassword123')

      expect(mockEmailServices.adminResetPassword).toHaveBeenCalledWith('user-123')
    })
  })
})
