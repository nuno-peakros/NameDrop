'use client'

import * as React from 'react'
import { Filter, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

/**
 * Filter option interface
 */
interface FilterOption {
  /** Filter value */
  value: string
  /** Filter label */
  label: string
  /** Number of items matching this filter */
  count?: number
}

/**
 * Active filter interface
 */
interface ActiveFilter {
  /** Filter key */
  key: string
  /** Filter value */
  value: string
  /** Filter label */
  label: string
}

/**
 * User filters component with multiple filter types
 * 
 * Features:
 * - Role-based filtering
 * - Status filtering (active/inactive)
 * - Email verification filtering
 * - Date range filtering
 * - Active filter display
 * - Clear all filters functionality
 * - Responsive design
 * 
 * @param filters - Current filter values
 * @param onFiltersChange - Callback when filters change
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <UserFilters 
 *   filters={{ role: 'admin', isActive: true }}
 *   onFiltersChange={(filters) => setFilters(filters)}
 * />
 * ```
 */
interface UserFiltersProps {
  /** Current filter values */
  filters: Record<string, string | boolean | undefined>
  /** Callback when filters change */
  onFiltersChange: (filters: Record<string, string | boolean | undefined>) => void
  /** Additional CSS classes */
  className?: string
  /** Available role options */
  roleOptions?: FilterOption[]
  /** Whether to show advanced filters */
  showAdvanced?: boolean
}

function UserFilters({ 
  filters, 
  onFiltersChange, 
  className,
  roleOptions = [
    { value: 'all', label: 'All Roles', count: 0 },
    { value: 'admin', label: 'Admin', count: 0 },
    { value: 'user', label: 'User', count: 0 },
  ],
  showAdvanced = false
}: UserFiltersProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  /**
   * Handle filter change
   * 
   * @param key - Filter key
   * @param value - Filter value
   */
  const handleFilterChange = (key: string, value: string | boolean) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' || value === '' ? undefined : value,
    })
  }

  /**
   * Clear specific filter
   * 
   * @param key - Filter key to clear
   */
  const clearFilter = (key: string) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    onFiltersChange(newFilters)
  }

  /**
   * Clear all filters
   */
  const clearAllFilters = () => {
    onFiltersChange({})
  }

  /**
   * Get active filters
   */
  const activeFilters: ActiveFilter[] = Object.entries(filters)
    .filter(([_, value]) => value !== undefined && value !== '')
    .map(([key, value]) => ({
      key,
      value: String(value),
      label: getFilterLabel(key, String(value)),
    }))

  /**
   * Get filter label for display
   * 
   * @param key - Filter key
   * @param value - Filter value
   * @returns Display label
   */
  function getFilterLabel(key: string, value: string): string {
    switch (key) {
      case 'role':
        return roleOptions.find(option => option.value === value)?.label || value
      case 'isActive':
        return value === 'true' ? 'Active' : 'Inactive'
      case 'emailVerified':
        return value === 'true' ? 'Verified' : 'Unverified'
      case 'dateRange':
        return `Date: ${value}`
      default:
        return `${key}: ${value}`
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilters.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilters.length}
              </Badge>
            )}
          </CardTitle>
          {showAdvanced && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-180"
              )} />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Active filters */}
        {activeFilters.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Filters</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                Clear all
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <Badge
                  key={`${filter.key}-${filter.value}`}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {filter.label}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => clearFilter(filter.key)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Filter controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Role filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select
              value={filters.role || 'all'}
              onValueChange={(value) => handleFilterChange('role', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      {option.count !== undefined && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {option.count}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={filters.isActive === undefined ? 'all' : String(filters.isActive)}
              onValueChange={(value) => handleFilterChange('isActive', value === 'true')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Email verification filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Verification</label>
            <Select
              value={filters.emailVerified === undefined ? 'all' : String(filters.emailVerified)}
              onValueChange={(value) => handleFilterChange('emailVerified', value === 'true')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Verified</SelectItem>
                <SelectItem value="false">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced filters */}
        {showAdvanced && isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-medium">Advanced Filters</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date range filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select
                  value={filters.dateRange || 'all'}
                  onValueChange={(value) => handleFilterChange('dateRange', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort order */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <Select
                  value={filters.sortBy || 'name'}
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sort order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="createdAt">Created Date</SelectItem>
                    <SelectItem value="lastLogin">Last Login</SelectItem>
                    <SelectItem value="role">Role</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Quick filter chips component
 * 
 * @param filters - Available quick filters
 * @param activeFilters - Currently active filters
 * @param onFilterToggle - Callback when filter is toggled
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <QuickFilters 
 *   filters={quickFilterOptions}
 *   activeFilters={activeFilters}
 *   onFilterToggle={(filter) => toggleFilter(filter)}
 * />
 * ```
 */
interface QuickFiltersProps {
  /** Available quick filters */
  filters: FilterOption[]
  /** Currently active filters */
  activeFilters: string[]
  /** Callback when filter is toggled */
  onFilterToggle: (filterValue: string) => void
  /** Additional CSS classes */
  className?: string
}

function QuickFilters({ 
  filters, 
  activeFilters, 
  onFilterToggle, 
  className 
}: QuickFiltersProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={activeFilters.includes(filter.value) ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterToggle(filter.value)}
          className="flex items-center gap-2"
        >
          {filter.label}
          {filter.count !== undefined && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {filter.count}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  )
}

export { 
  UserFilters, 
  QuickFilters,
  type UserFiltersProps,
  type QuickFiltersProps,
  type FilterOption,
  type ActiveFilter
}
