/**
 * Comprehensive Error Handling System for NameDrop
 * 
 * This module provides:
 * - Custom error classes for different error types
 * - Centralized error handling and formatting
 * - Error logging and monitoring integration
 * - User-friendly error responses
 * - Error recovery and retry mechanisms
 * 
 * @example
 * ```typescript
 * import { AppError, ErrorHandler, errorHandler } from '@/lib/error-handler';
 * 
 * // Throw custom error
 * throw new AppError('User not found', 'USER_NOT_FOUND', 404, { userId: '123' });
 * 
 * // Handle errors in API routes
 * export async function GET() {
 *   try {
 *     // API logic
 *   } catch (error) {
 *     return errorHandler.handle(error);
 *   }
 * }
 * ```
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  RATE_LIMIT = 'rate_limit',
  EXTERNAL_SERVICE = 'external_service',
  DATABASE = 'database',
  INTERNAL = 'internal',
  NETWORK = 'network',
}

/**
 * Base error interface
 */
export interface BaseError {
  name: string;
  message: string;
  code: string;
  statusCode: number;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context?: Record<string, any>;
  timestamp: string;
  requestId?: string;
  userId?: string;
  stack?: string;
  isOperational: boolean;
}

/**
 * Custom application error class
 */
export class AppError extends Error implements BaseError {
  public readonly name: string;
  public readonly code: string;
  public readonly statusCode: number;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly context?: Record<string, any>;
  public readonly timestamp: string;
  public readonly requestId?: string;
  public readonly userId?: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.INTERNAL,
    context?: Record<string, any>,
    requestId?: string,
    userId?: string
  ) {
    super(message);
    
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.severity = severity;
    this.category = category;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;
    this.userId = userId;
    this.isOperational = true;

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Convert error to JSON representation
   * 
   * @returns JSON representation of the error
   */
  toJSON(): BaseError {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      severity: this.severity,
      category: this.category,
      context: this.context,
      timestamp: this.timestamp,
      requestId: this.requestId,
      userId: this.userId,
      stack: this.stack,
      isOperational: this.isOperational,
    };
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    context?: Record<string, any>,
    requestId?: string,
    userId?: string
  ) {
    super(
      message,
      'VALIDATION_ERROR',
      400,
      ErrorSeverity.LOW,
      ErrorCategory.VALIDATION,
      context,
      requestId,
      userId
    );
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication failed',
    context?: Record<string, any>,
    requestId?: string,
    userId?: string
  ) {
    super(
      message,
      'AUTHENTICATION_ERROR',
      401,
      ErrorSeverity.MEDIUM,
      ErrorCategory.AUTHENTICATION,
      context,
      requestId,
      userId
    );
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = 'Insufficient permissions',
    context?: Record<string, any>,
    requestId?: string,
    userId?: string
  ) {
    super(
      message,
      'AUTHORIZATION_ERROR',
      403,
      ErrorSeverity.MEDIUM,
      ErrorCategory.AUTHORIZATION,
      context,
      requestId,
      userId
    );
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(
    resource: string,
    context?: Record<string, any>,
    requestId?: string,
    userId?: string
  ) {
    super(
      `${resource} not found`,
      'NOT_FOUND',
      404,
      ErrorSeverity.LOW,
      ErrorCategory.NOT_FOUND,
      { resource, ...context },
      requestId,
      userId
    );
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error class
 */
export class ConflictError extends AppError {
  constructor(
    message: string,
    context?: Record<string, any>,
    requestId?: string,
    userId?: string
  ) {
    super(
      message,
      'CONFLICT',
      409,
      ErrorSeverity.MEDIUM,
      ErrorCategory.CONFLICT,
      context,
      requestId,
      userId
    );
    this.name = 'ConflictError';
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter?: number,
    context?: Record<string, any>,
    requestId?: string,
    userId?: string
  ) {
    super(
      message,
      'RATE_LIMIT_EXCEEDED',
      429,
      ErrorSeverity.MEDIUM,
      ErrorCategory.RATE_LIMIT,
      { retryAfter, ...context },
      requestId,
      userId
    );
    this.name = 'RateLimitError';
  }
}

/**
 * External service error class
 */
export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string,
    context?: Record<string, any>,
    requestId?: string,
    userId?: string
  ) {
    super(
      `External service error: ${service} - ${message}`,
      'EXTERNAL_SERVICE_ERROR',
      502,
      ErrorSeverity.HIGH,
      ErrorCategory.EXTERNAL_SERVICE,
      { service, ...context },
      requestId,
      userId
    );
    this.name = 'ExternalServiceError';
  }
}

