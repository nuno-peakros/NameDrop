import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

type UserRole = Prisma.UserRole
import {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  deactivateUser,
  reactivateUser,
  searchUsers,
  getAllUsers,
  userExists,
  getUserStats,
  type CreateUserData,
  type UpdateUserData,
  type UserSearchFilters,
  type PaginationParams,
} from '@/lib/user-service'
import { db } from '@/lib/db'

// Mock the database module
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}))

// Mock auth utilities
vi.mock('@/lib/auth-utils', () => ({
  hashPassword: vi.fn(),
  generateSecurePassword: vi.fn(),
}))

// Mock email templates
vi.mock('@/lib/email', () => ({
  emailTemplates: {
    sendTemporaryPasswordEmail: vi.fn(),
  },
}))

/**
 * Unit tests for user service
 * 
 * Tests cover:
 * - User CRUD operations
 * - User search and filtering
 * - User status management
 * - User validation
 * - Error handling
 */
describe('User Service', () => {
  const mockUser = {
    id: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'user' as UserRole,
    isActive: true,
    emailVerified: false,
    passwordChangedAt: null,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  }

  const mockAdminUser = {
    id: 'admin-123',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    role: 'admin' as UserRole,
    isActive: true,
    emailVerified: true,
    passwordChangedAt: new Date('2023-01-01T00:00:00Z'),
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createUser', () => {
    const createUserData: CreateUserData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'user',
    }

    it('should create user successfully', async () => {
      // Mock database responses
      vi.mocked(db).user.findUnique.mockResolvedValue(null) // No existing user
      vi.mocked(db).user.create.mockResolvedValue({
        id: 'user-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'user',
        isActive: true,
        emailVerified: false,
        createdAt: new Date('2023-01-01T00:00:00Z'),
      })

      // Mock auth utilities
      const { hashPassword, generateSecurePassword } = await import('@/lib/auth-utils')
      vi.mocked(generateSecurePassword).mockReturnValue('tempPassword123')
      vi.mocked(hashPassword).mockResolvedValue('hashedPassword')

      // Mock email templates
      const { emailTemplates } = await import('@/lib/email')
      vi.mocked(emailTemplates.sendTemporaryPasswordEmail).mockResolvedValue(undefined)

      const result = await createUser(createUserData)

      expect(result.success).toBe(true)
      expect(result.data?.user).toBeDefined()
      expect(result.data?.temporaryPassword).toBe('tempPassword123')
      expect(result.message).toBe('User created successfully')

      // Verify database calls
      expect(vi.mocked(db).user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      })
      expect(vi.mocked(db).user.create).toHaveBeenCalledWith({
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          passwordHash: 'hashedPassword',
          role: 'user',
          isActive: true,
          emailVerified: false,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
        },
      })

      // Verify email was sent
      expect(emailTemplates.sendTemporaryPasswordEmail).toHaveBeenCalledWith(
        'john@example.com',
        'tempPassword123',
        'John'
      )
    })

    it('should return error if email already exists', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue(mockUser)

      const result = await createUser(createUserData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Email address already exists')
      expect(result.error).toBe('EMAIL_EXISTS')
    })

    it('should handle database errors', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue(null)
      vi.mocked(db).user.create.mockRejectedValue(new Error('Database error'))

      const result = await createUser(createUserData)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Failed to create user')
      expect(result.error).toBe('CREATE_USER_FAILED')
    })
  })

  describe('getUserById', () => {
    it('should get user by ID successfully', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue(mockUser)

      const result = await getUserById('user-123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUser)
      expect(result.message).toBe('User retrieved successfully')

      expect(vi.mocked(db).user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isActive: true,
          emailVerified: true,
          passwordChangedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    })

    it('should return error if user not found', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue(null)

      const result = await getUserById('nonexistent-id')

      expect(result.success).toBe(false)
      expect(result.message).toBe('User not found')
      expect(result.error).toBe('USER_NOT_FOUND')
    })

    it('should handle database errors', async () => {
      vi.mocked(db).user.findUnique.mockRejectedValue(new Error('Database error'))

      const result = await getUserById('user-123')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Failed to get user')
      expect(result.error).toBe('GET_USER_FAILED')
    })
  })

  describe('getUserByEmail', () => {
    it('should get user by email successfully', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue(mockUser)

      const result = await getUserByEmail('john@example.com')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUser)
      expect(result.message).toBe('User retrieved successfully')

      expect(vi.mocked(db).user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isActive: true,
          emailVerified: true,
          passwordChangedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    })

    it('should return error if user not found', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue(null)

      const result = await getUserByEmail('nonexistent@example.com')

      expect(result.success).toBe(false)
      expect(result.message).toBe('User not found')
      expect(result.error).toBe('USER_NOT_FOUND')
    })
  })

  describe('updateUser', () => {
    const updateData: UpdateUserData = {
      firstName: 'Jane',
      lastName: 'Smith',
    }

    it('should update user successfully', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue(mockUser)
      vi.mocked(db).user.update.mockResolvedValue({
        ...mockUser,
        ...updateData,
        updatedAt: new Date('2023-01-02T00:00:00Z'),
      })

      const result = await updateUser('user-123', updateData)

      expect(result.success).toBe(true)
      expect(result.data?.firstName).toBe('Jane')
      expect(result.data?.lastName).toBe('Smith')
      expect(result.message).toBe('User updated successfully')

      expect(vi.mocked(db).user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: updateData,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isActive: true,
          emailVerified: true,
          updatedAt: true,
        },
      })
    })

    it('should return error if user not found', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue(null)

      const result = await updateUser('nonexistent-id', updateData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('User not found')
      expect(result.error).toBe('USER_NOT_FOUND')
    })

    it('should return error if email already exists', async () => {
      vi.mocked(db).user.findUnique
        .mockResolvedValueOnce(mockUser) // User exists
        .mockResolvedValueOnce(mockAdminUser) // Email exists

      const result = await updateUser('user-123', { email: 'admin@example.com' })

      expect(result.success).toBe(false)
      expect(result.message).toBe('Email address already exists')
      expect(result.error).toBe('EMAIL_EXISTS')
    })

    it('should allow updating email to same email', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue(mockUser)
      vi.mocked(db).user.update.mockResolvedValue({
        ...mockUser,
        updatedAt: new Date('2023-01-02T00:00:00Z'),
      })

      const result = await updateUser('user-123', { email: 'john@example.com' })

      expect(result.success).toBe(true)
      expect(vi.mocked(db).user.findUnique).toHaveBeenCalledTimes(1) // Only check if user exists
    })
  })

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue(mockUser)
      vi.mocked(db).user.update.mockResolvedValue({ ...mockUser, isActive: false })

      const result = await deactivateUser('user-123')

      expect(result.success).toBe(true)
      expect(result.message).toBe('User deactivated successfully')

      expect(vi.mocked(db).user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { isActive: false },
      })
    })

    it('should return error if user not found', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue(null)

      const result = await deactivateUser('nonexistent-id')

      expect(result.success).toBe(false)
      expect(result.message).toBe('User not found')
      expect(result.error).toBe('USER_NOT_FOUND')
    })

    it('should return error if user already deactivated', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue({ ...mockUser, isActive: false })

      const result = await deactivateUser('user-123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('User is already deactivated')
      expect(result.error).toBe('USER_ALREADY_DEACTIVATED')
    })
  })

  describe('reactivateUser', () => {
    it('should reactivate user successfully', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue({ ...mockUser, isActive: false })
      vi.mocked(db).user.update.mockResolvedValue({ ...mockUser, isActive: true })

      const result = await reactivateUser('user-123')

      expect(result.success).toBe(true)
      expect(result.message).toBe('User reactivated successfully')

      expect(vi.mocked(db).user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { isActive: true },
      })
    })

    it('should return error if user not found', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue(null)

      const result = await reactivateUser('nonexistent-id')

      expect(result.success).toBe(false)
      expect(result.message).toBe('User not found')
      expect(result.error).toBe('USER_NOT_FOUND')
    })

    it('should return error if user already active', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue(mockUser)

      const result = await reactivateUser('user-123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('User is already active')
      expect(result.error).toBe('USER_ALREADY_ACTIVE')
    })
  })

  describe('searchUsers', () => {
    const filters: UserSearchFilters = {
      search: 'john',
      role: 'user',
      isActive: true,
    }

    const pagination: PaginationParams = {
      page: 1,
      limit: 20,
    }

    it('should search users successfully', async () => {
      vi.mocked(db).user.count.mockResolvedValue(1)
      vi.mocked(db).user.findMany.mockResolvedValue([mockUser])

      const result = await searchUsers(filters, pagination)

      expect(result.success).toBe(true)
      expect(result.data?.users).toEqual([mockUser])
      expect(result.data?.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      })

      expect(vi.mocked(db).user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { firstName: { contains: 'john', mode: 'insensitive' } },
            { lastName: { contains: 'john', mode: 'insensitive' } },
            { email: { contains: 'john', mode: 'insensitive' } },
          ],
          role: 'user',
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      })
    })

    it('should handle empty search results', async () => {
      vi.mocked(db).user.count.mockResolvedValue(0)
      vi.mocked(db).user.findMany.mockResolvedValue([])

      const result = await searchUsers(filters, pagination)

      expect(result.success).toBe(true)
      expect(result.data?.users).toEqual([])
      expect(result.data?.pagination.total).toBe(0)
    })

    it('should handle pagination correctly', async () => {
      vi.mocked(db).user.count.mockResolvedValue(50)
      vi.mocked(db).user.findMany.mockResolvedValue([])

      const result = await searchUsers({}, { page: 2, limit: 10 })

      expect(result.data?.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 50,
        totalPages: 5,
        hasNext: true,
        hasPrev: true,
      })

      expect(vi.mocked(db).user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page - 1) * limit
          take: 10,
        })
      )
    })

    it('should handle database errors', async () => {
      vi.mocked(db).user.count.mockRejectedValue(new Error('Database error'))

      const result = await searchUsers(filters, pagination)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Failed to search users')
      expect(result.error).toBe('SEARCH_USERS_FAILED')
    })
  })

  describe('getAllUsers', () => {
    it('should get all users', async () => {
      vi.mocked(db).user.count.mockResolvedValue(2)
      vi.mocked(db).user.findMany.mockResolvedValue([mockUser, mockAdminUser])

      const result = await getAllUsers({ page: 1, limit: 20 })

      expect(result.success).toBe(true)
      expect(result.data?.users).toHaveLength(2)
      expect(vi.mocked(db).user.findMany).toHaveBeenCalledWith({
        where: {},
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      })
    })
  })

  describe('userExists', () => {
    it('should return true if user exists', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue({ id: 'user-123' })

      const result = await userExists('john@example.com')

      expect(result).toBe(true)
      expect(vi.mocked(db).user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
        select: { id: true },
      })
    })

    it('should return false if user does not exist', async () => {
      vi.mocked(db).user.findUnique.mockResolvedValue(null)

      const result = await userExists('nonexistent@example.com')

      expect(result).toBe(false)
    })

    it('should return false on database error', async () => {
      vi.mocked(db).user.findUnique.mockRejectedValue(new Error('Database error'))

      const result = await userExists('john@example.com')

      expect(result).toBe(false)
    })
  })

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      vi.mocked(db).user.count
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(80)  // activeUsers
        .mockResolvedValueOnce(70)  // verifiedUsers
        .mockResolvedValueOnce(5)   // adminUsers

      const result = await getUserStats()

      expect(result).toEqual({
        totalUsers: 100,
        activeUsers: 80,
        verifiedUsers: 70,
        adminUsers: 5,
      })

      expect(vi.mocked(db).user.count).toHaveBeenCalledTimes(4)
      expect(vi.mocked(db).user.count).toHaveBeenCalledWith()
      expect(vi.mocked(db).user.count).toHaveBeenCalledWith({ where: { isActive: true } })
      expect(vi.mocked(db).user.count).toHaveBeenCalledWith({ where: { emailVerified: true } })
      expect(vi.mocked(db).user.count).toHaveBeenCalledWith({ where: { role: 'admin' } })
    })

    it('should return zero stats on database error', async () => {
      vi.mocked(db).user.count.mockRejectedValue(new Error('Database error'))

      const result = await getUserStats()

      expect(result).toEqual({
        totalUsers: 0,
        activeUsers: 0,
        verifiedUsers: 0,
        adminUsers: 0,
      })
    })
  })
})
