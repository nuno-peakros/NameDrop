import { z } from 'zod'

/**
 * Input validation schemas using Zod
 * 
 * This module provides comprehensive validation schemas for:
 * - User authentication
 * - User management
 * - API request validation
 * - Error handling
 */

/**
 * Common validation patterns
 */
const commonPatterns = {
  /** Email validation pattern */
  email: z.string().email('Invalid email format'),
  
  /** Password validation pattern */
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number'),
  
  /** Name validation pattern */
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  
  /** UUID validation pattern */
  uuid: z.string().uuid('Invalid UUID format'),
  
  /** Pagination page validation */
  page: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 1)
    .refine((val) => val > 0, 'Page must be a positive number'),
  
  /** Pagination limit validation */
  limit: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 20)
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
} as const

/**
 * User role enum validation
 */
const userRoleSchema = z.enum(['user', 'admin'])

/**
 * Authentication schemas
 */
export const authSchemas = {
  /** Login request validation */
  login: z.object({
    email: commonPatterns.email,
    password: z.string().min(1, 'Password is required'),
  }),

  /** Register request validation (admin only) */
  register: z.object({
    firstName: commonPatterns.name,
    lastName: commonPatterns.name,
    email: commonPatterns.email,
    role: userRoleSchema,
  }),

  /** Email verification request validation */
  verifyEmail: z.object({
    token: z.string().min(1, 'Verification token is required'),
  }),

  /** Forgot password request validation */
  forgotPassword: z.object({
    email: commonPatterns.email,
  }),

  /** Reset password request validation */
  resetPassword: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: commonPatterns.password,
  }),

  /** Change password request validation */
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: commonPatterns.password,
  }),
} as const

/**
 * User management schemas
 */
export const userSchemas = {
  /** Create user request validation */
  createUser: z.object({
    firstName: commonPatterns.name,
    lastName: commonPatterns.name,
    email: commonPatterns.email,
    role: userRoleSchema,
  }),

  /** Update user request validation */
  updateUser: z.object({
    firstName: commonPatterns.name.optional(),
    lastName: commonPatterns.name.optional(),
    email: commonPatterns.email.optional(),
    role: userRoleSchema.optional(),
    isActive: z.boolean().optional(),
  }),

  /** User search filters validation */
  searchFilters: z.object({
    search: z.string().optional(),
    role: userRoleSchema.optional(),
    isActive: z
      .string()
      .optional()
      .transform((val) => val ? val === 'true' : undefined),
    emailVerified: z
      .string()
      .optional()
      .transform((val) => val ? val === 'true' : undefined),
  }),

  /** Pagination parameters validation */
  pagination: z.object({
    page: commonPatterns.page,
    limit: commonPatterns.limit,
  }),

  /** User ID parameter validation */
  userId: z.object({
    id: commonPatterns.uuid,
  }),
} as const

/**
 * API response schemas
 */
export const responseSchemas = {
  /** Success response schema */
  success: z.object({
    success: z.literal(true),
    data: z.any().optional(),
    message: z.string().optional(),
  }),

  /** Error response schema */
  error: z.object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.array(z.object({
        field: z.string(),
        message: z.string(),
      })).optional(),
      retryAfter: z.number().optional(),
    }),
  }),

  /** Validation error response schema */
  validationError: z.object({
    success: z.literal(false),
    error: z.object({
      code: z.literal('VALIDATION_ERROR'),
      message: z.string(),
      details: z.array(z.object({
        field: z.string(),
        message: z.string(),
      })),
    }),
  }),
} as const

/**
 * Health check schemas
 */
export const healthSchemas = {
  /** Health check response validation */
  healthResponse: z.object({
    success: z.boolean(),
    data: z.object({
      status: z.enum(['healthy', 'degraded', 'unhealthy']),
      timestamp: z.string(),
      version: z.string(),
      uptime: z.number(),
      services: z.object({
        database: z.object({
          status: z.enum(['healthy', 'degraded', 'unhealthy']),
          responseTime: z.number(),
          lastChecked: z.string(),
          error: z.string().optional(),
        }),
        email: z.object({
          status: z.enum(['healthy', 'degraded', 'unhealthy']),
          responseTime: z.number(),
          lastChecked: z.string(),
          error: z.string().optional(),
        }),
      }),
      metrics: z.object({
        activeUsers: z.number(),
        totalUsers: z.number(),
        requestsPerMinute: z.number(),
        averageResponseTime: z.number(),
      }).optional(),
      errors: z.array(z.string()).optional(),
    }),
  }),
} as const

