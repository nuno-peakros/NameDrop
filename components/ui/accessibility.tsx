'use client'

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { 
  FocusManager, 
  ScreenReader, 
  // KeyboardNavigation, 
  generateAriaId,
  // getAccessibleName 
} from '@/lib/accessibility'

/**
 * Skip link component for keyboard navigation
 */
export function SkipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
      onClick={(e) => {
        e.preventDefault()
        const target = document.querySelector(href)
        if (target) {
          target.scrollIntoView()
          ;(target as HTMLElement).focus()
        }
      }}
    >
      {children}
    </a>
  )
}

/**
 * Screen reader only text component
 */
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only" aria-live="polite">
      {children}
    </span>
  )
}

/**
 * Focus trap component
 */
export function FocusTrap({ 
  children, 
  active = true, 
  onEscape 
}: { 
  children: React.ReactNode
  active?: boolean
  onEscape?: () => void 
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active || !containerRef.current) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onEscape) {
        onEscape()
        return
      }
      
      FocusManager.trapFocus(containerRef.current!, event)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [active, onEscape])

  useEffect(() => {
    if (active && containerRef.current) {
      FocusManager.focusFirst(containerRef.current)
    }
  }, [active])

  return (
    <div ref={containerRef} className="focus-trap">
      {children}
    </div>
  )
}

/**
 * Accessible button component
 */
export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  variant = 'default',
  size = 'default',
  className,
  ariaLabel,
  ariaDescribedBy,
  ...props
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  ariaLabel?: string
  ariaDescribedBy?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [isPressed, setIsPressed] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsPressed(true)
      onClick?.()
    }
  }

  const handleKeyUp = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsPressed(false)
    }
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
          'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
          'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
          'text-primary underline-offset-4 hover:underline': variant === 'link',
          'h-10 px-4 py-2': size === 'default',
          'h-9 rounded-md px-3': size === 'sm',
          'h-11 rounded-md px-8': size === 'lg',
          'h-10 w-10': size === 'icon',
        },
        className
      )}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-pressed={isPressed}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Accessible input component
 */
export function AccessibleInput({
  label,
  error,
  description,
  required = false,
  className,
  ...props
}: {
  label: string
  error?: string
  description?: string
  required?: boolean
  className?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const inputId = generateAriaId('input')
  const errorId = generateAriaId('error')
  const descriptionId = generateAriaId('description')

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      
      <input
        id={inputId}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        aria-describedby={cn(descriptionId, errorId)}
        aria-invalid={!!error}
        aria-required={required}
        {...props}
      />
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Accessible modal component
 */
export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  className
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}) {
  const modalRef = useRef<HTMLDivElement>(null)
  const titleId = generateAriaId('modal-title')
  const descriptionId = generateAriaId('modal-description')

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      ScreenReader.announce(`Modal opened: ${title}`)
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, title])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <FocusTrap active={isOpen} onEscape={onClose}>
        <div
          ref={modalRef}
          className={cn(
            'relative bg-background rounded-lg shadow-lg max-w-lg w-full mx-4 p-6',
            className
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            <AccessibleButton
              variant="ghost"
              size="icon"
              onClick={onClose}
              ariaLabel="Close modal"
            >
              <span className="sr-only">Close</span>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </AccessibleButton>
          </div>
          
          <div id={descriptionId}>
            {children}
          </div>
        </div>
      </FocusTrap>
    </div>
  )
}

/**
 * Accessible table component
 */
export function AccessibleTable({
  caption,
  children,
  className
}: {
  caption: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn('w-full border-collapse', className)}
        role="table"
        aria-label={caption}
      >
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  )
}

/**
 * Accessible table header component
 */
export function AccessibleTableHeader({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <thead className={cn('bg-muted', className)}>
      {children}
    </thead>
  )
}

/**
 * Accessible table row component
 */
export function AccessibleTableRow({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <tr className={cn('border-b', className)} role="row">
      {children}
    </tr>
  )
}

/**
 * Accessible table header cell component
 */
export function AccessibleTableHeaderCell({
  children,
  className,
  sortable = false,
  onSort
}: {
  children: React.ReactNode
  className?: string
  sortable?: boolean
  onSort?: () => void
}) {
  return (
    <th
      className={cn(
        'px-4 py-2 text-left font-medium',
        sortable && 'cursor-pointer hover:bg-muted/50',
        className
      )}
      role="columnheader"
      tabIndex={sortable ? 0 : -1}
      onClick={sortable ? onSort : undefined}
      onKeyDown={sortable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSort?.()
        }
      } : undefined}
    >
      {children}
      {sortable && (
        <span className="ml-2" aria-hidden="true">
          ↕️
        </span>
      )}
    </th>
  )
}

/**
 * Accessible table cell component
 */
export function AccessibleTableCell({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <td className={cn('px-4 py-2', className)} role="cell">
      {children}
    </td>
  )
}

/**
 * Accessible loading spinner component
 */
export function AccessibleLoadingSpinner({
  label = 'Loading',
  size = 'default'
}: {
  label?: string
  size?: 'sm' | 'default' | 'lg'
}) {
  return (
    <div
      className="flex items-center justify-center"
      role="status"
      aria-label={label}
    >
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-current border-t-transparent',
          {
            'h-4 w-4': size === 'sm',
            'h-6 w-6': size === 'default',
            'h-8 w-8': size === 'lg',
          }
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}

/**
 * Accessible progress bar component
 */
export function AccessibleProgressBar({
  value,
  max = 100,
  label,
  className
}: {
  value: number
  max?: number
  label?: string
  className?: string
}) {
  const percentage = Math.round((value / max) * 100)
  const progressId = generateAriaId('progress')

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex justify-between text-sm font-medium mb-1">
          <span>{label}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div
        className="w-full bg-secondary rounded-full h-2"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-labelledby={label ? progressId : undefined}
      >
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {label && <div id={progressId} className="sr-only">{label}</div>}
    </div>
  )
}
