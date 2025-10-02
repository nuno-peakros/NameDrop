import { Metadata } from 'next'
import { UserManagement } from '@/components/dashboard/user-management'

/**
 * Users page metadata
 */
export const metadata: Metadata = {
  title: 'Users | NameDrop Dashboard',
  description: 'Manage user accounts, roles, and permissions',
}

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
