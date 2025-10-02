import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { User } from '@prisma/client'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

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
    testAdmin = await db.user.create({
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

    // Create test user
    const userHashedPassword = await bcrypt.hash('userPassword123', 12)
    testUser = await db.user.create({
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
    await db.user.deleteMany({
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
      const createUserResponse = await fetch(`${BASE_URL}/api/users', {
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
      expect(createUserData.data.user.email).toBe('newuser@example.com')
      expect(createUserData.data.temporaryPassword).toBeDefined()

      const newUserId = createUserData.data.user.id

      // Step 2: Admin lists all users
      const listUsersResponse = await fetch(`${BASE_URL}/api/users', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(listUsersResponse.status).toBe(200)
      const listUsersData = await listUsersResponse.json()
      expect(listUsersData.success).toBe(true)
      expect(listUsersData.data.users).toHaveLength(3) // admin, test user, new user
      expect(listUsersData.data.pagination).toBeDefined()

      // Step 3: Admin gets specific user
      const getUserResponse = await fetch(`/api/users/${newUserId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(getUserResponse.status).toBe(200)
      const getUserData = await getUserResponse.json()
      expect(getUserData.success).toBe(true)
      expect(getUserData.data.user.id).toBe(newUserId)

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
      expect(updateUserData.data.user.firstName).toBe('Updated')
      expect(updateUserData.data.user.lastName).toBe('Name')
      expect(updateUserData.data.user.role).toBe('admin')

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

      expect(reactivateUserResponse.status).toBe(200)
      const reactivateUserData = await reactivateUserResponse.json()
      expect(reactivateUserData.success).toBe(true)

      // Step 7: Admin resets user password
      const resetPasswordResponse = await fetch(`/api/users/${newUserId}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(resetPasswordResponse.status).toBe(200)
      const resetPasswordData = await resetPasswordResponse.json()
      expect(resetPasswordData.success).toBe(true)
      expect(resetPasswordData.data.temporaryPassword).toBeDefined()

      // Step 8: Admin resends verification email
      const resendVerificationResponse = await fetch(`/api/users/${newUserId}/resend-verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(resendVerificationResponse.status).toBe(200)
      const resendVerificationData = await resendVerificationResponse.json()
      expect(resendVerificationData.success).toBe(true)
    })

    it('should handle user search and filtering', async () => {
      // Create additional test users
      await db.user.create({
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
      const searchResponse = await fetch(`${BASE_URL}/api/users?search=Search', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(searchResponse.status).toBe(200)
      const searchData = await searchResponse.json()
      expect(searchData.success).toBe(true)
      expect(searchData.data.users).toHaveLength(1)
      expect(searchData.data.users[0].firstName).toBe('Search')

      // Test filter by role
      const roleFilterResponse = await fetch(`${BASE_URL}/api/users?role=admin', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(roleFilterResponse.status).toBe(200)
      const roleFilterData = await roleFilterResponse.json()
      expect(roleFilterData.success).toBe(true)
      expect(roleFilterData.data.users.every((user: any) => user.role === 'admin')).toBe(true)

      // Test filter by active status
      const activeFilterResponse = await fetch(`${BASE_URL}/api/users?isActive=true', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(activeFilterResponse.status).toBe(200)
      const activeFilterData = await activeFilterResponse.json()
      expect(activeFilterData.success).toBe(true)
      expect(activeFilterData.data.users.every((user: any) => user.isActive === true)).toBe(true)

      // Test pagination
      const paginationResponse = await fetch(`${BASE_URL}/api/users?page=1&limit=2', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(paginationResponse.status).toBe(200)
      const paginationData = await paginationResponse.json()
      expect(paginationData.success).toBe(true)
      expect(paginationData.data.users).toHaveLength(2)
      expect(paginationData.data.pagination.page).toBe(1)
      expect(paginationData.data.pagination.limit).toBe(2)
    })
  })

  describe('User Management Error Scenarios', () => {
    it('should reject non-admin access to user management', async () => {
      const userToken = await getUserToken()

      const createUserResponse = await fetch(`${BASE_URL}/api/users', {
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

      expect(createUserResponse.status).toBe(403)
      const createUserData = await createUserResponse.json()
      expect(createUserData.success).toBe(false)
      expect(createUserData.error.code).toBe('INSUFFICIENT_PERMISSIONS')
    })

    it('should reject user creation with duplicate email', async () => {
      const createUserResponse = await fetch(`${BASE_URL}/api/users', {
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

      expect(createUserResponse.status).toBe(409)
      const createUserData = await createUserResponse.json()
      expect(createUserData.success).toBe(false)
      expect(createUserData.error.code).toBe('EMAIL_ALREADY_EXISTS')
    })

    it('should reject access to non-existent user', async () => {
      const nonExistentUserId = 'non-existent-id'

      const getUserResponse = await fetch(`/api/users/${nonExistentUserId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(getUserResponse.status).toBe(404)
      const getUserData = await getUserResponse.json()
      expect(getUserData.success).toBe(false)
      expect(getUserData.error.code).toBe('USER_NOT_FOUND')
    })

    it('should reject invalid user data', async () => {
      const createUserResponse = await fetch(`${BASE_URL}/api/users', {
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

      expect(createUserResponse.status).toBe(400)
      const createUserData = await createUserResponse.json()
      expect(createUserData.success).toBe(false)
      expect(createUserData.error.code).toBe('VALIDATION_ERROR')
      expect(createUserData.error.details).toBeDefined()
      expect(Array.isArray(createUserData.error.details)).toBe(true)
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
      for (const userData of users) {
        const response = await fetch(`${BASE_URL}/api/users', {
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
        createdUsers.push(data.data.user)
      }

      // Verify all users were created
      const listResponse = await fetch(`${BASE_URL}/api/users', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(listResponse.status).toBe(200)
      const listData = await listResponse.json()
      expect(listData.success).toBe(true)
      expect(listData.data.users.length).toBeGreaterThanOrEqual(3)
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

    const data = await response.json()
    return data.data.token
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

    const data = await response.json()
    return data.data.token
  }
})
