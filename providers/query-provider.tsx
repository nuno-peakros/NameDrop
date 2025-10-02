'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

/**
 * TanStack Query provider component
 * 
 * This provider wraps the application with TanStack Query functionality
 * and includes development tools for debugging.
 * 
 * @param children - React children components
 * @returns Query provider wrapper
 * 
 * @example
 * ```tsx
 * import { QueryProvider } from '@/providers/query-provider';
 * 
 * function App() {
 *   return (
 *     <QueryProvider>
 *       <YourApp />
 *     </QueryProvider>
 *   );
 * }
 * ```
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create query client instance
  // Using useState to ensure client is created only once
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          // Data is considered fresh for 5 minutes
          staleTime: 5 * 60 * 1000,
          
          // Cache data for 10 minutes after last use
          gcTime: 10 * 60 * 1000,
          
          // Retry failed requests up to 3 times
          retry: 3,
          
          // Retry delay with exponential backoff
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          
          // Refetch on window focus in production
          refetchOnWindowFocus: process.env.NODE_ENV === 'production',
          
          // Refetch on reconnect
          refetchOnReconnect: true,
        },
        mutations: {
          // Retry failed mutations once
          retry: 1,
          
          // Retry delay for mutations
          retryDelay: 1000,
        },
      },
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
