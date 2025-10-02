import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginForm } from '@/components/auth/login-form'
import { ChangePasswordForm } from '@/components/auth/change-password-form'
import { VerifyEmailForm } from '@/components/auth/verify-email-form'

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
 * Unit tests for authentication components
 * 
 * Tests cover:
 * - Login form component
 * - Change password form component
 * - Email verification form component
 * - Form validation and submission
 * - Error handling and loading states
 * - User interactions and callbacks
 */
describe('Auth Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    mockLocalStorage.setItem.mockClear()
  })

  describe('LoginForm', () => {
    it('should render login form correctly', () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      )

      expect(screen.getByText('Welcome back')).toBeInTheDocument()
      expect(screen.getByText('Sign in to your account to continue')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
    })

    it('should show validation errors for invalid input', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      // Submit form with invalid data
      await user.type(emailInput, 'invalid-email')
      await user.type(passwordInput, '123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid email')).toBeInTheDocument()
        expect(screen.getByText('String must contain at least 8 character(s)')).toBeInTheDocument()
      })
    })

    it('should submit form with valid data', async () => {
      const user = userEvent.setup()
      const mockOnSuccess = vi.fn()

      // Mock successful API response
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user-123',
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
          token: 'jwt-token-123',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        message: 'Login successful',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      render(
        <TestWrapper>
          <LoginForm onSuccess={mockOnSuccess} redirectTo="/dashboard" />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      // Fill form with valid data
      await user.type(emailInput, 'john@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      // Check loading state
      expect(screen.getByText('Signing in...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'john@example.com',
            password: 'password123',
          }),
        })
      })

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth-token', 'jwt-token-123')
        expect(mockOnSuccess).toHaveBeenCalledWith(mockResponse.data.user)
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should handle login errors', async () => {
      const user = userEvent.setup()

      // Mock API error response
      const mockErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      } as Response)

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      // Fill form with valid data
      await user.type(emailInput, 'john@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
      })

      // Check that loading state is cleared
      expect(screen.getByRole('button', { name: 'Sign in' })).not.toBeDisabled()
    })

    it('should handle network errors', async () => {
      const user = userEvent.setup()

      // Mock network error
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      // Fill form with valid data
      await user.type(emailInput, 'john@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()

      // Mock delayed API response
      vi.mocked(fetch).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, data: {}, message: 'Success' }),
        } as Response), 100))
      )

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      // Fill form with valid data
      await user.type(emailInput, 'john@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      // Check loading state
      expect(screen.getByText('Signing in...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Sign in' })).not.toBeDisabled()
      })
    })

    it('should have proper accessibility attributes', () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')

      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('aria-invalid', 'false')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('aria-invalid', 'false')
    })
  })

  describe('ChangePasswordForm', () => {
    it('should render change password form correctly', () => {
      render(
        <TestWrapper>
          <ChangePasswordForm />
        </TestWrapper>
      )

      expect(screen.getByText('Change Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument()
      expect(screen.getByLabelText('New Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Change Password' })).toBeInTheDocument()
    })

    it('should validate password confirmation', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <ChangePasswordForm />
        </TestWrapper>
      )

      const currentPasswordInput = screen.getByLabelText('Current Password')
      const newPasswordInput = screen.getByLabelText('New Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password')
      const submitButton = screen.getByRole('button', { name: 'Change Password' })

      // Fill form with mismatched passwords
      await user.type(currentPasswordInput, 'currentPassword123')
      await user.type(newPasswordInput, 'newPassword123')
      await user.type(confirmPasswordInput, 'differentPassword123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
      })
    })

    it('should submit form with valid data', async () => {
      const user = userEvent.setup()
      const mockOnSuccess = vi.fn()

      // Mock successful API response
      const mockResponse = {
        success: true,
        message: 'Password changed successfully',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      render(
        <TestWrapper>
          <ChangePasswordForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      )

      const currentPasswordInput = screen.getByLabelText('Current Password')
      const newPasswordInput = screen.getByLabelText('New Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password')
      const submitButton = screen.getByRole('button', { name: 'Change Password' })

      // Fill form with valid data
      await user.type(currentPasswordInput, 'currentPassword123')
      await user.type(newPasswordInput, 'newPassword123')
      await user.type(confirmPasswordInput, 'newPassword123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer null',
          },
          body: JSON.stringify({
            currentPassword: 'currentPassword123',
            newPassword: 'newPassword123',
          }),
        })
      })

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })
  })

  describe('VerifyEmailForm', () => {
    it('should render email verification form correctly', () => {
      render(
        <TestWrapper>
          <VerifyEmailForm />
        </TestWrapper>
      )

      expect(screen.getByText('Verify Email Address')).toBeInTheDocument()
      expect(screen.getByText('Please enter the verification code sent to your email')).toBeInTheDocument()
      expect(screen.getByLabelText('Verification Code')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Verify Email' })).toBeInTheDocument()
      expect(screen.getByText('Resend verification email')).toBeInTheDocument()
    })

    it('should validate verification code', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <VerifyEmailForm />
        </TestWrapper>
      )

      const codeInput = screen.getByLabelText('Verification Code')
      const submitButton = screen.getByRole('button', { name: 'Verify Email' })

      // Submit form with empty code
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Verification code is required')).toBeInTheDocument()
      })
    })

    it('should submit verification code', async () => {
      const user = userEvent.setup()
      const mockOnSuccess = vi.fn()

      // Mock successful API response
      const mockResponse = {
        success: true,
        message: 'Email verified successfully',
        user: {
          id: 'user-123',
          email: 'john@example.com',
          emailVerified: true,
        },
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      render(
        <TestWrapper>
          <VerifyEmailForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      )

      const codeInput = screen.getByLabelText('Verification Code')
      const submitButton = screen.getByRole('button', { name: 'Verify Email' })

      // Fill form with verification code
      await user.type(codeInput, 'verification-code-123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: 'verification-code-123',
          }),
        })
      })

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockResponse.user)
      })
    })

    it('should handle resend verification', async () => {
      const user = userEvent.setup()

      // Mock successful resend response
      const mockResendResponse = {
        success: true,
        message: 'Verification email sent',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResendResponse,
      } as Response)

      render(
        <TestWrapper>
          <VerifyEmailForm />
        </TestWrapper>
      )

      const resendButton = screen.getByText('Resend verification email')
      await user.click(resendButton)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/users/user-123/resend-verification', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer null',
          },
        })
      })
    })
  })
})