/**
 * Database error class
 */
export class DatabaseError extends AppError {
  constructor(
    message: string,
    context?: Record<string, any>,
    requestId?: string,
    userId?: string
  ) {
    super(
      `Database error: ${message}`,
      'DATABASE_ERROR',
      500,
      ErrorSeverity.HIGH,
      ErrorCategory.DATABASE,
      context,
      requestId,
      userId
    );
    this.name = 'DatabaseError';
  }
}

/**
 * Network error class
 */
export class NetworkError extends AppError {
  constructor(
    message: string,
    context?: Record<string, any>,
    requestId?: string,
    userId?: string
  ) {
    super(
      `Network error: ${message}`,
      'NETWORK_ERROR',
      503,
      ErrorSeverity.HIGH,
      ErrorCategory.NETWORK,
      context,
      requestId,
      userId
    );
    this.name = 'NetworkError';
  }
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  includeStack: boolean;
  logErrors: boolean;
  reportErrors: boolean;
  sanitizeErrors: boolean;
  retryableErrors: string[];
  maxRetries: number;
  retryDelay: number;
}

/**
 * Default error handler configuration
 */
const DEFAULT_CONFIG: ErrorHandlerConfig = {
  includeStack: process.env.NODE_ENV === 'development',
  logErrors: true,
  reportErrors: process.env.NODE_ENV === 'production',
  sanitizeErrors: process.env.NODE_ENV === 'production',
  retryableErrors: [
    'NETWORK_ERROR',
    'EXTERNAL_SERVICE_ERROR',
    'DATABASE_ERROR',
  ],
  maxRetries: 3,
  retryDelay: 1000,
};

/**
 * Error handler class
 */
export class ErrorHandler {
  private config: ErrorHandlerConfig;

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Handle an error and return appropriate response
   * 
   * @param error - Error to handle
   * @param requestId - Request identifier
   * @param userId - User identifier
   * @returns NextResponse with error details
   */
  handle(error: unknown, requestId?: string, userId?: string): NextResponse {
    const appError = this.normalizeError(error, requestId, userId);
    
    // Log the error
    if (this.config.logErrors) {
      this.logError(appError);
    }
    
    // Report error to monitoring service
    if (this.config.reportErrors) {
      this.reportError(appError);
    }
    
    // Create response
    return this.createErrorResponse(appError);
  }

  /**
   * Normalize any error to AppError
   * 
   * @param error - Error to normalize
   * @param requestId - Request identifier
   * @param userId - User identifier
   * @returns Normalized AppError
   */
  private normalizeError(error: unknown, requestId?: string, userId?: string): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError(
        error.message,
        'INTERNAL_ERROR',
        500,
        ErrorSeverity.HIGH,
        ErrorCategory.INTERNAL,
        { originalError: error.name },
        requestId,
        userId
      );
    }

    return new AppError(
      'An unexpected error occurred',
      'UNKNOWN_ERROR',
      500,
      ErrorSeverity.HIGH,
      ErrorCategory.INTERNAL,
      { originalError: String(error) },
      requestId,
      userId
    );
  }

  /**
   * Log error with appropriate level
   * 
   * @param error - Error to log
   */
  private logError(error: AppError): void {
    const logContext = {
      code: error.code,
      statusCode: error.statusCode,
      severity: error.severity,
      category: error.category,
      context: error.context,
      requestId: error.requestId,
      userId: error.userId,
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        logger.error(error.message, error, logContext, error.requestId, error.userId);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(error.message, logContext, error.requestId, error.userId);
        break;
      case ErrorSeverity.LOW:
        logger.info(error.message, logContext, error.requestId, error.userId);
        break;
    }
  }

  /**
   * Report error to monitoring service
   * 
   * @param error - Error to report
   */
  private reportError(error: AppError): void {
    // TODO: Integrate with monitoring service (e.g., Sentry, DataDog)
    // For now, just log the error for reporting
    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
      logger.error('Error reported to monitoring service', error, {
        code: error.code,
        severity: error.severity,
        category: error.category,
      });
    }
  }

  /**
   * Create error response for client
   * 
   * @param error - Error to respond with
   * @returns NextResponse with error details
   */
  private createErrorResponse(error: AppError): NextResponse {
    const response: any = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };

    // Add additional details in development
    if (!this.config.sanitizeErrors) {
      response.error.details = {
        statusCode: error.statusCode,
        severity: error.severity,
        category: error.category,
        timestamp: error.timestamp,
      };

      if (this.config.includeStack && error.stack) {
        response.error.stack = error.stack;
      }

      if (error.context && Object.keys(error.context).length > 0) {
        response.error.context = error.context;
      }
    }

    return NextResponse.json(response, { status: error.statusCode });
  }

  /**
   * Check if error is retryable
   * 
   * @param error - Error to check
   * @returns True if error is retryable
   */
  isRetryable(error: AppError): boolean {
    return this.config.retryableErrors.includes(error.code);
  }

  /**
   * Get retry delay for error
   * 
   * @param error - Error to get delay for
   * @param attempt - Current attempt number
   * @returns Delay in milliseconds
   */
  getRetryDelay(error: AppError, attempt: number): number {
    if (!this.isRetryable(error)) {
      return 0;
    }

    // Exponential backoff with jitter
    const baseDelay = this.config.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }
}

