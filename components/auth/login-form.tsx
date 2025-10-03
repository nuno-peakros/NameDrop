'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { ClientOnly } from '@/components/client-only'
// import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authSchemas } from '@/lib/validation'

/**
 * Login form schema using existing validation
 */
const loginSchema = authSchemas.login

type LoginFormData = z.infer<typeof loginSchema>

/**
 * Login form component with validation and error handling
 * 
 * Features:
 * - Form validation using Zod schemas
 * - Loading states during submission
 * - Error handling and display
 * - Responsive design
 * - Accessibility support
 * 
 * @param onSuccess - Callback when login is successful
 * @param redirectTo - URL to redirect to after successful login
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <LoginForm 
 *   onSuccess={(user) => console.log('Logged in:', user)}
 *   redirectTo="/dashboard"
 * />
 * ```
 */
interface LoginFormProps {
  /** Callback when login is successful */
  onSuccess?: (user: { id: string; email: string; firstName: string; lastName: string }) => void
  /** URL to redirect to after successful login */
  redirectTo?: string
  /** Additional CSS classes */
  className?: string
}

function LoginForm({ onSuccess, redirectTo = '/dashboard', className }: LoginFormProps) {
  // const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  /**
   * Handle form submission
   * 
   * @param data - Form data
   */
  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true)
      setError(null)

      // Regular authentication
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Login failed')
      }

      if (result.success) {
              // Store token in localStorage
              if (result.data?.token) {
                localStorage.setItem('auth-token', result.data.token)
              }

              // Call success callback
              onSuccess?.(result.data?.user)

              // Redirect to specified page
              window.location.href = redirectTo
      } else {
        throw new Error(result.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ClientOnly>
      <Card className={className}>
      <CardHeader className="space-y-2 text-center">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo.svg"
            alt="NameDrop Logo"
            width={300}
            height={300}
            className="text-primary"
            priority
            unoptimized
          />
        </div>
        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register('email')}
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register('password')}
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
            aria-describedby={isLoading ? 'loading-text' : undefined}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span id="loading-text">Signing in...</span>
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Button variant="link" className="p-0 h-auto font-normal">
              Contact administrator
            </Button>
          </p>
        </div>
      </CardContent>
      </Card>
    </ClientOnly>
  )
}

export { LoginForm, type LoginFormProps }
