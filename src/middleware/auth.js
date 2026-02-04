/**
 * Authentication Middleware
 * 
 * Verifies Supabase JWT tokens for protected routes
 */

const { verifyToken } = require('../config/supabase');

/**
 * Extract Bearer token from Authorization header
 * 
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} JWT token or null
 */
const extractToken = (authHeader) => {
    if (!authHeader) {
        return null;
    }

    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }

    return parts[1];
};

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 * 
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
const authenticate = async (req, res, next) => {
    try {
        const token = extractToken(req.headers.authorization);

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'No authentication token provided'
            });
        }

        const { user, error } = await verifyToken(token);

        if (error || !user) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Invalid or expired token'
            });
        }

        // Attach user to request for downstream use
        req.user = user;
        req.token = token;

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'An error occurred during authentication'
        });
    }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't fail if missing
 * Useful for routes that behave differently for authenticated users
 * 
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
const authenticateOptional = async (req, res, next) => {
    try {
        const token = extractToken(req.headers.authorization);

        if (token) {
            const { user } = await verifyToken(token);
            if (user) {
                req.user = user;
                req.token = token;
            }
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

/**
 * Role-based authorization middleware factory
 * Creates middleware that checks if user has required role
 * 
 * @param {...string} allowedRoles - Roles allowed to access the route
 * @returns {Function} Express middleware function
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        // Check user role from metadata
        const userRole = req.user.user_metadata?.role || 'user';

        if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

module.exports = {
    authenticate,
    authenticateOptional,
    authorize,
    extractToken
};