/**
 * Default error handler instance
 */
export const errorHandler = new ErrorHandler();

/**
 * Async error wrapper for API routes
 * 
 * @param handler - Async function to wrap
 * @returns Wrapped function with error handling
 * 
 * @example
 * ```typescript
 * export const GET = withErrorHandling(async (request: NextRequest) => {
 *   // API logic here
 *   return NextResponse.json({ data: 'success' });
 * });
 * ```
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Extract request info if available
      const request = args.find(arg => arg && typeof arg === 'object' && 'nextUrl' in arg);
      const requestId = request?.headers?.get('x-request-id');
      const userId = request?.headers?.get('x-user-id');
      
      return errorHandler.handle(error, requestId, userId);
    }
  };
}

/**
 * Create error response for specific error types
 * 
 * @param error - Error to create response for
 * @returns NextResponse with error
 */
export function createErrorResponse(error: AppError): NextResponse {
  return errorHandler.handle(error);
}

/**
 * Utility function to create common errors
 */
export const createErrors = {
  /**
   * Create validation error
   */
  validation: (message: string, context?: Record<string, any>, requestId?: string, userId?: string) =>
    new ValidationError(message, context, requestId, userId),

  /**
   * Create authentication error
   */
  authentication: (message?: string, context?: Record<string, any>, requestId?: string, userId?: string) =>
    new AuthenticationError(message, context, requestId, userId),

  /**
   * Create authorization error
   */
  authorization: (message?: string, context?: Record<string, any>, requestId?: string, userId?: string) =>
    new AuthorizationError(message, context, requestId, userId),

  /**
   * Create not found error
   */
  notFound: (resource: string, context?: Record<string, any>, requestId?: string, userId?: string) =>
    new NotFoundError(resource, context, requestId, userId),

  /**
   * Create conflict error
   */
  conflict: (message: string, context?: Record<string, any>, requestId?: string, userId?: string) =>
    new ConflictError(message, context, requestId, userId),

  /**
   * Create rate limit error
   */
  rateLimit: (message?: string, retryAfter?: number, context?: Record<string, any>, requestId?: string, userId?: string) =>
    new RateLimitError(message, retryAfter, context, requestId, userId),

  /**
   * Create external service error
   */
  externalService: (service: string, message: string, context?: Record<string, any>, requestId?: string, userId?: string) =>
    new ExternalServiceError(service, message, context, requestId, userId),

  /**
   * Create database error
   */
  database: (message: string, context?: Record<string, any>, requestId?: string, userId?: string) =>
    new DatabaseError(message, context, requestId, userId),

  /**
   * Create network error
   */
  network: (message: string, context?: Record<string, any>, requestId?: string, userId?: string) =>
    new NetworkError(message, context, requestId, userId),
};

export default errorHandler;