/**
 * Validation error types
 */
export type ValidationError = {
  field: string
  message: string
}

export type ValidationResult<T> = {
  success: true
  data: T
} | {
  success: false
  errors: ValidationError[]
}

/**
 * Validate data against a schema
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const result = validateData(authSchemas.login, { email, password });
 * if (result.success) {
 *   console.log('Valid data:', result.data);
 * } else {
 *   console.log('Validation errors:', result.errors);
 * }
 * ```
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data)
    return {
      success: true,
      data: validatedData,
    }
    } catch (_error) {
    if (_error instanceof z.ZodError) {
      const errors: ValidationError[] = _error.issues.map((err: z.ZodIssue) => ({
        field: err.path.join('.'),
        message: err.message,
      }))
      
      return {
        success: false,
        errors,
      }
    }
    
    return {
      success: false,
      errors: [{
        field: 'unknown',
        message: 'Validation failed',
      }],
    }
  }
}

/**
 * Validate request body
 * 
 * @param schema - Zod schema to validate against
 * @param body - Request body
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const result = await validateRequestBody(authSchemas.login, request);
 * if (!result.success) {
 *   return NextResponse.json({ errors: result.errors }, { status: 400 });
 * }
 * ```
 */
export async function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  request: Request
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json()
    return validateData(schema, body)
    } catch {
    return {
      success: false,
      errors: [{
        field: 'body',
        message: 'Invalid JSON in request body',
      }],
    }
  }
}

/**
 * Validate query parameters
 * 
 * @param schema - Zod schema to validate against
 * @param searchParams - URL search parameters
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const result = validateQueryParams(userSchemas.searchFilters, searchParams);
 * if (result.success) {
 *   console.log('Valid filters:', result.data);
 * }
 * ```
 */
export function validateQueryParams<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): ValidationResult<T> {
  const params = Object.fromEntries(searchParams.entries())
  return validateData(schema, params)
}

/**
 * Validate path parameters
 * 
 * @param schema - Zod schema to validate against
 * @param params - Path parameters
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const result = validatePathParams(userSchemas.userId, { id: userId });
 * if (result.success) {
 *   console.log('Valid user ID:', result.data.id);
 * }
 * ```
 */
export function validatePathParams<T>(
  schema: z.ZodSchema<T>,
  params: Record<string, string>
): ValidationResult<T> {
  return validateData(schema, params)
}

/**
 * Create validation error response
 * 
 * @param errors - Validation errors
 * @returns NextResponse with validation error
 * 
 * @example
 * ```typescript
 * if (!validation.success) {
 *   return createValidationErrorResponse(validation.errors);
 * }
 * ```
 */
export function createValidationErrorResponse(errors: ValidationError[]) {
  return Response.json(
    {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: errors,
      },
    },
    { status: 400 }
  )
}

/**
 * Sanitize string input
 * 
 * @param input - String to sanitize
 * @returns Sanitized string
 * 
 * @example
 * ```typescript
 * const sanitized = sanitizeString(userInput);
 * ```
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000) // Limit length
}

/**
 * Validate email format
 * 
 * @param email - Email to validate
 * @returns True if email is valid
 * 
 * @example
 * ```typescript
 * if (isValidEmail(email)) {
 *   console.log('Valid email');
 * }
 * ```
 */
export function isValidEmail(email: string): boolean {
  try {
    commonPatterns.email.parse(email)
    return true
  } catch {
    return false
  }
}

/**
 * Validate password strength
 * 
 * @param password - Password to validate
 * @returns Password validation result
 * 
 * @example
 * ```typescript
 * const result = validatePasswordStrength(password);
 * if (!result.isValid) {
 *   console.log('Password errors:', result.errors);
 * }
 * ```
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  try {
    commonPatterns.password.parse(password)
    return { isValid: true, errors: [] }
    } catch (_error) {
    if (_error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: _error.issues.map((err: z.ZodIssue) => err.message),
      }
    }
    return { isValid: false, errors: ['Invalid password'] }
  }
}

/**
 * Get all available schemas
 * 
 * @returns Object containing all validation schemas
 * 
 * @example
 * ```typescript
 * const schemas = getAllSchemas();
 * console.log('Available schemas:', Object.keys(schemas));
 * ```
 */
export function getAllSchemas() {
  return {
    auth: authSchemas,
    users: userSchemas,
    responses: responseSchemas,
    health: healthSchemas,
  }
}
