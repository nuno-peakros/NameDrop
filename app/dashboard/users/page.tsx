'use client'

import { UserManagement } from '@/components/dashboard/user-management'

/**
 * Users management page component
 * 
 * Features:
 * - User listing with search and filtering
 * - User management operations
 * - Responsive design
 * - Error handling
 * 
 * @returns JSX element
 */
export default function UsersPage() {
  return (
    <div className="space-y-6">
      <UserManagement />
    </div>
  )
}
