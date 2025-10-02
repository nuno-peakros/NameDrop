'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Error boundary state interface
 */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Error boundary props interface
 */
interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: React.ReactNode
  /** Custom fallback component */
  fallback?: React.ComponentType<ErrorFallbackProps>
  /** Additional CSS classes */
  className?: string
  /** Whether to show error details in development */
  showErrorDetails?: boolean
  /** Custom error message */
  errorMessage?: string
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

/**
 * Error fallback component props
 */
interface ErrorFallbackProps {
  /** The error that occurred */
  error: Error | null
  /** Error information */
  errorInfo: React.ErrorInfo | null
  /** Function to reset the error boundary */
  resetError: () => void
  /** Whether to show error details */
  showErrorDetails?: boolean
  /** Custom error message */
  errorMessage?: string
}

/**
 * Default error fallback component
 * 
 * @param error - The error that occurred
 * @param errorInfo - Error information
 * @param resetError - Function to reset the error boundary
 * @param showErrorDetails - Whether to show error details
 * @param errorMessage - Custom error message
 * 
 * @returns JSX element
 */
function ErrorFallback({ 
  error, 
  errorInfo, 
  resetError, 
  showErrorDetails = false,
  errorMessage 
}: ErrorFallbackProps) {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-destructive" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
        </div>
        <CardTitle className="text-xl font-bold text-destructive">
          Something went wrong
        </CardTitle>
        <CardDescription>
          {errorMessage || 'An unexpected error occurred. Please try again.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showErrorDetails && error && (
          <div className="p-3 bg-muted rounded-md">
            <h4 className="font-medium text-sm mb-2">Error Details:</h4>
            <pre className="text-xs text-muted-foreground overflow-auto">
              {error.message}
            </pre>
            {errorInfo && (
              <details className="mt-2">
                <summary className="text-xs cursor-pointer hover:text-foreground">
                  Stack Trace
                </summary>
                <pre className="text-xs text-muted-foreground overflow-auto mt-1">
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={resetError} className="flex-1">
            Try Again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="flex-1"
          >
            Reload Page
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Error boundary class component for catching JavaScript errors
 * 
 * Features:
 * - Catches JavaScript errors anywhere in the component tree
 * - Logs errors for debugging
 * - Displays fallback UI instead of crashing
 * - Provides error reset functionality
 * - Customizable error display
 * 
 * @example
 * ```tsx
 * <ErrorBoundary onError={(error, errorInfo) => console.log(error)}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundaryClass extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  /**
   * Update state to trigger error UI
   * 
   * @param error - The error that occurred
   * @returns New state with error information
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  /**
   * Handle component error
   * 
   * @param error - The error that occurred
   * @param errorInfo - Additional error information
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Call custom error handler
    this.props.onError?.(error, errorInfo)
  }

  /**
   * Reset error boundary state
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ErrorFallback

      return (
        <div className={cn("min-h-[200px] flex items-center justify-center p-4", this.props.className)}>
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={this.resetError}
            showErrorDetails={this.props.showErrorDetails}
            errorMessage={this.props.errorMessage}
          />
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Error boundary hook for functional components
 * 
 * @param onError - Callback when error occurs
 * @returns Error boundary state and reset function
 * 
 * @example
 * ```tsx
 * const { hasError, error, resetError } = useErrorBoundary();
 * 
 * if (hasError) {
 *   return <ErrorFallback error={error} resetError={resetError} />;
 * }
 * ```
 */
function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return {
    hasError: !!error,
    error,
    resetError,
    captureError,
  }
}

/**
 * Error display component for showing error messages
 * 
 * @param error - Error message or Error object
 * @param className - Additional CSS classes
 * @param variant - Error display variant
 * @param props - Additional props
 * 
 * @example
 * ```tsx
 * <ErrorDisplay error="Something went wrong" variant="inline" />
 * <ErrorDisplay error={error} variant="card" />
 * ```
 */
interface ErrorDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Error message or Error object */
  error: string | Error | null
  /** Additional CSS classes */
  className?: string
  /** Error display variant */
  variant?: 'inline' | 'card' | 'banner'
  /** Whether to show error icon */
  showIcon?: boolean
}

function ErrorDisplay({ 
  error, 
  className, 
  variant = 'inline',
  showIcon = true,
  ...props 
}: ErrorDisplayProps) {
  if (!error) return null

  const errorMessage = typeof error === 'string' ? error : error.message

  if (variant === 'banner') {
    return (
      <div 
        className={cn(
          "bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md flex items-center gap-2",
          className
        )}
        {...props}
      >
        {showIcon && (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )}
        <span className="text-sm">{errorMessage}</span>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <Card className={cn("border-destructive/20", className)} {...props}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            {showIcon && (
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div 
      className={cn(
        "text-sm text-destructive flex items-center gap-1",
        className
      )}
      {...props}
    >
      {showIcon && (
        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )}
      <span>{errorMessage}</span>
    </div>
  )
}

export { 
  ErrorBoundaryClass as ErrorBoundary,
  ErrorFallback,
  useErrorBoundary,
  ErrorDisplay,
  type ErrorBoundaryProps,
  type ErrorFallbackProps,
  type ErrorDisplayProps
}
