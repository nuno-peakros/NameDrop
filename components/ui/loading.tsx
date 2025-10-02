import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Loading spinner component with customizable size and styling
 * 
 * @param className - Additional CSS classes
 * @param size - Spinner size (sm, md, lg, xl)
 * @param variant - Spinner variant (default, dots, pulse)
 * @param props - Additional props passed to the container element
 * 
 * @example
 * ```tsx
 * <LoadingSpinner size="lg" className="text-primary" />
 * <LoadingSpinner variant="dots" size="md" />
 * ```
 */
interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes */
  className?: string
  /** Spinner size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Spinner style variant */
  variant?: 'default' | 'dots' | 'pulse'
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
} as const

function LoadingSpinner({ 
  className, 
  size = 'md', 
  variant = 'default',
  ...props 
}: LoadingSpinnerProps) {
  if (variant === 'dots') {
    return (
      <div 
        className={cn("flex space-x-1", className)} 
        {...props}
      >
        <div className={cn(
          "bg-current rounded-full animate-bounce",
          sizeMap[size]
        )} style={{ animationDelay: '0ms' }} />
        <div className={cn(
          "bg-current rounded-full animate-bounce",
          sizeMap[size]
        )} style={{ animationDelay: '150ms' }} />
        <div className={cn(
          "bg-current rounded-full animate-bounce",
          sizeMap[size]
        )} style={{ animationDelay: '300ms' }} />
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div 
        className={cn(
          "bg-current rounded-full animate-pulse",
          sizeMap[size],
          className
        )} 
        {...props}
      />
    )
  }

  return (
    <div 
      className={cn(
        "border-2 border-current border-t-transparent rounded-full animate-spin",
        sizeMap[size],
        className
      )} 
      {...props}
    />
  )
}

/**
 * Loading overlay component for covering content during loading
 * 
 * @param isLoading - Whether to show the loading overlay
 * @param children - Content to show behind the overlay
 * @param className - Additional CSS classes
 * @param props - Additional props passed to the overlay element
 * 
 * @example
 * ```tsx
 * <LoadingOverlay isLoading={isLoading}>
 *   <div>Content to be covered</div>
 * </LoadingOverlay>
 * ```
 */
interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to show the loading overlay */
  isLoading: boolean
  /** Content to show behind the overlay */
  children: React.ReactNode
  /** Additional CSS classes */
  className?: string
  /** Loading message */
  message?: string
}

function LoadingOverlay({ 
  isLoading, 
  children, 
  className,
  message = 'Loading...',
  ...props 
}: LoadingOverlayProps) {
  if (!isLoading) {
    return <>{children}</>
  }

  return (
    <div className={cn("relative", className)} {...props}>
      {children}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Loading skeleton component for placeholder content
 * 
 * @param className - Additional CSS classes
 * @param lines - Number of skeleton lines to show
 * @param props - Additional props passed to the container element
 * 
 * @example
 * ```tsx
 * <LoadingSkeleton lines={3} className="space-y-2" />
 * <LoadingSkeleton className="h-4 w-full" />
 * ```
 */
interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes */
  className?: string
  /** Number of skeleton lines to show */
  lines?: number
}

function LoadingSkeleton({ 
  className, 
  lines = 1,
  ...props 
}: LoadingSkeletonProps) {
  if (lines === 1) {
    return (
      <div 
        className={cn(
          "animate-pulse bg-muted rounded",
          className
        )} 
        {...props}
      />
    )
  }

  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <div 
          key={index}
          className="animate-pulse bg-muted rounded h-4"
          style={{ 
            width: index === lines - 1 ? '75%' : '100%' 
          }}
        />
      ))}
    </div>
  )
}

/**
 * Loading button component with integrated loading state
 * 
 * @param isLoading - Whether the button is in loading state
 * @param children - Button content
 * @param loadingText - Text to show when loading
 * @param className - Additional CSS classes
 * @param props - Additional props passed to the button element
 * 
 * @example
 * ```tsx
 * <LoadingButton isLoading={isSubmitting} loadingText="Saving...">
 *   Save Changes
 * </LoadingButton>
 * ```
 */
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether the button is in loading state */
  isLoading: boolean
  /** Button content */
  children: React.ReactNode
  /** Text to show when loading */
  loadingText?: string
  /** Additional CSS classes */
  className?: string
}

function LoadingButton({ 
  isLoading, 
  children, 
  loadingText,
  className,
  disabled,
  ...props 
}: LoadingButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <LoadingSpinner size="sm" />
      )}
      {isLoading ? loadingText || 'Loading...' : children}
    </button>
  )
}

export { 
  LoadingSpinner, 
  LoadingOverlay, 
  LoadingSkeleton, 
  LoadingButton,
  type LoadingSpinnerProps,
  type LoadingOverlayProps,
  type LoadingSkeletonProps,
  type LoadingButtonProps
}
