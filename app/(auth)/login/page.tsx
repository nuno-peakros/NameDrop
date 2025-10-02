'use client'

import { LoginForm } from '@/components/auth/login-form'

/**
 * Login page component
 * 
 * Features:
 * - Responsive design
 * - Centered layout
 * - Dark mode support
 * - Accessibility optimized
 * 
 * @returns JSX element
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <LoginForm 
          redirectTo="/dashboard"
          onSuccess={(user) => {
            console.log('User logged in:', user)
          }}
        />
      </div>
    </div>
  )
}
