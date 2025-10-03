'use client'

import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/ui/loading'
import { ErrorDisplay } from '@/components/ui/error-boundary'
import { RoleChangeConfirmation } from '@/components/dashboard/role-change-confirmation'

/**
 * User interface
 */
interface ApiUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  passwordChangedAt?: string
}

/**
 * User edit form data interface
 */
interface EditUserFormData {
  firstName: string
  lastName: string
  email: string
  role: 'user' | 'admin'
  isActive: boolean
}

/**
 * User edit form component
 * 
 * Features:
 * - Form validation
 * - Role change capability
 * - Status toggle
 * - Error handling
 * - Loading states
 * - Success feedback
 * 
 * @param user - User to edit
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback when dialog open state changes
 * 
 * @example
 * ```tsx
 * <UserEditForm 
 *   user={selectedUser}
 *   open={isOpen} 
 *   onOpenChange={setIsOpen} 
 * />
 * ```
 */
interface UserEditFormProps {
  /** User to edit */
  user: ApiUser | null
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
}

export function UserEditForm({ user, open, onOpenChange }: UserEditFormProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = React.useState<EditUserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'user',
    isActive: true
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [originalRole, setOriginalRole] = React.useState<'user' | 'admin'>('user')
  const [roleChangeDialogOpen, setRoleChangeDialogOpen] = React.useState(false)
  const [pendingFormData, setPendingFormData] = React.useState<EditUserFormData | null>(null)

  /**
   * Initialize form data when user changes
   */
  React.useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role as 'user' | 'admin',
        isActive: user.isActive
      })
      setOriginalRole(user.role as 'user' | 'admin')
      setErrors({})
    }
  }, [user])

  /**
   * Update user mutation
   */
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: EditUserFormData }) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to update user')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onOpenChange(false)
    },
    onError: (error) => {
      console.error('Update user error:', error)
    },
  })

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    } else if (formData.firstName.length > 100) {
      newErrors.firstName = 'First name must be less than 100 characters'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    } else if (formData.lastName.length > 100) {
      newErrors.lastName = 'Last name must be less than 100 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.role) {
      newErrors.role = 'Role is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !validateForm()) {
      return
    }

    // Check if role has changed
    if (originalRole !== formData.role) {
      setPendingFormData(formData)
      setRoleChangeDialogOpen(true)
    } else {
      updateUserMutation.mutate({ userId: user.id, userData: formData })
    }
  }

  /**
   * Handle role change confirmation
   */
  const handleRoleChangeConfirm = () => {
    if (!user || !pendingFormData) {
      return
    }

    setRoleChangeDialogOpen(false)
    updateUserMutation.mutate({ userId: user.id, userData: pendingFormData })
    setPendingFormData(null)
  }

  /**
   * Handle input change
   */
  const handleInputChange = (field: keyof EditUserFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!updateUserMutation.isPending) {
      onOpenChange(false)
    }
  }

  /**
   * Check if role has changed
   */
  const roleChanged = originalRole !== formData.role

  if (!user) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and role. Changes will take effect immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="Enter first name"
              disabled={updateUserMutation.isPending}
              className={errors.firstName ? 'border-red-500' : ''}
            />
            {errors.firstName && (
              <p className="text-sm text-red-500">{errors.firstName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Enter last name"
              disabled={updateUserMutation.isPending}
              className={errors.lastName ? 'border-red-500' : ''}
            />
            {errors.lastName && (
              <p className="text-sm text-red-500">{errors.lastName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
              disabled={updateUserMutation.isPending}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value: 'user' | 'admin') => handleInputChange('role', value)}
              disabled={updateUserMutation.isPending}
            >
              <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role}</p>
            )}
            {roleChanged && (
              <p className="text-sm text-amber-600">
                ⚠️ Role will be changed from {originalRole} to {formData.role}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="isActive">Status</Label>
            <Select
              value={formData.isActive ? 'active' : 'inactive'}
              onValueChange={(value) => handleInputChange('isActive', value === 'active')}
              disabled={updateUserMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {updateUserMutation.error && (
            <ErrorDisplay 
              error={updateUserMutation.error as Error}
              className="text-sm"
            />
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Update User
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Role Change Confirmation Dialog */}
      <RoleChangeConfirmation
        open={roleChangeDialogOpen}
        onOpenChange={setRoleChangeDialogOpen}
        onConfirm={handleRoleChangeConfirm}
        user={user && pendingFormData ? {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          currentRole: originalRole,
          newRole: pendingFormData.role
        } : null}
        isPending={updateUserMutation.isPending}
      />
    </Dialog>
  )
}
