/**
 * Global Error Handler Middleware
 * 
 * Centralizes error handling for the application
 */

const config = require('../config');

/**
 * Custom API Error class
 */
class ApiError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Not Found Error
 */
class NotFoundError extends ApiError {
    constructor(message = 'Resource not found') {
        super(404, message);
    }
}

/**
 * Bad Request Error
 */
class BadRequestError extends ApiError {
    constructor(message = 'Bad request', details = null) {
        super(400, message, details);
    }
}

/**
 * Unauthorized Error
 */
class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized') {
        super(401, message);
    }
}

/**
 * Forbidden Error
 */
class ForbiddenError extends ApiError {
    constructor(message = 'Access forbidden') {
        super(403, message);
    }
}

/**
 * Conflict Error
 */
class ConflictError extends ApiError {
    constructor(message = 'Resource already exists') {
        super(409, message);
    }
}

/**
 * 404 Not Found handler
 * Catches requests to undefined routes
 */
const notFoundHandler = (req, res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
};

/**
 * Global error handler
 * Processes all errors and returns consistent response format
 * 
 * @param {Error} error - Error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
const errorHandler = (error, req, res, next) => {
    // Default error values
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';
    let details = error.details || null;

    // Log error for debugging
    console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.error(`Status: ${statusCode}`);
    console.error(`Message: ${message}`);
    
    if (config.server.isDev) {
        console.error('Stack:', error.stack);
    }

    // Handle Supabase errors
    if (error.code && error.code.startsWith('PGRST')) {
        statusCode = 400;
        message = 'Database operation failed';
        
        if (error.code === 'PGRST116') {
            statusCode = 404;
            message = 'Resource not found';
        }
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    // Hide internal error details in production
    if (!config.server.isDev && statusCode === 500) {
        message = 'Internal Server Error';
        details = null;
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(details && { details }),
        ...(config.server.isDev && { stack: error.stack })
    });
};

/**
 * Async handler wrapper
 * Catches errors in async route handlers and passes to error middleware
 * 
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function with error handling
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    ApiError,
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    notFoundHandler,
    errorHandler,
    asyncHandler
};
