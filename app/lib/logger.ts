/**
 * Logging utilities for structured logging
 * Ensures sensitive data is never logged
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  action?: string;
  mode?: string;
  [key: string]: unknown;
}

const SENSITIVE_KEYS = [
  'access_token',
  'accessToken',
  'refresh_token',
  'refreshToken',
  'password',
  'secret',
  'authorization',
  'api_key',
  'apiKey',
];

/**
 * Redact sensitive fields from objects
 */
function redactSensitive(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(redactSensitive);
  }

  if (typeof obj === 'object') {
    const redacted: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      if (SENSITIVE_KEYS.some(sk => lowerKey.includes(sk.toLowerCase()))) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        redacted[key] = redactSensitive(value);
      } else {
        redacted[key] = value;
      }
    }
    
    return redacted;
  }

  return obj;
}

/**
 * Format log message with timestamp and context
 */
function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const ctx = context ? redactSensitive(context) : {};
  
  return JSON.stringify({
    timestamp,
    level: level.toUpperCase(),
    message,
    ...ctx,
  });
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatLog('debug', message, context));
    }
  },

  info(message: string, context?: LogContext) {
    console.info(formatLog('info', message, context));
  },

  warn(message: string, context?: LogContext) {
    console.warn(formatLog('warn', message, context));
  },

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    };
    
    console.error(formatLog('error', message, errorContext));
  },
};
