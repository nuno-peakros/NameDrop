/**
 * Comprehensive Logging System for NameDrop
 * 
 * This module provides structured logging capabilities including:
 * - Multiple log levels (debug, info, warn, error)
 * - Request/response logging for API routes
 * - User action logging for audit trails
 * - Performance metrics logging
 * - Error tracking and reporting
 * - Configurable output formats (console, JSON)
 * 
 * @example
 * ```typescript
 * import { logger } from '@/lib/logger';
 * 
 * // Basic logging
 * logger.info('User logged in', { userId: '123', email: 'user@example.com' });
 * logger.error('Database connection failed', { error: error.message });
 * 
 * // Request logging
 * logger.logRequest('POST', '/api/users', 201, 150);
 * 
 * // User action logging
 * logger.logUserAction('user.create', '123', { email: 'new@example.com' });
 * ```
 */

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, unknown>;
  requestId?: string;
  userId?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Request logging data
 */
export interface RequestLogData {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userAgent?: string;
  ip?: string;
  userId?: string;
}

/**
 * User action logging data
 */
export interface UserActionLogData {
  action: string;
  userId: string;
  details?: Record<string, unknown>;
  resourceId?: string;
  resourceType?: string;
}

/**
 * Performance metrics data
 */
export interface PerformanceLogData {
  operation: string;
  duration: number;
  memoryUsage?: NodeJS.MemoryUsage;
  context?: Record<string, unknown>;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableJson: boolean;
  enableRequestLogging: boolean;
  enableUserActionLogging: boolean;
  enablePerformanceLogging: boolean;
  maxContextDepth: number;
  sensitiveFields: string[];
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableJson: process.env.NODE_ENV === 'production',
  enableRequestLogging: true,
  enableUserActionLogging: true,
  enablePerformanceLogging: process.env.NODE_ENV === 'development',
  maxContextDepth: 3,
  sensitiveFields: ['password', 'passwordHash', 'token', 'secret', 'key'],
};

/**
 * Current logger configuration
 */
let config: LoggerConfig = { ...DEFAULT_CONFIG };

/**
 * Set logger configuration
 * 
 * @param newConfig - Partial configuration to merge
 * 
 * @example
 * ```typescript
 * logger.setConfig({
 *   level: LogLevel.ERROR,
 *   enableConsole: false,
 *   enableJson: true
 * });
 * ```
 */
export function setLoggerConfig(newConfig: Partial<LoggerConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Get current logger configuration
 * 
 * @returns Current logger configuration
 */
export function getLoggerConfig(): LoggerConfig {
  return { ...config };
}

/**
 * Generate a unique request ID
 * 
 * @returns Unique request identifier
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize sensitive data from context
 * 
 * @param context - Context object to sanitize
 * @param depth - Current recursion depth
 * @returns Sanitized context object
 */
function sanitizeContext(context: unknown, depth: number = 0): unknown {
  if (depth > config.maxContextDepth) {
    return '[Max depth reached]';
  }

  if (context === null || context === undefined) {
    return context;
  }

  if (typeof context === 'string' || typeof context === 'number' || typeof context === 'boolean') {
    return context;
  }

  if (Array.isArray(context)) {
    return context.map(item => sanitizeContext(item, depth + 1));
  }

  if (typeof context === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(context)) {
      if (config.sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeContext(value, depth + 1);
      }
    }
    return sanitized;
  }

  return context;
}

/**
 * Format log entry for console output
 * 
 * @param entry - Log entry to format
 * @returns Formatted log string
 */
function formatConsoleLog(entry: LogEntry): string {
  const timestamp = new Date(entry.timestamp).toISOString();
  const level = entry.level.toUpperCase().padEnd(5);
  const requestId = entry.requestId ? `[${entry.requestId}] ` : '';
  const userId = entry.userId ? `[user:${entry.userId}] ` : '';
  const duration = entry.duration ? ` (${entry.duration}ms)` : '';
  
  let output = `${timestamp} ${level} ${requestId}${userId}${entry.message}${duration}`;
  
  if (entry.context && Object.keys(entry.context).length > 0) {
    output += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
  }
  
  if (entry.error) {
    output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
    if (entry.error.stack) {
      output += `\n  Stack: ${entry.error.stack}`;
    }
  }
  
  return output;
}

/**
 * Create a log entry
 * 
 * @param level - Log level
 * @param message - Log message
 * @param context - Additional context data
 * @param requestId - Request identifier
 * @param userId - User identifier
 * @param duration - Operation duration in milliseconds
 * @param error - Error object
 * @returns Log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  requestId?: string,
  userId?: string,
  duration?: number,
  error?: Error
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: LogLevel[level].toLowerCase(),
    message,
    requestId,
    userId,
    duration,
  };

  if (context) {
    entry.context = sanitizeContext(context) as Record<string, unknown>;
  }

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return entry;
}

/**
 * Write log entry to output
 * 
 * @param entry - Log entry to write
 */
