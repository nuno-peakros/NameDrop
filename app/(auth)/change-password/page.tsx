'use client'

import { ChangePasswordForm } from '@/components/auth/change-password-form'

/**
 * Change password page component
 * 
 * Features:
 * - Responsive design
 * - Centered layout
 * - Dark mode support
 * - Accessibility optimized
 * 
 * @returns JSX element
 */
export default function ChangePasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <ChangePasswordForm 
          redirectTo="/dashboard"
          onSuccess={() => {
            console.log('Password changed successfully')
          }}
        />
      </div>
    </div>
  )
}
