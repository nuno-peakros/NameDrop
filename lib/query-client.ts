import { QueryClient } from '@tanstack/react-query'

/**
 * TanStack Query client configuration
 * 
 * This configuration optimizes data fetching with:
 * - Stale time management
 * - Cache time settings
 * - Retry logic
 * - Error handling
 * 
 * @example
 * ```typescript
 * import { queryClient } from '@/lib/query-client';
 * 
 * // Use in components
 * const { data, isLoading } = useQuery({
 *   queryKey: ['users'],
 *   queryFn: fetchUsers,
 * });
 * ```
 */
export const queryClient = new QueryClient({
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
