import { db } from '@/lib/db'
import { hashPassword, generateSecurePassword } from '@/lib/auth-utils'
import { emailTemplates } from '@/lib/email'
import { Prisma, $Enums } from '@prisma/client'

type User = Prisma.UserGetPayload<Record<string, never>>
type UserRole = $Enums.UserRole

/**
 * User service for user management operations
 * 
 * This service handles:
 * - User CRUD operations
 * - User creation with temporary passwords
 * - User search and filtering
 * - User status management
 * - User validation
 */

/**
 * User creation data
 */
export interface CreateUserData {
  firstName: string
  lastName: string
  email: string
  role: UserRole
}

/**
 * User update data
 */
export interface UpdateUserData {
  firstName?: string
  lastName?: string
  email?: string
  role?: UserRole
  isActive?: boolean
}

/**
 * User search filters
 */
export interface UserSearchFilters {
  search?: string
  role?: UserRole
  isActive?: boolean
  emailVerified?: boolean
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number
  limit: number
}

/**
 * Paginated user result
 */
export interface PaginatedUsers {
  users: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role' | 'isActive' | 'emailVerified' | 'createdAt' | 'updatedAt'>[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * User service result
 */
export interface UserServiceResult<T = unknown> {
  success: boolean
  data?: T
  message: string
  error?: string
}

/**
 * Create a new user with temporary password
 * 
 * @param userData - User creation data
 * @returns Promise resolving to user service result with user data and temporary password
 * 
 * @example
 * ```typescript
 * const result = await createUser({
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   email: 'john@example.com',
 *   role: 'user'
 * });
 * 
 * if (result.success) {
 *   console.log('User created:', result.data?.user);
 *   console.log('Temporary password:', result.data?.temporaryPassword);
 * }
 * ```
 */
export async function createUser(userData: CreateUserData): Promise<UserServiceResult<{
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role' | 'isActive' | 'emailVerified' | 'createdAt'>
  temporaryPassword: string
}>> {
  try {
    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: userData.email },
    })

    if (existingUser) {
      return {
        success: false,
        message: 'Email address already exists',
        error: 'EMAIL_EXISTS',
      }
    }

    // Generate temporary password
    const temporaryPassword = generateSecurePassword(12, true)
    const hashedPassword = await hashPassword(temporaryPassword)

    // Create user
    const user = await db.user.create({
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        passwordHash: hashedPassword,
        role: userData.role,
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

    // Send temporary password email
    await emailTemplates.sendTemporaryPasswordEmail(
      user.email,
      temporaryPassword,
      user.firstName
    )

    return {
      success: true,
      data: {
        user,
        temporaryPassword,
      },
      message: 'User created successfully',
    }
  } catch (error) {
    console.error('Create user error:', error)
    return {
      success: false,
      message: `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: 'CREATE_USER_FAILED',
    }
  }
}

/**
 * Get user by ID
 * 
 * @param userId - User ID
 * @returns Promise resolving to user service result with user data
 * 
 * @example
 * ```typescript
 * const result = await getUserById('user-id');
 * if (result.success) {
 *   console.log('User:', result.data);
 * }
 * ```
 */
export async function getUserById(userId: string): Promise<UserServiceResult<Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role' | 'isActive' | 'emailVerified' | 'passwordChangedAt' | 'createdAt' | 'updatedAt'>>> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      return {
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      }
    }

    return {
      success: true,
      data: user,
      message: 'User retrieved successfully',
    }
  } catch (error) {
    console.error('Get user by ID error:', error)
    return {
      success: false,
      message: `Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: 'GET_USER_FAILED',
    }
  }
}

/**
 * Get user by email
 * 
 * @param email - User email
 * @returns Promise resolving to user service result with user data
 * 
 * @example
 * ```typescript
 * const result = await getUserByEmail('user@example.com');
 * if (result.success) {
 *   console.log('User:', result.data);
 * }
 * ```
 */
