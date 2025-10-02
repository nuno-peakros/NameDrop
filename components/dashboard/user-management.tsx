'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  Mail, 
  Shield,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { LoadingSpinner, LoadingSkeleton } from '@/components/ui/loading'
import { ErrorDisplay } from '@/components/ui/error-boundary'
import { UserSearch, SearchResultsSummary } from '@/components/dashboard/user-search'
import { UserFilters, QuickFilters } from '@/components/dashboard/user-filters'
import { cn } from '@/lib/utils'

/**
 * User interface
 */
interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'admin' | 'user'
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  lastLoginAt?: string
  passwordChangedAt?: string
}

/**
 * User management component with full CRUD operations
 * 
 * Features:
 * - User listing with pagination
 * - Search and filtering
 * - User actions (edit, delete, activate/deactivate)
 * - Bulk operations
 * - Real-time updates
 * - Error handling
 * - Loading states
 * 
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <UserManagement />
 * ```
 */
interface UserManagementProps {
  /** Additional CSS classes */
  className?: string
}

function UserManagement({ className }: UserManagementProps) {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [filters, setFilters] = React.useState<Record<string, string | boolean | undefined>>({})
  const [selectedUsers, setSelectedUsers] = React.useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null)
  const [page, setPage] = React.useState(1)
  const [limit] = React.useState(20)

  /**
   * Fetch users with search and filters
   */
  const { 
    data: usersData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['users', { searchTerm, filters, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filters.role && { role: String(filters.role) }),
        ...(filters.isActive !== undefined && { isActive: String(filters.isActive) }),
        ...(filters.emailVerified !== undefined && { emailVerified: String(filters.emailVerified) }),
      })

      const response = await fetch(`/api/users?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      return response.json()
    },
  })

  /**
   * Delete user mutation
   */
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to delete user')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    },
  })

  /**
   * Toggle user active status mutation
   */
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({ isActive }),
      })
      if (!response.ok) {
        throw new Error('Failed to update user status')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  /**
   * Resend verification email mutation
   */
  const resendVerificationMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}/resend-verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to resend verification email')
      }
      return response.json()
    },
  })

  /**
   * Handle user search
   * 
   * @param term - Search term
   */
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setPage(1) // Reset to first page when searching
  }

  /**
   * Handle filters change
   * 
   * @param newFilters - New filter values
   */
  const handleFiltersChange = (newFilters: Record<string, string | boolean | undefined>) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page when filtering
  }

  /**
   * Handle user selection
   * 
   * @param userId - User ID
   * @param selected - Whether user is selected
   */
  const handleUserSelection = (userId: string, selected: boolean) => {
    setSelectedUsers(prev => 
      selected 
        ? [...prev, userId]
        : prev.filter(id => id !== userId)
    )
  }

  /**
   * Handle select all users
   * 
   * @param selected - Whether to select all
   */
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUsers(usersData?.data?.users?.map((user: User) => user.id) || [])
    } else {
      setSelectedUsers([])
    }
  }

  /**
   * Handle delete user
   * 
   * @param user - User to delete
   */
  const handleDeleteUser = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  /**
   * Confirm delete user
   */
  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id)
    }
  }

  /**
   * Handle toggle user status
   * 
   * @param user - User to toggle
   */
  const handleToggleUserStatus = (user: User) => {
    toggleUserStatusMutation.mutate({
      userId: user.id,
      isActive: !user.isActive
    })
  }

  /**
   * Handle resend verification
   * 
   * @param user - User to resend verification for
   */
  const handleResendVerification = (user: User) => {
    resendVerificationMutation.mutate(user.id)
  }

  /**
   * Get user status badge
   * 
   * @param user - User object
   * @returns Status badge component
   */
  const getUserStatusBadge = (user: User) => {
    if (!user.isActive) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <UserX className="h-3 w-3" />
          Inactive
        </Badge>
      )
    }

    if (!user.emailVerified) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Unverified
        </Badge>
      )
    }

    return (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Active
      </Badge>
    )
  }

  /**
   * Get user role badge
   * 
   * @param role - User role
   * @returns Role badge component
   */
  const getUserRoleBadge = (role: string) => {
    return (
      <Badge 
        variant={role === 'admin' ? 'default' : 'outline'}
        className="flex items-center gap-1"
      >
        <Shield className="h-3 w-3" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  /**
   * Format date for display
   * 
   * @param dateString - Date string
   * @returns Formatted date
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const users = usersData?.data?.users || []
  const totalUsers = usersData?.data?.total || 0
  const totalPages = Math.ceil(totalUsers / limit)

  if (error) {
    return (
      <div className={className}>
        <ErrorDisplay 
          error={error instanceof Error ? error.message : 'Failed to load users'} 
          variant="card" 
        />
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <UserSearch
              onSearch={handleSearch}
              placeholder="Search users by name or email..."
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Export
            </Button>
            <Button size="sm">
              Add User
            </Button>
          </div>
        </div>

        <UserFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          showAdvanced={true}
        />

        {searchTerm && (
          <SearchResultsSummary
            totalResults={totalUsers}
            searchTerm={searchTerm}
          />
        )}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                {totalUsers} user{totalUsers !== 1 ? 's' : ''} total
              </CardDescription>
            </div>
            {selectedUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedUsers.length} selected
                </span>
                <Button variant="outline" size="sm">
                  Bulk Actions
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <LoadingSkeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <LoadingSkeleton className="h-4 w-1/4" />
                    <LoadingSkeleton className="h-3 w-1/3" />
                  </div>
                  <LoadingSkeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {searchTerm || Object.keys(filters).length > 0
                  ? 'Try adjusting your search or filters'
                  : 'No users have been created yet'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 items-center py-2 text-sm font-medium text-muted-foreground border-b">
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-input"
                  />
                </div>
                <div className="col-span-3">User</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Created</div>
                <div className="col-span-2">Last Login</div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* Table Rows */}
              {users.map((user: User) => (
                <div
                  key={user.id}
                  className="grid grid-cols-12 gap-4 items-center py-3 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => handleUserSelection(user.id, e.target.checked)}
                      className="rounded border-input"
                    />
                  </div>
                  
                  <div className="col-span-3 flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" />
                      <AvatarFallback>
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-foreground">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    {getUserRoleBadge(user.role)}
                  </div>

                  <div className="col-span-2">
                    {getUserStatusBadge(user)}
                  </div>

                  <div className="col-span-2 text-sm text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </div>

                  <div className="col-span-2 text-sm text-muted-foreground">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                  </div>

                  <div className="col-span-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleUserStatus(user)}>
                          {user.isActive ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        {!user.emailVerified && (
                          <DropdownMenuItem onClick={() => handleResendVerification(user)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Resend Verification
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteUser(user)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalUsers)} of {totalUsers} users
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {userToDelete?.firstName} {userToDelete?.lastName}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { UserManagement, type UserManagementProps, type User }
