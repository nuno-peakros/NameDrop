/**
 * Application configuration with environment variable validation
 * 
 * This module centralizes all environment variable access and provides
 * type-safe configuration for the application.
 */

/**
 * Validates that a required environment variable is present
 * @param name - Environment variable name
 * @param defaultValue - Optional default value
 * @returns The environment variable value
 * @throws Error if required variable is missing
 */
function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue
  
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  
  return value
}

/**
 * Application configuration object
 * 
 * @example
 * ```typescript
 * import { config } from '@/lib/config';
 * 
 * const dbUrl = config.database.url;
 * const jwtSecret = config.auth.jwtSecret;
 * ```
 */
export const config = {
  /**
   * Database configuration
   */
  database: {
    url: process.env.DATABASE_URL || 'postgresql://nuno:H9gt78hw!!%%@34.77.17.133:5432/namedrop?schema=public',
  },

  /**
   * Authentication configuration
   */
  auth: {
    nextAuthUrl: getEnvVar('NEXTAUTH_URL', 'http://localhost:3000'),
    nextAuthSecret: getEnvVar('NEXTAUTH_SECRET'),
    jwtSecret: getEnvVar('JWT_SECRET'),
  },

  /**
   * Email service configuration
   */
  email: {
    resendApiKey: process.env.RESEND_API_KEY || 're_jLFzstS1_Pt85obZnAS9YA1adXMywrCm4',
  },

  /**
   * Application environment
   */
  app: {
    nodeEnv: getEnvVar('NODE_ENV', 'development'),
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },
} as const

/**
 * Environment variables documentation
 * 
 * Required environment variables:
 * - DATABASE_URL: PostgreSQL connection string
 * - NEXTAUTH_SECRET: Secret key for NextAuth.js
 * - JWT_SECRET: Secret key for JWT token signing
 * - RESEND_API_KEY: API key for Resend email service
 * 
 * Optional environment variables:
 * - NEXTAUTH_URL: Base URL for NextAuth.js (defaults to http://localhost:3000)
 * - NODE_ENV: Application environment (defaults to development)
 */