function writeLog(entry: LogEntry): void {
  if (config.enableConsole) {
    const consoleOutput = formatConsoleLog(entry);
    console.log(consoleOutput);
  }

  if (config.enableJson) {
    console.log(JSON.stringify(entry));
  }
}

/**
 * Check if log level should be written
 * 
 * @param level - Log level to check
 * @returns True if should be written
 */
function shouldLog(level: LogLevel): boolean {
  return level >= config.level;
}

/**
 * Main logger class
 */
class Logger {
  /**
   * Log debug message
   * 
   * @param message - Log message
   * @param context - Additional context data
   * @param requestId - Request identifier
   * @param userId - User identifier
   * 
   * @example
   * ```typescript
   * logger.debug('Processing user data', { userId: '123', step: 'validation' });
   * ```
   */
  debug(
    message: string,
    context?: Record<string, unknown>,
    requestId?: string,
    userId?: string
  ): void {
    if (!shouldLog(LogLevel.DEBUG)) return;
    
    const entry = createLogEntry(LogLevel.DEBUG, message, context, requestId, userId);
    writeLog(entry);
  }

  /**
   * Log info message
   * 
   * @param message - Log message
   * @param context - Additional context data
   * @param requestId - Request identifier
   * @param userId - User identifier
   * 
   * @example
   * ```typescript
   * logger.info('User created successfully', { userId: '123', email: 'user@example.com' });
   * ```
   */
  info(
    message: string,
    context?: Record<string, unknown>,
    requestId?: string,
    userId?: string
  ): void {
    if (!shouldLog(LogLevel.INFO)) return;
    
    const entry = createLogEntry(LogLevel.INFO, message, context, requestId, userId);
    writeLog(entry);
  }

  /**
   * Log warning message
   * 
   * @param message - Log message
   * @param context - Additional context data
   * @param requestId - Request identifier
   * @param userId - User identifier
   * 
   * @example
   * ```typescript
   * logger.warn('Rate limit exceeded', { ip: '192.168.1.1', endpoint: '/api/login' });
   * ```
   */
  warn(
    message: string,
    context?: Record<string, unknown>,
    requestId?: string,
    userId?: string
  ): void {
    if (!shouldLog(LogLevel.WARN)) return;
    
    const entry = createLogEntry(LogLevel.WARN, message, context, requestId, userId);
    writeLog(entry);
  }

