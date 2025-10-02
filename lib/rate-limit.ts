import { NextRequest, NextResponse } from 'next/server'

/**
 * Rate limiting service for API protection
 * 
 * This service provides:
 * - In-memory rate limiting (for single instance)
 * - IP-based rate limiting
 * - Endpoint-specific rate limits
 * - Configurable time windows
 * - Rate limit headers
 */

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  /** Maximum number of requests allowed */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
  /** Message to return when rate limit is exceeded */
  message?: string
  /** Whether to include rate limit headers */
  includeHeaders?: boolean
}

/**
 * Rate limit entry for tracking requests
 */
interface RateLimitEntry {
  count: number
  resetTime: number
}

/**
 * In-memory store for rate limiting (in production, use Redis)
 */
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Default rate limit configurations for different endpoints
 */
const RATE_LIMIT_CONFIGS = {
  /** Login attempts - 50 per 15 minutes (increased for development) */
  login: {
    maxRequests: 50,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many login attempts. Please try again later.',
  },
  /** Password reset - 3 per hour */
  passwordReset: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many password reset attempts. Please try again later.',
  },
  /** General API - 100 per 15 minutes */
  api: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many requests. Please try again later.',
  },
  /** Health check - 100 per minute */
  health: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many health check requests.',
  },
} as const

/**
 * Clean up expired rate limit entries
 * 
 * @param now - Current timestamp
 */
function cleanupExpiredEntries(now: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime <= now) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Get client identifier for rate limiting
 * 
 * @param request - Next.js request object
 * @returns Client identifier (IP address or user ID)
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from headers (for production with proxy)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown'
  
  return ip
}

/**
 * Check if request is within rate limit
 * 
 * @param identifier - Client identifier
 * @param config - Rate limit configuration
 * @returns Rate limit check result
 */
function checkRateLimit(identifier: string, config: RateLimitConfig): {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
} {
  const now = Date.now()
  const key = `${identifier}:${config.windowMs}`
  
  // Clean up expired entries periodically
  if (Math.random() < 0.1) { // 10% chance
    cleanupExpiredEntries(now)
  }
  
  const entry = rateLimitStore.get(key)
  
  if (!entry) {
    // First request
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    }
  }
  
  if (entry.resetTime <= now) {
    // Window expired, reset
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    }
  }
  
  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    }
  }
  
  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Create rate limit headers
 * 
 * @param result - Rate limit check result
 * @param config - Rate limit configuration
 * @returns Headers object
 */
function createRateLimitHeaders(
  result: ReturnType<typeof checkRateLimit>,
  config: RateLimitConfig
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  }
  
  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString()
  }
  
  return headers
}

/**
 * Apply rate limiting to a request
 * 
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @returns Next.js response or null if allowed
 * 
 * @example
 * ```typescript
 * const response = await applyRateLimit(request, RATE_LIMIT_CONFIGS.login);
 * if (response) {
 *   return response; // Rate limit exceeded
 * }
 * // Continue with request processing
 * ```
 */
export function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const identifier = getClientIdentifier(request)
  const result = checkRateLimit(identifier, config)
  
  if (!result.allowed) {
    const headers = createRateLimitHeaders(result, config)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: config.message || 'Too many requests',
          retryAfter: result.retryAfter,
        },
      },
      {
        status: 429,
        headers,
      }
    )
  }
  
  return null
}

/**
 * Rate limiting middleware factory
 * 
 * @param config - Rate limit configuration
 * @returns Middleware function
 * 
 * @example
 * ```typescript
 * const loginRateLimit = createRateLimitMiddleware(RATE_LIMIT_CONFIGS.login);
 * 
 * export async function middleware(request: NextRequest) {
 *   const response = await loginRateLimit(request);
 *   if (response) return response;
 *   
 *   // Continue with request
 * }
 * ```
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    return applyRateLimit(request, config)
  }
}

/**
 * Get rate limit status for a client
 * 
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @returns Rate limit status
 * 
 * @example
 * ```typescript
 * const status = getRateLimitStatus(request, RATE_LIMIT_CONFIGS.api);
 * console.log('Remaining requests:', status.remaining);
 * ```
 */
export function getRateLimitStatus(
  request: NextRequest,
  config: RateLimitConfig
): {
  remaining: number
  resetTime: number
  limit: number
} {
  const identifier = getClientIdentifier(request)
  const result = checkRateLimit(identifier, config)
  
  return {
    remaining: result.remaining,
    resetTime: result.resetTime,
    limit: config.maxRequests,
  }
}

/**
 * Reset rate limit for a client
 * 
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @returns True if reset successful
 * 
 * @example
 * ```typescript
 * const reset = await resetRateLimit(request, RATE_LIMIT_CONFIGS.login);
 * if (reset) {
 *   console.log('Rate limit reset for client');
 * }
 * ```
 */
export function resetRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): boolean {
  try {
    const identifier = getClientIdentifier(request)
    const key = `${identifier}:${config.windowMs}`
    
    rateLimitStore.delete(key)
    return true
  } catch (error) {
    console.error('Reset rate limit error:', error)
    return false
  }
}

/**
 * Get all rate limit configurations
 * 
 * @returns All available rate limit configurations
 */
export function getRateLimitConfigs() {
  return RATE_LIMIT_CONFIGS
}

/**
 * Create custom rate limit configuration
 * 
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @param message - Custom message
 * @returns Rate limit configuration
 * 
 * @example
 * ```typescript
 * const customConfig = createRateLimitConfig(10, 60000, 'Custom rate limit');
 * const response = await applyRateLimit(request, customConfig);
 * ```
 */
export function createRateLimitConfig(
  maxRequests: number,
  windowMs: number,
  message?: string
): RateLimitConfig {
  return {
    maxRequests,
    windowMs,
    message,
    includeHeaders: true,
  }
}

/**
 * Check if rate limiting is enabled
 * 
 * @returns True if rate limiting is enabled
 */
export function isRateLimitingEnabled(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.ENABLE_RATE_LIMITING === 'true'
}

/**
 * Get rate limit statistics
 * 
 * @returns Rate limit store statistics
 * 
 * @example
 * ```typescript
 * const stats = getRateLimitStats();
 * console.log('Active rate limits:', stats.activeEntries);
 * ```
 */
export function getRateLimitStats(): {
  activeEntries: number
  totalRequests: number
  oldestEntry: number | null
} {
  const now = Date.now()
  let totalRequests = 0
  let oldestEntry: number | null = null
  
  for (const entry of rateLimitStore.values()) {
    totalRequests += entry.count
    if (!oldestEntry || entry.resetTime < oldestEntry) {
      oldestEntry = entry.resetTime
    }
  }
  
  return {
    activeEntries: rateLimitStore.size,
    totalRequests,
    oldestEntry,
  }
}

/**
 * Clear all rate limit entries
 * 
 * @returns Number of entries cleared
 * 
 * @example
 * ```typescript
 * const cleared = clearAllRateLimits();
 * console.log(`Cleared ${cleared} rate limit entries`);
 * ```
 */
export function clearAllRateLimits(): number {
  const count = rateLimitStore.size
  rateLimitStore.clear()
  return count
}
