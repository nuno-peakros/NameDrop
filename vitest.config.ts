import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

/**
 * Vitest configuration for NameDrop testing
 * 
 * This configuration sets up:
 * - TypeScript support
 * - React testing utilities
 * - Path aliases
 * - Test environment setup
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup.ts'],
    globals: true,
    css: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
})
