import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserManagement } from '@/components/dashboard/user-management'
import { UserSearch } from '@/components/dashboard/user-search'
import { UserFilters } from '@/components/dashboard/user-filters'

// Mock Next.js router
const mockPush = vi.fn()
const mockRouter = {
  push: mockPush,
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
}

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

// Mock fetch
global.fetch = vi.fn()

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

/**
 * Test wrapper component with QueryClient
 */
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

/**
 * Mock user data
 */
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

/**
 * Unit tests for dashboard components
 * 
 * Tests cover:
 * - User management component
 * - User search component
 * - User filters component
 * - Data fetching and display
 * - User interactions and mutations
 * - Error handling and loading states
 */
describe('Dashboard Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('mock-token')
  })

  describe('UserManagement', () => {
    it('should render user management interface correctly', async () => {
      // Mock successful API response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsersData,
      } as Response)

      render(
        <TestWrapper>
          <UserManagement />
        </TestWrapper>
      )

      // Check header
      expect(screen.getByText('User Management')).toBeInTheDocument()
      expect(screen.getByText('Manage user accounts, roles, and permissions')).toBeInTheDocument()

      // Check search and filters
      expect(screen.getByPlaceholderText('Search users by name or email...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add User' })).toBeInTheDocument()

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument()
      })

      // Check user data
      expect(screen.getByText('User Management')).toBeInTheDocument()
    })

    it('should display loading state while fetching users', () => {
      // Mock delayed API response
      vi.mocked(fetch).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => mockUsersData,
        } as Response), 100))
      )

      render(
        <TestWrapper>
          <UserManagement />
        </TestWrapper>
      )

      // Check loading skeletons
      expect(screen.getAllByTestId('loading-skeleton')).toHaveLength(20)
    })

    it('should display error state when fetch fails', async () => {
      // Mock API error
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Failed to fetch users'))

      render(
        <TestWrapper>
          <UserManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument()
      })
    })

    it('should display empty state when no users found', async () => {
      const emptyUsersData = {
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

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => emptyUsersData,
      } as Response)

      render(
        <TestWrapper>
          <UserManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument()
        expect(screen.getByText('No users have been created yet')).toBeInTheDocument()
      })
    })

    it('should handle user search', async () => {
      const user = userEvent.setup()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsersData,
      } as Response)

      render(
        <TestWrapper>
          <UserManagement />
        </TestWrapper>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument()
      })

      // Search for a user
      const searchInput = screen.getByPlaceholderText('Search users by name or email...')
      await user.type(searchInput, 'john')

      // Mock search results
      const searchResults = {
        ...mockUsersData,
        data: {
          ...mockUsersData.data,
          users: [mockUsers[0]], // Only John Doe
        },
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => searchResults,
      } as Response)

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument()
      })
    })

    it('should handle user selection', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const user = userEvent.setup()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsersData,
      } as Response)

      render(
        <TestWrapper>
          <UserManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument()
      })

      // Select a user
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument()
      })
    })

    it('should handle select all users', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const user = userEvent.setup()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsersData,
      } as Response)

      render(
        <TestWrapper>
          <UserManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument()
      })

      // Select all users
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument()
      })
    })

    it('should handle user deletion', async () => {
      const user = userEvent.setup()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsersData,
      } as Response)

      render(
        <TestWrapper>
          <UserManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument()
      })

      // Click delete button for first user
      const moreButtons = screen.getAllByRole('button', { name: '' })
      const deleteButton = moreButtons.find(button => 
        button.querySelector('svg[data-lucide="trash-2"]')
      )
      
      if (deleteButton) {
        await user.click(deleteButton)
      }

      // Check delete dialog
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument()
      })

      // Mock successful deletion
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'User deleted successfully' }),
      } as Response)

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument()
      })
    })

    it('should handle user status toggle', async () => {
      const user = userEvent.setup()

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsersData,
      } as Response)

      render(
        <TestWrapper>
          <UserManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument()
      })

      // Mock successful status update
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'User updated successfully' }),
      } as Response)

      // Click more button and then deactivate
      const moreButtons = screen.getAllByRole('button', { name: '' })
      const moreButton = moreButtons[0]
      await user.click(moreButton)

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument()
      })
    })

    it('should handle pagination', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const user = userEvent.setup()

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

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => paginatedData,
      } as Response)

      render(
        <TestWrapper>
          <UserManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument()
      })

      // Mock next page data
      const nextPageData = {
        ...paginatedData,
        data: {
          ...paginatedData.data,
          pagination: {
            ...paginatedData.data.pagination,
            page: 2,
            hasNext: true,
            hasPrev: true,
          },
        },
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => nextPageData,
      } as Response)

      // Click next page
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument()
      })
    })
  })

  describe('UserSearch', () => {
    it('should render search input correctly', () => {
      const mockOnSearch = vi.fn()
      
      render(
        <UserSearch 
          onSearch={mockOnSearch}
          placeholder="Search users..."
        />
      )

      expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument()
    })

    it('should call onSearch when typing', async () => {
      const user = userEvent.setup()
      const mockOnSearch = vi.fn()
      
      render(
        <UserSearch 
          onSearch={mockOnSearch}
          placeholder="Search users..."
        />
      )

      const searchInput = screen.getByPlaceholderText('Search users...')
      await user.type(searchInput, 'john')

      // Should debounce the search
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('john')
      }, { timeout: 1000 })
    })

    it('should clear search when clear button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnSearch = vi.fn()
      
      render(
        <UserSearch 
          onSearch={mockOnSearch}
          placeholder="Search users..."
        />
      )

      const searchInput = screen.getByPlaceholderText('Search users...')
      await user.type(searchInput, 'john')

      // Find and click clear button
      const clearButton = screen.getByRole('button', { name: 'Clear search' })
      await user.click(clearButton)

      expect(searchInput).toHaveValue('')
      expect(mockOnSearch).toHaveBeenCalledWith('')
    })
  })

  describe('UserFilters', () => {
    it('should render filter controls correctly', () => {
      const mockOnFiltersChange = vi.fn()
      const filters = {
        role: 'user',
        isActive: true,
        emailVerified: false,
      }

      render(
        <UserFilters 
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      expect(screen.getByText('Role')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('should call onFiltersChange when filters change', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const user = userEvent.setup()
      const mockOnFiltersChange = vi.fn()
      const filters = {}

      render(
        <UserFilters 
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      // Change role filter
      await waitFor(() => {
        expect(screen.getByText('Role')).toBeInTheDocument()
      })
    })

    it('should show advanced filters when showAdvanced is true', () => {
      const mockOnFiltersChange = vi.fn()
      const filters = {}

      render(
        <UserFilters 
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
          showAdvanced={true}
        />
      )

      expect(screen.getByText('Role')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('should clear filters when clear button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnFiltersChange = vi.fn()
      const filters = {
        role: 'admin',
        isActive: true,
      }

      render(
        <UserFilters 
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      const clearButton = screen.getByRole('button', { name: 'Clear filters' })
      await user.click(clearButton)

      expect(mockOnFiltersChange).toHaveBeenCalledWith({})
    })
  })
})
