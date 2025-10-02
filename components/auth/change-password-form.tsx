'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authSchemas } from '@/lib/validation'

/**
 * Change password form schema using existing validation
 */
const changePasswordSchema = authSchemas.changePassword

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

/**
 * Change password form component with validation and error handling
 * 
 * Features:
 * - Form validation using Zod schemas
 * - Password strength validation
 * - Loading states during submission
 * - Error handling and display
 * - Responsive design
 * - Accessibility support
 * 
 * @param onSuccess - Callback when password change is successful
 * @param redirectTo - URL to redirect to after successful password change
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <ChangePasswordForm 
 *   onSuccess={() => console.log('Password changed')}
 *   redirectTo="/dashboard"
 * />
 * ```
 */
interface ChangePasswordFormProps {
  /** Callback when password change is successful */
  onSuccess?: () => void
  /** URL to redirect to after successful password change */
  redirectTo?: string
  /** Additional CSS classes */
  className?: string
}

function ChangePasswordForm({ onSuccess, redirectTo = '/dashboard', className }: ChangePasswordFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [showPasswords, setShowPasswords] = React.useState({
    current: false,
    new: false,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  const newPassword = watch('newPassword', '')

  /**
   * Handle form submission
   * 
   * @param data - Form data
   */
  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setIsLoading(true)
      setError(null)

      const token = localStorage.getItem('auth-token')
      if (!token) {
        throw new Error('Authentication required. Please log in again.')
      }

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Password change failed')
      }

      if (result.success) {
        // Call success callback
        onSuccess?.()

        // Redirect to specified page
        router.push(redirectTo)
      } else {
        throw new Error(result.message || 'Password change failed')
      }
    } catch (error) {
      console.error('Password change error:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Toggle password visibility
   * 
   * @param field - Password field to toggle
   */
  const togglePasswordVisibility = (field: 'current' | 'new') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  /**
   * Get password strength indicator
   * 
   * @param password - Password to check
   * @returns Password strength info
   */
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' }
    
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    const strengthMap = {
      0: { label: 'Very weak', color: 'bg-destructive' },
      1: { label: 'Weak', color: 'bg-destructive' },
      2: { label: 'Fair', color: 'bg-orange-500' },
      3: { label: 'Good', color: 'bg-yellow-500' },
      4: { label: 'Strong', color: 'bg-green-500' },
      5: { label: 'Very strong', color: 'bg-green-600' },
    }

    return { strength, ...strengthMap[strength as keyof typeof strengthMap] }
  }

  const passwordStrength = getPasswordStrength(newPassword)

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
        <CardTitle className="text-2xl font-bold">Change Password</CardTitle>
        <CardDescription>
          Update your password to keep your account secure
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
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? 'text' : 'password'}
                placeholder="Enter your current password"
                {...register('currentPassword')}
                aria-invalid={errors.currentPassword ? 'true' : 'false'}
                aria-describedby={errors.currentPassword ? 'current-password-error' : undefined}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('current')}
                aria-label={showPasswords.current ? 'Hide password' : 'Show password'}
              >
                {showPasswords.current ? '👁️' : '👁️‍🗨️'}
              </Button>
            </div>
            {errors.currentPassword && (
              <p id="current-password-error" className="text-sm text-destructive">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? 'text' : 'password'}
                placeholder="Enter your new password"
                {...register('newPassword')}
                aria-invalid={errors.newPassword ? 'true' : 'false'}
                aria-describedby={errors.newPassword ? 'new-password-error' : undefined}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('new')}
                aria-label={showPasswords.new ? 'Hide password' : 'Show password'}
              >
                {showPasswords.new ? '👁️' : '👁️‍🗨️'}
              </Button>
            </div>
            {errors.newPassword && (
              <p id="new-password-error" className="text-sm text-destructive">
                {errors.newPassword.message}
              </p>
            )}
            
            {/* Password strength indicator */}
            {newPassword && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {passwordStrength.label}
                  </span>
                </div>
              </div>
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
                <span id="loading-text">Updating password...</span>
              </>
            ) : (
              'Update Password'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            Remember to use a strong, unique password
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export { ChangePasswordForm, type ChangePasswordFormProps }