  /**
   * Log error message
   * 
   * @param message - Log message
   * @param error - Error object
   * @param context - Additional context data
   * @param requestId - Request identifier
   * @param userId - User identifier
   * 
   * @example
   * ```typescript
   * logger.error('Database connection failed', error, { database: 'postgres' });
   * ```
   */
  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>,
    requestId?: string,
    userId?: string
  ): void {
    if (!shouldLog(LogLevel.ERROR)) return;
    
    const entry = createLogEntry(LogLevel.ERROR, message, context, requestId, userId, undefined, error);
    writeLog(entry);
  }

  /**
   * Log API request
   * 
   * @param data - Request logging data
   * 
   * @example
   * ```typescript
   * logger.logRequest({
   *   method: 'POST',
   *   path: '/api/users',
   *   statusCode: 201,
   *   duration: 150,
   *   userId: '123'
   * });
   * ```
   */
  logRequest(data: RequestLogData): void {
    if (!config.enableRequestLogging) return;
    
    const message = `${data.method} ${data.path} ${data.statusCode}`;
    const context = {
      method: data.method,
      path: data.path,
      statusCode: data.statusCode,
      duration: data.duration,
      userAgent: data.userAgent,
      ip: data.ip,
    };
    
    const level = data.statusCode >= 500 ? LogLevel.ERROR :
                  data.statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    
    const entry = createLogEntry(level, message, context, undefined, data.userId, data.duration);
    writeLog(entry);
  }

  /**
   * Log user action for audit trail
   * 
   * @param data - User action logging data
   * 
   * @example
   * ```typescript
   * logger.logUserAction({
   *   action: 'user.create',
   *   userId: 'admin123',
   *   details: { email: 'new@example.com', role: 'user' }
   * });
   * ```
   */
  logUserAction(data: UserActionLogData): void {
    if (!config.enableUserActionLogging) return;
    
    const message = `User action: ${data.action}`;
    const context = {
      action: data.action,
      resourceId: data.resourceId,
      resourceType: data.resourceType,
      details: data.details,
    };
    
    const entry = createLogEntry(LogLevel.INFO, message, context, undefined, data.userId);
    writeLog(entry);
  }

  /**
   * Log performance metrics
   * 
   * @param data - Performance logging data
   * 
   * @example
   * ```typescript
   * logger.logPerformance({
   *   operation: 'database.query',
   *   duration: 45,
   *   context: { table: 'users', query: 'SELECT * FROM users' }
   * });
   * ```
   */
  logPerformance(data: PerformanceLogData): void {
    if (!config.enablePerformanceLogging) return;
    
    const message = `Performance: ${data.operation} (${data.duration}ms)`;
    const context = {
      operation: data.operation,
      memoryUsage: data.memoryUsage,
      ...data.context,
    };
    
    const entry = createLogEntry(LogLevel.DEBUG, message, context, undefined, undefined, data.duration);
    writeLog(entry);
  }

  /**
   * Create a child logger with additional context
   * 
   * @param context - Additional context to include in all logs
   * @returns Child logger instance
   * 
   * @example
   * ```typescript
   * const userLogger = logger.child({ userId: '123', requestId: 'req_456' });
   * userLogger.info('Processing user request'); // Will include userId and requestId
   * ```
   */
  child(context: Record<string, unknown>): Logger {
    const childLogger = new Logger();
    const originalWriteLog = writeLog;
    
    // Override writeLog to include child context
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _childWriteLog = (entry: LogEntry) => {
      const mergedContext = { ...context, ...entry.context };
      const childEntry = { ...entry, context: mergedContext };
      originalWriteLog(childEntry);
    };
    
    // Override all methods to use child context
    const methods = ['debug', 'info', 'warn', 'error'] as const;
    methods.forEach(method => {
      const originalMethod = childLogger[method].bind(childLogger) as (message: string, context?: Record<string, unknown>, requestId?: string, userId?: string) => void;
      childLogger[method] = (message: string, ...args: unknown[]) => {
        const [contextArg, requestId, userId] = args;
        const mergedContext = { ...context, ...(contextArg as Record<string, unknown> || {}) };
        originalMethod(message, mergedContext, requestId as string, userId as string);
      };
    });
    
    return childLogger;
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a request-scoped logger
 * 
 * @param requestId - Request identifier
 * @param userId - User identifier (optional)
 * @returns Logger with request context
 * 
 * @example
 * ```typescript
 * const requestLogger = createRequestLogger('req_123', 'user_456');
 * requestLogger.info('Processing request');
 * ```
 */
export function createRequestLogger(requestId: string, userId?: string): Logger {
  return logger.child({ requestId, userId });
}

/**
 * Performance measurement decorator
 * 
 * @param operation - Operation name
 * @param logger - Logger instance
 * @returns Decorator function
 * 
 * @example
 * ```typescript
 * const measurePerformance = createPerformanceMeasurer('database.query', logger);
 * 
 * @measurePerformance
 * async function queryUsers() {
 *   // Database query implementation
 * }
 * ```
 */
export function createPerformanceMeasurer(operation: string, logger: Logger) {
  return function (target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: unknown[]) {
      const start = Date.now();
      const startMemory = process.memoryUsage();
      
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - start;
        const endMemory = process.memoryUsage();
        
        logger.logPerformance({
          operation,
          duration,
          memoryUsage: {
            rss: endMemory.rss - startMemory.rss,
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            heapTotal: endMemory.heapTotal - startMemory.heapTotal,
            external: endMemory.external - startMemory.external,
            arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
          },
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        logger.error(`Performance measurement failed for ${operation}`, error as Error, { duration });
        throw error;
      }
    };
  };
}

/**
 * Express middleware for request logging
 * 
 * @param logger - Logger instance
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * app.use(requestLoggingMiddleware(logger));
 * ```
 */
export function requestLoggingMiddleware(logger: Logger) {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (req: unknown, res: unknown, next: unknown) => {
    const start = Date.now();
    const requestId = generateRequestId();
    
    // Add request ID to request object
    (req as any).requestId = requestId;
    
    // Override res.end to log response
    const originalEnd = (res as any).end;
    (res as any).end = function (chunk?: unknown, encoding?: unknown) {
      const duration = Date.now() - start;
      
      logger.logRequest({
        method: (req as any).method,
        path: (req as any).path,
        statusCode: (res as any).statusCode,
        duration,
        userAgent: (req as any).get('User-Agent'),
        ip: (req as any).ip || (req as any).connection.remoteAddress,
        userId: (req as any).user?.id,
      });
      
      originalEnd.call(this, chunk, encoding);
    };
    
    (next as any)();
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export default logger;
