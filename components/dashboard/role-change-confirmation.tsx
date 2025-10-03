'use client'

import * as React from 'react'
import { AlertTriangle, Shield, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

/**
 * Role change confirmation dialog props
 */
interface RoleChangeConfirmationProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when user confirms the role change */
  onConfirm: () => void
  /** User being modified */
  user: {
    firstName: string
    lastName: string
    email: string
    currentRole: 'user' | 'admin'
    newRole: 'user' | 'admin'
  } | null
  /** Whether the operation is in progress */
  isPending?: boolean
}

/**
 * Role change confirmation dialog component
 * 
 * Features:
 * - Clear role change information
 * - Warning about admin privileges
 * - Confirmation required for role changes
 * - Loading state support
 * 
 * @param props - Component props
 * 
 * @example
 * ```tsx
 * <RoleChangeConfirmation
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onConfirm={handleConfirm}
 *   user={userData}
 *   isPending={isUpdating}
 * />
 * ```
 */
export function RoleChangeConfirmation({
  open,
  onOpenChange,
  onConfirm,
  user,
  isPending = false
}: RoleChangeConfirmationProps) {
  if (!user) {
    return null
  }

  const isPromotingToAdmin = user.currentRole === 'user' && user.newRole === 'admin'
  const isDemotingFromAdmin = user.currentRole === 'admin' && user.newRole === 'user'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Confirm Role Change
          </DialogTitle>
          <DialogDescription>
            You are about to change the role for this user. Please review the changes carefully.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Information */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </span>
              </div>
              <div>
                <div className="font-medium">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {user.email}
                </div>
              </div>
            </div>
          </div>

          {/* Role Change Information */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Role Change:</div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                {user.currentRole === 'admin' ? (
                  <Shield className="h-4 w-4 text-blue-500" />
                ) : (
                  <User className="h-4 w-4 text-gray-500" />
                )}
                <span className="text-sm">Current Role:</span>
                <Badge variant={user.currentRole === 'admin' ? 'default' : 'secondary'}>
                  {user.currentRole === 'admin' ? 'Admin' : 'User'}
                </Badge>
              </div>
              <div className="text-muted-foreground">→</div>
              <div className="flex items-center gap-2">
                {user.newRole === 'admin' ? (
                  <Shield className="h-4 w-4 text-blue-500" />
                ) : (
                  <User className="h-4 w-4 text-gray-500" />
                )}
                <span className="text-sm">New Role:</span>
                <Badge variant={user.newRole === 'admin' ? 'default' : 'secondary'}>
                  {user.newRole === 'admin' ? 'Admin' : 'User'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {isPromotingToAdmin && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-blue-900">Promoting to Admin</div>
                  <div className="text-blue-700 mt-1">
                    This user will gain administrative privileges and access to sensitive features.
                  </div>
                </div>
              </div>
            </div>
          )}

          {isDemotingFromAdmin && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-amber-900">Demoting from Admin</div>
                  <div className="text-amber-700 mt-1">
                    This user will lose administrative privileges and access to admin-only features.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* General Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-amber-900">Important</div>
                <div className="text-amber-700 mt-1">
                  Role changes take effect immediately. The user may need to log out and log back in to see the changes.
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className={isPromotingToAdmin ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            {isPending ? 'Updating...' : 'Confirm Role Change'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
