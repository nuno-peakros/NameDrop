import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserCreateForm } from '@/components/dashboard/user-create-form'
import { UserEditForm } from '@/components/dashboard/user-edit-form'
import { RoleChangeConfirmation } from '@/components/dashboard/role-change-confirmation'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => 'mock-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock fetch
global.fetch = vi.fn()

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

describe('User Type Management', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    vi.clearAllMocks()
  })

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  describe('UserCreateForm', () => {
    it('should render create user form with all fields', () => {
      render(
        <TestWrapper>
          <UserCreateForm open={true} onOpenChange={vi.fn()} />
        </TestWrapper>
      )

      expect(screen.getByText('Create New User')).toBeInTheDocument()
      expect(screen.getByLabelText('First Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Role')).toBeInTheDocument()
      expect(screen.getByText('Create User')).toBeInTheDocument()
    })

    it('should validate required fields', async () => {
      render(
        <TestWrapper>
          <UserCreateForm open={true} onOpenChange={vi.fn()} />
        </TestWrapper>
      )

      const submitButton = screen.getByText('Create User')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument()
        expect(screen.getByText('Last name is required')).toBeInTheDocument()
        expect(screen.getByText('Email is required')).toBeInTheDocument()
      })
    })

    it('should validate email format', async () => {
      render(
        <TestWrapper>
          <UserCreateForm open={true} onOpenChange={vi.fn()} />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText('Email')
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

      const submitButton = screen.getByText('Create User')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument()
      })
    })
  })

  describe('UserEditForm', () => {
    const mockUser = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'user' as const,
      isActive: true,
      emailVerified: true,
      createdAt: '2023-01-01T00:00:00Z',
    }

    it('should render edit user form with user data', () => {
      render(
        <TestWrapper>
          <UserEditForm user={mockUser} open={true} onOpenChange={vi.fn()} />
        </TestWrapper>
      )

      expect(screen.getByText('Edit User')).toBeInTheDocument()
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
    })

    it('should show role change warning when role is changed', async () => {
      render(
        <TestWrapper>
          <UserEditForm user={mockUser} open={true} onOpenChange={vi.fn()} />
        </TestWrapper>
      )

      const roleSelect = screen.getByDisplayValue('User')
      fireEvent.click(roleSelect)
      
      const adminOption = screen.getByText('Admin')
      fireEvent.click(adminOption)

      await waitFor(() => {
        expect(screen.getByText(/Role will be changed from user to admin/)).toBeInTheDocument()
      })
    })
  })

  describe('RoleChangeConfirmation', () => {
    const mockUserData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      currentRole: 'user' as const,
      newRole: 'admin' as const,
    }

    it('should render role change confirmation dialog', () => {
      render(
        <RoleChangeConfirmation
          open={true}
          onOpenChange={vi.fn()}
          onConfirm={vi.fn()}
          user={mockUserData}
        />
      )

      expect(screen.getByText('Confirm Role Change')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('Current Role:')).toBeInTheDocument()
      expect(screen.getByText('New Role:')).toBeInTheDocument()
    })

    it('should show promotion warning when promoting to admin', () => {
      render(
        <RoleChangeConfirmation
          open={true}
          onOpenChange={vi.fn()}
          onConfirm={vi.fn()}
          user={mockUserData}
        />
      )

      expect(screen.getByText('Promoting to Admin')).toBeInTheDocument()
      expect(screen.getByText(/This user will gain administrative privileges/)).toBeInTheDocument()
    })

    it('should show demotion warning when demoting from admin', () => {
      const demotionData = {
        ...mockUserData,
        currentRole: 'admin' as const,
        newRole: 'user' as const,
      }

      render(
        <RoleChangeConfirmation
          open={true}
          onOpenChange={vi.fn()}
          onConfirm={vi.fn()}
          user={demotionData}
        />
      )

      expect(screen.getByText('Demoting from Admin')).toBeInTheDocument()
      expect(screen.getByText(/This user will lose administrative privileges/)).toBeInTheDocument()
    })

    it('should call onConfirm when confirm button is clicked', () => {
      const onConfirm = vi.fn()
      
      render(
        <RoleChangeConfirmation
          open={true}
          onOpenChange={vi.fn()}
          onConfirm={onConfirm}
          user={mockUserData}
        />
      )

      const confirmButton = screen.getByText('Confirm Role Change')
      fireEvent.click(confirmButton)

      expect(onConfirm).toHaveBeenCalledTimes(1)
    })
  })
})
