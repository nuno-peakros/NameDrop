import '@testing-library/jest-dom'
import { vi } from 'vitest'

/**
 * Test setup file for Vitest
 * 
 * This file configures the testing environment with:
 * - Jest DOM matchers
 * - Global test utilities
 * - Mock configurations
 */

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
}))

// Mock Next.js session
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

// Mock environment variables
vi.mock('@/lib/config', () => ({
  config: {
    database: {
      url: 'postgresql://test:test@localhost:5432/test',
    },
    auth: {
      nextAuthUrl: 'http://localhost:3000',
      nextAuthSecret: 'test-secret',
      jwtSecret: 'test-jwt-secret',
    },
    email: {
      resendApiKey: 'test-resend-key',
    },
    app: {
      nodeEnv: 'test',
      isDevelopment: false,
      isProduction: false,
    },
  },
}))
