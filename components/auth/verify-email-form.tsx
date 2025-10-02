'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authSchemas } from '@/lib/validation'

/**
 * Email verification form schema using existing validation
 */
const verifyEmailSchema = authSchemas.verifyEmail

type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>

/**
 * Email verification form component with validation and error handling
 * 
 * Features:
 * - Form validation using Zod schemas
 * - Loading states during submission
 * - Error handling and display
 * - Responsive design
 * - Accessibility support
 * - Auto-populate token from URL
 * 
 * @param onSuccess - Callback when email verification is successful
 * @param redirectTo - URL to redirect to after successful verification
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <VerifyEmailForm 
 *   onSuccess={() => console.log('Email verified')}
 *   redirectTo="/dashboard"
 * />
 * ```
 */
interface VerifyEmailFormProps {
  /** Callback when email verification is successful */
  onSuccess?: () => void
  /** URL to redirect to after successful verification */
  redirectTo?: string
  /** Additional CSS classes */
  className?: string
}

function VerifyEmailForm({ onSuccess, redirectTo = '/dashboard', className }: VerifyEmailFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isVerified, setIsVerified] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
  })

  // Auto-populate token from URL parameters
  React.useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      setValue('token', token)
    }
  }, [searchParams, setValue])

  /**
   * Handle form submission
   * 
   * @param data - Form data
   */
  const onSubmit = async (data: VerifyEmailFormData) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Email verification failed')
      }

      if (result.success) {
        setIsVerified(true)
        
        // Call success callback
        onSuccess?.()

        // Redirect to specified page after a short delay
        setTimeout(() => {
          router.push(redirectTo)
        }, 2000)
      } else {
        throw new Error(result.message || 'Email verification failed')
      }
    } catch (error) {
      console.error('Email verification error:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Resend verification email
   */
  const handleResendVerification = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: '' }), // This would need the user's email
      })

      const result = await response.json()

      if (result.success) {
        // Show success message
        setError(null)
      } else {
        throw new Error(result.message || 'Failed to resend verification email')
      }
    } catch (error) {
      console.error('Resend verification error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification email'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerified) {
    return (
      <Card className={className}>
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
            Email Verified!
          </CardTitle>
          <CardDescription>
            Your email has been successfully verified. You will be redirected shortly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="space-y-2 text-center">
        <div className="flex justify-center mb-4">
          <img 
            src="/logo.svg" 
            alt="NameDrop Logo" 
            width={40} 
            height={40} 
            className="text-primary"
          />
        </div>
        <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
        <CardDescription>
          Enter the verification token sent to your email address
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
            <Label htmlFor="token">Verification Token</Label>
            <Input
              id="token"
              type="text"
              placeholder="Enter verification token"
              {...register('token')}
              aria-invalid={errors.token ? 'true' : 'false'}
              aria-describedby={errors.token ? 'token-error' : undefined}
            />
            {errors.token && (
              <p id="token-error" className="text-sm text-destructive">
                {errors.token.message}
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
                <span id="loading-text">Verifying email...</span>
              </>
            ) : (
              'Verify Email'
            )}
          </Button>
        </form>

        <div className="mt-6 space-y-4">
          <div className="text-center text-sm">
            <p className="text-muted-foreground">
              Didn't receive the email?{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal"
                onClick={handleResendVerification}
                disabled={isLoading}
              >
                Resend verification email
              </Button>
            </p>
          </div>

          <div className="text-center text-sm">
            <p className="text-muted-foreground">
              Check your spam folder if you don't see the email
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { VerifyEmailForm, type VerifyEmailFormProps }
