'use client'

import * as React from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * User search component with debounced input
 * 
 * Features:
 * - Debounced search input
 * - Clear search functionality
 * - Loading states
 * - Accessibility support
 * - Customizable placeholder
 * 
 * @param onSearch - Callback when search term changes
 * @param placeholder - Search input placeholder
 * @param className - Additional CSS classes
 * @param disabled - Whether search is disabled
 * 
 * @example
 * ```tsx
 * <UserSearch 
 *   onSearch={(term) => setSearchTerm(term)}
 *   placeholder="Search users..."
 * />
 * ```
 */
interface UserSearchProps {
  /** Callback when search term changes */
  onSearch: (searchTerm: string) => void
  /** Search input placeholder */
  placeholder?: string
  /** Additional CSS classes */
  className?: string
  /** Whether search is disabled */
  disabled?: boolean
  /** Initial search value */
  defaultValue?: string
  /** Debounce delay in milliseconds */
  debounceMs?: number
}

function UserSearch({ 
  onSearch, 
  placeholder = "Search users...",
  className,
  disabled = false,
  defaultValue = '',
  debounceMs = 300
}: UserSearchProps) {
  const [searchTerm, setSearchTerm] = React.useState(defaultValue)
  const [isSearching, setIsSearching] = React.useState(false)

  /**
   * Debounced search effect
   */
  React.useEffect(() => {
    if (searchTerm === defaultValue) return

    setIsSearching(true)
    const timeoutId = setTimeout(() => {
      onSearch(searchTerm)
      setIsSearching(false)
    }, debounceMs)

    return () => {
      clearTimeout(timeoutId)
      setIsSearching(false)
    }
  }, [searchTerm, onSearch, debounceMs, defaultValue])

  /**
   * Handle search input change
   * 
   * @param event - Input change event
   */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  /**
   * Clear search input
   */
  const clearSearch = () => {
    setSearchTerm('')
    onSearch('')
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleSearchChange}
          disabled={disabled}
          className="pl-10 pr-10"
          aria-label="Search users"
        />
        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 hover:bg-muted"
            onClick={clearSearch}
            disabled={disabled}
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        {isSearching && (
          <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2">
            <div className="h-3 w-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Search results summary component
 * 
 * @param totalResults - Total number of results
 * @param searchTerm - Current search term
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <SearchResultsSummary 
 *   totalResults={25}
 *   searchTerm="john"
 * />
 * ```
 */
interface SearchResultsSummaryProps {
  /** Total number of results */
  totalResults: number
  /** Current search term */
  searchTerm: string
  /** Additional CSS classes */
  className?: string
}

function SearchResultsSummary({ 
  totalResults, 
  searchTerm, 
  className 
}: SearchResultsSummaryProps) {
  if (!searchTerm) return null

  return (
    <div className={cn("text-sm text-muted-foreground", className)}>
      {totalResults === 0 ? (
        <span>No results found for "{searchTerm}"</span>
      ) : (
        <span>
          {totalResults} result{totalResults !== 1 ? 's' : ''} found for "{searchTerm}"
        </span>
      )}
    </div>
  )
}

/**
 * Search suggestions component
 * 
 * @param suggestions - Array of search suggestions
 * @param onSuggestionClick - Callback when suggestion is clicked
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <SearchSuggestions 
 *   suggestions={['john@example.com', 'jane@example.com']}
 *   onSuggestionClick={(suggestion) => setSearchTerm(suggestion)}
 * />
 * ```
 */
interface SearchSuggestionsProps {
  /** Array of search suggestions */
  suggestions: string[]
  /** Callback when suggestion is clicked */
  onSuggestionClick: (suggestion: string) => void
  /** Additional CSS classes */
  className?: string
  /** Whether to show suggestions */
  show?: boolean
}

function SearchSuggestions({ 
  suggestions, 
  onSuggestionClick, 
  className,
  show = true
}: SearchSuggestionsProps) {
  if (!show || suggestions.length === 0) return null

  return (
    <div className={cn(
      "absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg",
      className
    )}>
      <div className="py-1">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
            onClick={() => onSuggestionClick(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}

export { 
  UserSearch, 
  SearchResultsSummary, 
  SearchSuggestions,
  type UserSearchProps,
  type SearchResultsSummaryProps,
  type SearchSuggestionsProps
}