export async function getUserByEmail(email: string): Promise<UserServiceResult<Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role' | 'isActive' | 'emailVerified' | 'passwordChangedAt' | 'createdAt' | 'updatedAt'>>> {
  try {
    const user = await db.user.findUnique({
      where: { email },
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

    if (!user) {
      return {
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      }
    }

    return {
      success: true,
      data: user,
      message: 'User retrieved successfully',
    }
  } catch (error) {
    console.error('Get user by email error:', error)
    return {
      success: false,
      message: `Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: 'GET_USER_FAILED',
    }
  }
}

/**
 * Update user information
 * 
 * @param userId - User ID
 * @param updateData - User update data
 * @returns Promise resolving to user service result with updated user data
 * 
 * @example
 * ```typescript
 * const result = await updateUser('user-id', {
 *   firstName: 'Jane',
 *   lastName: 'Smith'
 * });
 * 
 * if (result.success) {
 *   console.log('User updated:', result.data);
 * }
 * ```
 */
export async function updateUser(userId: string, updateData: UpdateUserData): Promise<UserServiceResult<Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role' | 'isActive' | 'emailVerified' | 'updatedAt'>>> {
  try {
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return {
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      }
    }

    // Check if email is being changed and if it already exists
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email: updateData.email },
      })

      if (emailExists) {
        return {
          success: false,
          message: 'Email address already exists',
          error: 'EMAIL_EXISTS',
        }
      }
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: userId },
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

    return {
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    }
  } catch (error) {
    console.error('Update user error:', error)
    return {
      success: false,
      message: `Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: 'UPDATE_USER_FAILED',
    }
  }
}

/**
 * Deactivate user account (soft delete)
 * 
 * @param userId - User ID
 * @returns Promise resolving to user service result
 * 
 * @example
 * ```typescript
 * const result = await deactivateUser('user-id');
 * if (result.success) {
 *   console.log('User deactivated');
 * }
 * ```
 */
export async function deactivateUser(userId: string): Promise<UserServiceResult> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return {
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      }
    }

    if (!user.isActive) {
      return {
        success: false,
        message: 'User is already deactivated',
        error: 'USER_ALREADY_DEACTIVATED',
      }
    }

    await db.user.update({
      where: { id: userId },
      data: { isActive: false },
    })

    return {
      success: true,
      message: 'User deactivated successfully',
    }
  } catch (error) {
    console.error('Deactivate user error:', error)
    return {
      success: false,
      message: `Failed to deactivate user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: 'DEACTIVATE_USER_FAILED',
    }
  }
}

/**
 * Reactivate user account
 * 
 * @param userId - User ID
 * @returns Promise resolving to user service result
 * 
 * @example
 * ```typescript
 * const result = await reactivateUser('user-id');
 * if (result.success) {
 *   console.log('User reactivated');
 * }
 * ```
 */
export async function reactivateUser(userId: string): Promise<UserServiceResult> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return {
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      }
    }

    if (user.isActive) {
      return {
        success: false,
        message: 'User is already active',
        error: 'USER_ALREADY_ACTIVE',
      }
    }

    await db.user.update({
      where: { id: userId },
      data: { isActive: true },
    })

    return {
      success: true,
      message: 'User reactivated successfully',
    }
  } catch (error) {
    console.error('Reactivate user error:', error)
    return {
      success: false,
      message: `Failed to reactivate user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: 'REACTIVATE_USER_FAILED',
    }
  }
}

/**
 * Search and filter users with pagination
 * 
 * @param filters - Search and filter criteria
 * @param pagination - Pagination parameters
 * @returns Promise resolving to paginated user result
 * 
 * @example
 * ```typescript
 * const result = await searchUsers(
 *   { search: 'john', role: 'user' },
 *   { page: 1, limit: 20 }
 * );
 * 
 * if (result.success) {
 *   console.log('Users:', result.data?.users);
 *   console.log('Pagination:', result.data?.pagination);
 * }
 * ```
 */
export async function searchUsers(filters: UserSearchFilters, pagination: PaginationParams): Promise<UserServiceResult<PaginatedUsers>> {
  try {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.role) {
      where.role = filters.role
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters.emailVerified !== undefined) {
      where.emailVerified = filters.emailVerified
    }

    // Get total count
    const total = await db.user.count({ where })

    // Get users
    const users = await db.user.findMany({
      where,
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
      skip,
      take: limit,
    })

    const totalPages = Math.ceil(total / limit)

    return {
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      message: 'Users retrieved successfully',
    }
  } catch (error) {
    console.error('Search users error:', error)
    return {
      success: false,
      message: `Failed to search users: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: 'SEARCH_USERS_FAILED',
    }
  }
}

/**
 * Get all users (admin only)
 * 
 * @param pagination - Pagination parameters
 * @returns Promise resolving to paginated user result
 * 
 * @example
 * ```typescript
 * const result = await getAllUsers({ page: 1, limit: 20 });
 * if (result.success) {
 *   console.log('All users:', result.data?.users);
 * }
 * ```
 */
export async function getAllUsers(pagination: PaginationParams): Promise<UserServiceResult<PaginatedUsers>> {
  return searchUsers({}, pagination)
}

/**
 * Check if user exists by email
 * 
 * @param email - Email address to check
 * @returns Promise resolving to boolean
 * 
 * @example
 * ```typescript
 * const exists = await userExists('user@example.com');
 * console.log('User exists:', exists);
 * ```
 */
export async function userExists(email: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    })

    return !!user
  } catch (error) {
    console.error('Check user exists error:', error)
    return false
  }
}

/**
 * Get user statistics
 * 
 * @returns Promise resolving to user statistics
 * 
 * @example
 * ```typescript
 * const stats = await getUserStats();
 * console.log('Total users:', stats.totalUsers);
 * console.log('Active users:', stats.activeUsers);
 * ```
 */
export async function getUserStats(): Promise<{
  totalUsers: number
  activeUsers: number
  verifiedUsers: number
  adminUsers: number
}> {
  try {
    const [totalUsers, activeUsers, verifiedUsers, adminUsers] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      db.user.count({ where: { emailVerified: true } }),
      db.user.count({ where: { role: 'admin' } }),
    ])

    return {
      totalUsers,
      activeUsers,
      verifiedUsers,
      adminUsers,
    }
  } catch (error) {
    console.error('Get user stats error:', error)
    return {
      totalUsers: 0,
      activeUsers: 0,
      verifiedUsers: 0,
      adminUsers: 0,
    }
  }
}
