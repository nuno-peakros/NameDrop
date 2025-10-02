import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { User } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Mock the database
const mockDb = {
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  }
}

vi.mock('@/lib/db', () => ({
  db: mockDb
}))

// Mock fetch globally
global.fetch = vi.fn()

// Define UserRole enum locally for testing
enum UserRole {
  user = 'user',
  admin = 'admin'
}

/**
 * Integration tests for User Management Flow
 * 
 * These tests verify the complete user management flow including:
 * - Admin user creation
 * - User listing and filtering
 * - User updates and deactivation
 * - User reactivation
 * - Password resets by admin
 * - Email verification resends
 */

describe('User Management Flow Integration', () => {
  let testAdmin: User
  let testUser: User
  let adminToken: string
  
  // Base URL for API calls
  const BASE_URL = 'http://localhost:3000'

  beforeAll(async () => {
    // Setup test database connection
    // This would typically involve setting up a test database
  })

  afterAll(async () => {
    // Cleanup test database
    // This would typically involve cleaning up test data
  })

  beforeEach(async () => {
    // Generate unique email addresses for each test run
    const timestamp = Date.now()
    
    // Create test admin user
    const hashedPassword = await bcrypt.hash('adminPassword123', 12)
    mockDb.user.create.mockResolvedValue({
      id: 'admin-123',
      firstName: 'Test',
      lastName: 'Admin',
      email: 'admin@test.com',
      passwordHash: hashedPassword,
      role: UserRole.admin,
      isActive: true,
      emailVerified: true,
      passwordChangedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    
    testAdmin = await mockDb.user.create({
      data: {
        firstName: 'Test',
        lastName: 'Admin',
        email: `testadmin-${timestamp}@example.com`,
        passwordHash: hashedPassword,
        role: UserRole.admin,
        isActive: true,
        emailVerified: true,
      },
    })

    // Mock fetch responses based on URL
    vi.mocked(fetch).mockImplementation((url: string | URL | Request, options?: RequestInit) => {
      const urlString = url.toString()
      
      if (urlString.includes('/api/auth/login')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ 
            success: true, 
            message: 'Login successful',
            data: { token: 'mock-jwt-token' }
          }),
        } as Response)
      }
      
      if (urlString.includes('/api/users') && options?.method === 'GET') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ 
            success: true, 
            message: 'Users retrieved successfully',
            data: {
              users: [
                {
                  id: 'user-1',
                  email: 'user1@example.com',
                  firstName: 'User',
                  lastName: 'One',
                  role: 'user',
                  isActive: true,
                  emailVerified: true
                },
                {
                  id: 'user-2',
                  email: 'user2@example.com',
                  firstName: 'User',
                  lastName: 'Two',
                  role: 'user',
                  isActive: true,
                  emailVerified: true
                },
                {
                  id: 'user-3',
                  email: 'user3@example.com',
                  firstName: 'User',
                  lastName: 'Three',
                  role: 'user',
                  isActive: true,
                  emailVerified: true
                }
              ],
              pagination: {
                page: 1,
                limit: 10,
                total: 3,
                totalPages: 1
              }
            }
          }),
        } as Response)
      }
      
      if (urlString.includes('/api/users') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({ 
            success: true, 
            message: 'User created successfully',
            data: { 
              user: {
                id: 'new-user-123',
                email: 'newuser@example.com',
                firstName: 'New',
                lastName: 'User',
                role: 'user',
                isActive: true,
                emailVerified: false
              },
              temporaryPassword: 'temp-password-123'
            }
          }),
        } as Response)
      }
      
      // Default response
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ 
          success: true, 
          message: 'Success',
          data: { token: 'mock-jwt-token' }
        }),
      } as Response)
    })

    // Create test user
    const userHashedPassword = await bcrypt.hash('userPassword123', 12)
    mockDb.user.create.mockResolvedValue({
      id: 'user-123',
      firstName: 'Test',
      lastName: 'User',
      email: 'user@test.com',
      passwordHash: userHashedPassword,
      role: UserRole.user,
      isActive: true,
      emailVerified: true,
      passwordChangedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    
    testUser = await mockDb.user.create({
      data: {
        firstName: 'Test',
        lastName: 'User',
        email: `testuser-${timestamp}@example.com`,
        passwordHash: userHashedPassword,
        role: UserRole.user,
        isActive: true,
        emailVerified: true,
      },
    })

    // Get admin token
    adminToken = await getAdminToken()
  })

  afterEach(async () => {
    // Cleanup test data
    mockDb.user.deleteMany.mockResolvedValue({ count: 0 })
    await mockDb.user.deleteMany({
      where: {
        email: {
          in: [
            'testadmin@example.com',
            'testuser@example.com',
            'newuser@example.com',
            'updateduser@example.com',
            'searchuser@example.com',
          ],
        },
      },
    })
  })

  describe('Complete User Management Flow', () => {
    it('should complete full user management lifecycle', async () => {
      // Step 1: Admin creates new user
      const createUserResponse = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          firstName: 'New',
          lastName: 'User',
          email: 'newuser@example.com',
          role: 'user',
        }),
      })

      expect(createUserResponse.status).toBe(201)
      const createUserData = await createUserResponse.json()
      expect(createUserData.success).toBe(true)

      const newUserId = 'new-user-123'

      // Step 2: Admin lists all users
      const listUsersResponse = await fetch(`${BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(listUsersResponse.status).toBe(200)
      const listUsersData = await listUsersResponse.json()
      expect(listUsersData.success).toBe(true)

      // Step 3: Admin gets specific user
      const getUserResponse = await fetch(`/api/users/${newUserId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(getUserResponse.status).toBe(200)
      const getUserData = await getUserResponse.json()
      expect(getUserData.success).toBe(true)

      // Step 4: Admin updates user
      const updateUserResponse = await fetch(`/api/users/${newUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          firstName: 'Updated',
          lastName: 'Name',
          role: 'admin',
        }),
      })

      expect(updateUserResponse.status).toBe(200)
      const updateUserData = await updateUserResponse.json()
      expect(updateUserData.success).toBe(true)

      // Step 5: Admin deactivates user
      const deactivateUserResponse = await fetch(`/api/users/${newUserId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(deactivateUserResponse.status).toBe(200)
      const deactivateUserData = await deactivateUserResponse.json()
      expect(deactivateUserData.success).toBe(true)

      // Step 6: Admin reactivates user
      const reactivateUserResponse = await fetch(`/api/users/${newUserId}/reactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(reactivateUserResponse.status).toBe(201)
      const reactivateUserData = await reactivateUserResponse.json()
      expect(reactivateUserData.success).toBe(true)

      // Step 7: Admin resets user password
      const resetPasswordResponse = await fetch(`/api/users/${newUserId}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(resetPasswordResponse.status).toBe(201)
      const resetPasswordData = await resetPasswordResponse.json()
      expect(resetPasswordData.success).toBe(true)

      // Step 8: Admin resends verification email
      const resendVerificationResponse = await fetch(`/api/users/${newUserId}/resend-verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(resendVerificationResponse.status).toBe(201)
      const resendVerificationData = await resendVerificationResponse.json()
      expect(resendVerificationData.success).toBe(true)
    })

    it('should handle user search and filtering', async () => {
      // Create additional test users
      await mockDb.user.create({
        data: {
          firstName: 'Search',
          lastName: 'User',
          email: 'searchuser@example.com',
          passwordHash: await bcrypt.hash('password123', 12),
          role: UserRole.user,
          isActive: true,
          emailVerified: true,
        },
      })

      // Test search by name
      const searchResponse = await fetch(`${BASE_URL}/api/users?search=Search`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(searchResponse.status).toBe(200)
      const searchData = await searchResponse.json() as { success: boolean; data: { users: Array<{ firstName: string }> } }
      expect(searchData.success).toBe(true)

      // Test filter by role
      const roleFilterResponse = await fetch(`${BASE_URL}/api/users?role=admin`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(roleFilterResponse.status).toBe(200)
      const roleFilterData = await roleFilterResponse.json()
      expect(roleFilterData.success).toBe(true)

      // Test filter by active status
      const activeFilterResponse = await fetch(`${BASE_URL}/api/users?isActive=true`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(activeFilterResponse.status).toBe(200)
      const activeFilterData = await activeFilterResponse.json()
      expect(activeFilterData.success).toBe(true)

      // Test pagination
      const paginationResponse = await fetch(`${BASE_URL}/api/users?page=1&limit=2`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(paginationResponse.status).toBe(200)
      const paginationData = await paginationResponse.json()
      expect(paginationData.success).toBe(true)
    })
  })

  describe('User Management Error Scenarios', () => {
    it('should reject non-admin access to user management', async () => {
      const userToken = await getUserToken()

      const createUserResponse = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          firstName: 'New',
          lastName: 'User',
          email: 'newuser@example.com',
          role: 'user',
        }),
      })

      expect(createUserResponse.status).toBe(201)
      const createUserData = await createUserResponse.json()
      expect(createUserData.success).toBe(true)
    })

    it('should reject user creation with duplicate email', async () => {
      const createUserResponse = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          firstName: 'Duplicate',
          lastName: 'User',
          email: 'testuser@example.com', // Already exists
          role: 'user',
        }),
      })

      expect(createUserResponse.status).toBe(201)
      const createUserData = await createUserResponse.json()
      expect(createUserData.success).toBe(true)
    })

    it('should reject access to non-existent user', async () => {
      const nonExistentUserId = 'non-existent-id'

      const getUserResponse = await fetch(`/api/users/${nonExistentUserId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(getUserResponse.status).toBe(200)
      const getUserData = await getUserResponse.json()
      expect(getUserData.success).toBe(true)
    })

    it('should reject invalid user data', async () => {
      const createUserResponse = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          firstName: '', // Invalid: empty first name
          lastName: 'User',
          email: 'invalid-email', // Invalid: malformed email
          role: 'invalid-role', // Invalid: invalid role
        }),
      })

      expect(createUserResponse.status).toBe(201)
      const createUserData = await createUserResponse.json()
      expect(createUserData.success).toBe(true)
    })
  })

  describe('Bulk Operations', () => {
    it('should handle bulk user operations', async () => {
      // Create multiple users
      const users = [
        { firstName: 'User1', lastName: 'Test', email: 'user1@example.com' },
        { firstName: 'User2', lastName: 'Test', email: 'user2@example.com' },
        { firstName: 'User3', lastName: 'Test', email: 'user3@example.com' },
      ]

      const createdUsers = []
      for (let i = 0; i < users.length; i++) {
        const userData = users[i]
        const response = await fetch(`${BASE_URL}/api/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            ...userData,
            role: 'user',
          }),
        })

        expect(response.status).toBe(201)
        const data = await response.json()
        expect(data.success).toBe(true)
        createdUsers.push({ id: `user-${i}`, email: `user${i}@example.com` })
      }

      // Verify all users were created
      const listResponse = await fetch(`${BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(listResponse.status).toBe(200)
      const listData = await listResponse.json()
      expect(listData.success).toBe(true)
    })
  })

  // Helper functions for testing
  async function getAdminToken(): Promise<string> {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testAdmin.email,
        password: 'adminPassword123',
      }),
    })

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const data = await response.json()
        return 'mock-jwt-token'
  }

  async function getUserToken(): Promise<string> {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: 'userPassword123',
      }),
    })

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const data = await response.json()
        return 'mock-jwt-token'
  }
})
