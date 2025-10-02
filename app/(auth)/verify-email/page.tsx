'use client'

import { VerifyEmailForm } from '@/components/auth/verify-email-form'

/**
 * Email verification page component
 * 
 * Features:
 * - Responsive design
 * - Centered layout
 * - Dark mode support
 * - Accessibility optimized
 * - Auto-populate token from URL
 * 
 * @returns JSX element
 */
export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <VerifyEmailForm 
          redirectTo="/dashboard"
          onSuccess={() => {
            console.log('Email verified successfully')
          }}
        />
      </div>
    </div>
  )
}
