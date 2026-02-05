/**
 * Request Validation Middleware
 * 
 * Uses express-validator for input validation
 */

const { body, param, query, validationResult } = require('express-validator');
const config = require('../config');

/**
 * Validation result handler
 * Returns errors if validation fails
 * 
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation Error',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    
    next();
};

/**
 * Provider creation validation rules
 */
const validateProviderCreate = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 255 })
        .withMessage('Name must be between 2 and 255 characters'),
    
    body('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone is required')
        .matches(/^[+]?[\d\s()-]{10,20}$/)
        .withMessage('Invalid phone number format'),
    
    body('category')
        .trim()
        .notEmpty()
        .withMessage('Category is required')
        .isIn(config.categories)
        .withMessage(`Category must be one of: ${config.categories.join(', ')}`),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description must be less than 2000 characters'),
    
    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Invalid email format'),
    
    body('website')
        .optional()
        .trim()
        .isURL()
        .withMessage('Invalid website URL'),
    
    body('address')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Address must be less than 500 characters'),
    
    body('city')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('City must be less than 100 characters'),
    
    body('state')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('State must be less than 100 characters'),
    
    body('zip_code')
        .optional()
        .trim()
        .isLength({ max: 20 })
        .withMessage('ZIP code must be less than 20 characters'),
    
    body('latitude')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90'),
    
    body('longitude')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180'),
    
    body('experience_years')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('Experience years must be between 0 and 100'),
    
    body('ward_number')
        .notEmpty()
        .withMessage('Ward number is required')
        .isInt({ min: 1, max: 20 })
        .withMessage('Ward number must be between 1 and 20'),
    
    handleValidation
];

/**
 * Provider ID parameter validation
 */
const validateProviderId = [
    param('id')
        .isUUID()
        .withMessage('Invalid provider ID format'),
    
    handleValidation
];

/**
 * Provider query parameters validation
 */
const validateProviderQuery = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: config.pagination.maxLimit })
        .withMessage(`Limit must be between 1 and ${config.pagination.maxLimit}`),
    
    query('category')
        .optional()
        .trim()
        .isIn(config.categories)
        .withMessage(`Category must be one of: ${config.categories.join(', ')}`),
    
    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters'),
    
    query('sort')
        .optional()
        .isIn(['rating', 'price', 'created_at', 'name'])
        .withMessage('Sort must be one of: rating, price, created_at, name'),
    
    query('order')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Order must be either asc or desc'),
    
    query('ward')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('Ward must be between 1 and 20'),
    
    query('tags')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Tags must be a comma-separated string'),
    
    handleValidation
];

/**
 * Booking creation validation rules
 */
const validateBookingCreate = [
    body('provider_id')
        .notEmpty()
        .withMessage('Provider ID is required')
        .isUUID()
        .withMessage('Invalid provider ID format'),
    
    body('customer_name')
        .trim()
        .notEmpty()
        .withMessage('Customer name is required')
        .isLength({ min: 2, max: 255 })
        .withMessage('Customer name must be between 2 and 255 characters'),
    
    body('customer_phone')
        .trim()
        .notEmpty()
        .withMessage('Customer phone is required')
        .matches(/^[+]?[\d\s()-]{10,20}$/)
        .withMessage('Invalid phone number format'),
    
    body('booking_date')
        .notEmpty()
        .withMessage('Booking date is required')
        .isISO8601()
        .toDate()
        .withMessage('Invalid date format')
        .custom((value) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (value < today) {
                throw new Error('Booking date cannot be in the past');
            }
            return true;
        }),
    
    body('booking_time')
        .notEmpty()
        .withMessage('Booking time is required')
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Invalid time format. Use HH:MM format'),
    
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Notes must be less than 500 characters'),
    
    handleValidation
];

/**
 * Review creation validation rules
 */
const validateReviewCreate = [
    body('booking_id')
        .notEmpty()
        .withMessage('Booking ID is required')
        .isUUID()
        .withMessage('Invalid booking ID format'),
    
    body('rating')
        .notEmpty()
        .withMessage('Rating is required')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    
    body('comment')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Comment must be less than 1000 characters'),
    
    handleValidation
];

module.exports = {
    handleValidation,
    validateProviderCreate,
    validateProviderId,
    validateProviderQuery,
    validateBookingCreate,
    validateReviewCreate
};
