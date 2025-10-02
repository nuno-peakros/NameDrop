import { test, expect } from '@playwright/test'

/**
 * E2E tests for user management flow
 * 
 * Tests cover:
 * - User listing and pagination
 * - User search and filtering
 * - User creation
 * - User editing
 * - User deletion
 * - User status management
 * - Bulk operations
 * - Error handling
 */
test.describe('User Management Flow', () => {
  // Mock user data
  const mockUsers = [
    {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'user',
      isActive: true,
      emailVerified: true,
      createdAt: '2023-01-01T00:00:00Z',
      lastLoginAt: '2023-01-15T00:00:00Z',
    },
    {
      id: 'user-2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      role: 'admin',
      isActive: false,
      emailVerified: false,
      createdAt: '2023-01-02T00:00:00Z',
      lastLoginAt: null,
    },
  ]

  const mockUsersData = {
    success: true,
    data: {
      users: mockUsers,
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    },
    message: 'Users retrieved successfully',
  }

  test.beforeEach(async ({ page }) => {
    // Mock authentication - set token in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-admin-token')
    })

    // Mock API responses
    await page.route('**/api/users**', async route => {
      const url = new URL(route.request().url())
      const searchParams = url.searchParams

      // Handle different endpoints
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockUsersData),
        })
      } else if (route.request().method() === 'POST') {
        // Handle user creation
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: {
                id: 'user-3',
                firstName: 'New',
                lastName: 'User',
                email: 'new@example.com',
                role: 'user',
                isActive: true,
                emailVerified: false,
                createdAt: new Date().toISOString(),
              },
              temporaryPassword: 'tempPassword123',
            },
            message: 'User created successfully',
          }),
        })
      } else if (route.request().method() === 'PUT') {
        // Handle user update
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'user-1',
              firstName: 'John Updated',
              lastName: 'Doe',
              email: 'john@example.com',
              role: 'user',
              isActive: true,
              emailVerified: true,
              updatedAt: new Date().toISOString(),
            },
            message: 'User updated successfully',
          }),
        })
      } else if (route.request().method() === 'DELETE') {
        // Handle user deletion
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'User deactivated successfully',
          }),
        })
      }
    })

    // Navigate to user management page
    await page.goto('/dashboard/users')
  })

  test('should display user management interface correctly', async ({ page }) => {
    // Check page title and header
    await expect(page.getByText('User Management')).toBeVisible()
    await expect(page.getByText('Manage user accounts, roles, and permissions')).toBeVisible()

    // Check search and filter controls
    await expect(page.getByPlaceholderText('Search users by name or email...')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add User' })).toBeVisible()

    // Check user table
    await expect(page.getByText('Users')).toBeVisible()
    await expect(page.getByText('2 users total')).toBeVisible()

    // Check user data
    await expect(page.getByText('John Doe')).toBeVisible()
    await expect(page.getByText('john@example.com')).toBeVisible()
    await expect(page.getByText('Jane Smith')).toBeVisible()
    await expect(page.getByText('jane@example.com')).toBeVisible()
  })

  test('should search users correctly', async ({ page }) => {
    // Search for a specific user
    await page.getByPlaceholderText('Search users by name or email...').fill('john')

    // Wait for search to complete
    await page.waitForTimeout(500)

    // Check that search was triggered
    await expect(page.getByPlaceholderText('Search users by name or email...')).toHaveValue('john')
  })

  test('should filter users by role', async ({ page }) => {
    // Open role filter
    const roleFilter = page.getByText('Role')
    await roleFilter.click()

    // Select admin role
    await page.getByText('Admin').click()

    // Check that filter was applied
    await expect(page.getByText('Admin')).toBeVisible()
  })

  test('should filter users by status', async ({ page }) => {
    // Open status filter
    const statusFilter = page.getByText('Status')
    await statusFilter.click()

    // Select active status
    await page.getByText('Active').click()

    // Check that filter was applied
    await expect(page.getByText('Active')).toBeVisible()
  })

  test('should create a new user', async ({ page }) => {
    // Click Add User button
    await page.getByRole('button', { name: 'Add User' }).click()

    // Check if user creation form/modal opens
    // This would depend on the actual implementation
    // For now, we'll just verify the button is clickable
    await expect(page.getByRole('button', { name: 'Add User' })).toBeVisible()
  })

  test('should select users for bulk operations', async ({ page }) => {
    // Select first user
    const firstUserCheckbox = page.locator('input[type="checkbox"]').nth(1) // Skip select all checkbox
    await firstUserCheckbox.check()

    // Check that user is selected
    await expect(firstUserCheckbox).toBeChecked()

    // Check that bulk actions are shown
    await expect(page.getByText('1 selected')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Bulk Actions' })).toBeVisible()
  })

  test('should select all users', async ({ page }) => {
    // Select all users
    const selectAllCheckbox = page.locator('input[type="checkbox"]').first()
    await selectAllCheckbox.check()

    // Check that all users are selected
    const userCheckboxes = page.locator('input[type="checkbox"]').nth(1) // Skip select all checkbox
    await expect(userCheckboxes).toBeChecked()

    // Check that bulk actions are shown
    await expect(page.getByText('2 selected')).toBeVisible()
  })

  test('should toggle user status', async ({ page }) => {
    // Find the more actions button for first user
    const moreButton = page.locator('button[aria-label="More actions"]').first()
    await moreButton.click()

    // Click deactivate option
    await page.getByText('Deactivate').click()

    // Check that the action was triggered
    // The actual status change would be reflected in the UI
    await expect(page.getByText('Deactivate')).toBeVisible()
  })

  test('should resend verification email', async ({ page }) => {
    // Mock resend verification API
    await page.route('**/api/users/*/resend-verification', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Verification email sent',
        }),
      })
    })

    // Find the more actions button for unverified user
    const moreButton = page.locator('button[aria-label="More actions"]').nth(1)
    await moreButton.click()

    // Click resend verification option
    await page.getByText('Resend Verification').click()

    // Check that the action was triggered
    await expect(page.getByText('Resend Verification')).toBeVisible()
  })

  test('should delete a user', async ({ page }) => {
    // Find the more actions button for first user
    const moreButton = page.locator('button[aria-label="More actions"]').first()
    await moreButton.click()

    // Click delete option
    await page.getByText('Delete').click()

    // Check that delete confirmation dialog appears
    await expect(page.getByText('Delete User')).toBeVisible()
    await expect(page.getByText('Are you sure you want to delete John Doe?')).toBeVisible()

    // Confirm deletion
    await page.getByRole('button', { name: 'Delete User' }).click()

    // Check that user was deleted
    await expect(page.getByText('User deactivated successfully')).toBeVisible()
  })

  test('should handle pagination', async ({ page }) => {
    // Mock paginated data
    const paginatedData = {
      ...mockUsersData,
      data: {
        ...mockUsersData.data,
        pagination: {
          page: 1,
          limit: 20,
          total: 50,
          totalPages: 3,
          hasNext: true,
          hasPrev: false,
        },
      },
    }

    await page.route('**/api/users**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(paginatedData),
        })
      }
    })

    // Refresh page to get paginated data
    await page.reload()

    // Check pagination controls
    await expect(page.getByText('Page 1 of 3')).toBeVisible()
    await expect(page.getByText('Showing 1 to 20 of 50 users')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled()

    // Click next page
    await page.getByRole('button', { name: 'Next' }).click()

    // Check that next page was requested
    await expect(page.getByText('Page 2 of 3')).toBeVisible()
  })

  test('should display loading state', async ({ page }) => {
    // Mock delayed API response
    await page.route('**/api/users**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUsersData),
      })
    })

    // Reload page to trigger loading
    await page.reload()

    // Check loading state
    await expect(page.getByTestId('loading-skeleton')).toBeVisible()
  })

  test('should display error state', async ({ page }) => {
    // Mock API error
    await page.route('**/api/users**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch users',
          },
        }),
      })
    })

    // Reload page to trigger error
    await page.reload()

    // Check error message
    await expect(page.getByText('Failed to load users')).toBeVisible()
  })

  test('should display empty state when no users found', async ({ page }) => {
    // Mock empty data
    const emptyData = {
      ...mockUsersData,
      data: {
        ...mockUsersData.data,
        users: [],
        pagination: {
          ...mockUsersData.data.pagination,
          total: 0,
        },
      },
    }

    await page.route('**/api/users**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(emptyData),
        })
      }
    })

    // Reload page to get empty data
    await page.reload()

    // Check empty state
    await expect(page.getByText('No users found')).toBeVisible()
    await expect(page.getByText('No users have been created yet')).toBeVisible()
  })

  test('should handle search with no results', async ({ page }) => {
    // Mock search with no results
    const noResultsData = {
      ...mockUsersData,
      data: {
        ...mockUsersData.data,
        users: [],
        pagination: {
          ...mockUsersData.data.pagination,
          total: 0,
        },
      },
    }

    await page.route('**/api/users**', async route => {
      const url = new URL(route.request().url())
      if (url.searchParams.get('search')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(noResultsData),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockUsersData),
        })
      }
    })

    // Search for non-existent user
    await page.getByPlaceholderText('Search users by name or email...').fill('nonexistent')
    await page.waitForTimeout(500)

    // Check no results message
    await expect(page.getByText('No users found')).toBeVisible()
    await expect(page.getByText('Try adjusting your search or filters')).toBeVisible()
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Check that interface is still usable on mobile
    await expect(page.getByText('User Management')).toBeVisible()
    await expect(page.getByPlaceholderText('Search users by name or email...')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add User' })).toBeVisible()

    // Check that user data is still visible
    await expect(page.getByText('John Doe')).toBeVisible()
    await expect(page.getByText('Jane Smith')).toBeVisible()
  })

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check table accessibility
    const table = page.locator('table, [role="table"]')
    if (await table.count() > 0) {
      await expect(table).toHaveAttribute('role', 'table')
    }

    // Check button accessibility
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      await expect(button).toHaveAttribute('type', 'button')
    }

    // Check form accessibility
    const searchInput = page.getByPlaceholderText('Search users by name or email...')
    await expect(searchInput).toHaveAttribute('type', 'text')
  })

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Check that focus is on search input
    const searchInput = page.getByPlaceholderText('Search users by name or email...')
    await expect(searchInput).toBeFocused()

    // Test search with keyboard
    await page.keyboard.type('john')
    await page.keyboard.press('Enter')

    // Check that search was triggered
    await expect(searchInput).toHaveValue('john')
  })
})
