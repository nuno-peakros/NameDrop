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
 * Integration tests for User Authentication Flow
 * 
 * These tests verify the complete authentication flow including:
 * - User registration by admin
 * - Email verification
 * - User login
 * - Password management
 * - Session handling
 */

describe('User Authentication Flow Integration', () => {
  let testUser: User
  let testAdmin: User
  let temporaryPassword: string
  
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

    // Create test user (inactive, unverified)
    const userHashedPassword = await bcrypt.hash('userPassword123', 12)
    testUser = await db.user.create({
      data: {
        firstName: 'Test',
        lastName: 'User',
        email: `testuser-${timestamp}@example.com`,
        passwordHash: userHashedPassword,
        role: UserRole.user,
        isActive: true,
        emailVerified: false,
      },
    })

    // Generate temporary password for testing
    temporaryPassword = 'tempPassword123'
  })

  afterEach(async () => {
    // Cleanup test data
    await db.user.deleteMany({
      where: {
        email: {
          in: ['testadmin@example.com', 'testuser@example.com', 'newuser@example.com'],
        },
      },
    })
  })

  describe('Complete Authentication Flow', () => {
    it('should complete full user registration and authentication flow', async () => {
      // Step 1: Admin creates new user
      const createUserResponse = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAdminToken()}`,
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
      expect(createUserData.data.user.emailVerified).toBe(false)
      expect(createUserData.data.temporaryPassword).toBeDefined()

      const newUserId = createUserData.data.user.id
      const tempPassword = createUserData.data.temporaryPassword

      // Step 2: User verifies email
      const verificationToken = 'test-verification-token'
      const verifyEmailResponse = await fetch(`${BASE_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: verificationToken,
        }),
      })

      expect(verifyEmailResponse.status).toBe(200)
      const verifyEmailData = await verifyEmailResponse.json()
      expect(verifyEmailData.success).toBe(true)

      // Step 3: User logs in with temporary password
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: tempPassword,
        }),
      })

      expect(loginResponse.status).toBe(200)
      const loginData = await loginResponse.json()
      expect(loginData.success).toBe(true)
      expect(loginData.data.user.email).toBe('newuser@example.com')
      expect(loginData.data.token).toBeDefined()

      const userToken = loginData.data.token

      // Step 4: User changes password
      const changePasswordResponse = await fetch(`${BASE_URL}/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          currentPassword: tempPassword,
          newPassword: 'newSecurePassword123',
        }),
      })

      expect(changePasswordResponse.status).toBe(200)
      const changePasswordData = await changePasswordResponse.json()
      expect(changePasswordData.success).toBe(true)

      // Step 5: User logs in with new password
      const newLoginResponse = await fetch(`${BASE_URL}/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'newSecurePassword123',
        }),
      })

      expect(newLoginResponse.status).toBe(200)
      const newLoginData = await newLoginResponse.json()
      expect(newLoginData.success).toBe(true)

      // Step 6: User logs out
      const logoutResponse = await fetch(`${BASE_URL}/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      })

      expect(logoutResponse.status).toBe(200)
      const logoutData = await logoutResponse.json()
      expect(logoutData.success).toBe(true)
    })

    it('should handle password reset flow', async () => {
      // Step 1: User requests password reset
      const forgotPasswordResponse = await fetch(`${BASE_URL}/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'testuser@example.com',
        }),
      })

      expect(forgotPasswordResponse.status).toBe(200)
      const forgotPasswordData = await forgotPasswordResponse.json()
      expect(forgotPasswordData.success).toBe(true)

      // Step 2: User resets password with token
      const resetToken = 'test-reset-token'
      const resetPasswordResponse = await fetch(`${BASE_URL}/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'newResetPassword123',
        }),
      })

      expect(resetPasswordResponse.status).toBe(200)
      const resetPasswordData = await resetPasswordResponse.json()
      expect(resetPasswordData.success).toBe(true)

      // Step 3: User logs in with new password
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'testuser@example.com',
          password: 'newResetPassword123',
        }),
      })

      expect(loginResponse.status).toBe(200)
      const loginData = await loginResponse.json()
      expect(loginData.success).toBe(true)
    })
  })

  describe('Authentication Error Scenarios', () => {
    it('should reject login for inactive user', async () => {
      // Deactivate user
      await db.user.update({
        where: { id: testUser.id },
        data: { isActive: false },
      })

      const loginResponse = await fetch(`${BASE_URL}/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'testuser@example.com',
          password: 'userPassword123',
        }),
      })

      expect(loginResponse.status).toBe(401)
      const loginData = await loginResponse.json()
      expect(loginData.success).toBe(false)
      expect(loginData.error.code).toBe('ACCOUNT_INACTIVE')
    })

    it('should reject login for unverified email', async () => {
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'testuser@example.com',
          password: 'userPassword123',
        }),
      })

      expect(loginResponse.status).toBe(401)
      const loginData = await loginResponse.json()
      expect(loginData.success).toBe(false)
      expect(loginData.error.code).toBe('EMAIL_NOT_VERIFIED')
    })

    it('should reject login with invalid credentials', async () => {
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'testuser@example.com',
          password: 'wrongPassword',
        }),
      })

      expect(loginResponse.status).toBe(401)
      const loginData = await loginResponse.json()
      expect(loginData.success).toBe(false)
      expect(loginData.error.code).toBe('INVALID_CREDENTIALS')
    })

    it('should reject password change with wrong current password', async () => {
      const userToken = await getUserToken()

      const changePasswordResponse = await fetch(`${BASE_URL}/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          currentPassword: 'wrongPassword',
          newPassword: 'newPassword123',
        }),
      })

      expect(changePasswordResponse.status).toBe(400)
      const changePasswordData = await changePasswordResponse.json()
      expect(changePasswordData.success).toBe(false)
    })
  })

  describe('Session Management', () => {
    it('should maintain session across requests', async () => {
      const userToken = await getUserToken()

      // Make authenticated request
      const profileResponse = await fetch(`${BASE_URL}/api/users/me', {
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      })

      expect(profileResponse.status).toBe(200)
      const profileData = await profileResponse.json()
      expect(profileData.success).toBe(true)
      expect(profileData.data.user.email).toBe('testuser@example.com')
    })

    it('should invalidate session on logout', async () => {
      const userToken = await getUserToken()

      // Logout
      const logoutResponse = await fetch(`${BASE_URL}/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      })

      expect(logoutResponse.status).toBe(200)

      // Try to use token after logout
      const profileResponse = await fetch(`${BASE_URL}/api/users/me', {
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      })

      expect(profileResponse.status).toBe(401)
    })
  })

  // Helper functions for testing
  async function getAdminToken(): Promise<string> {
    const response = await fetch(`${BASE_URL}/api/auth/login', {
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
    // First verify the user's email
    await db.user.update({
      where: { id: testUser.id },
      data: { emailVerified: true },
    })

    const response = await fetch(`${BASE_URL}/api/auth/login', {
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
