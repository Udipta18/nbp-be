/**
 * Application Configuration
 * 
 * Centralizes all configuration settings
 */

const config = {
    // Server settings
    server: {
        port: parseInt(process.env.PORT, 10) || 3000,
        env: process.env.NODE_ENV || 'development',
        isDev: process.env.NODE_ENV !== 'production'
    },

    // CORS settings
    cors: {
        allowedOrigins: process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
            : ['http://localhost:3000', 'http://localhost:5173']
    },

    // Rate limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
    },

    // Upload settings
    upload: {
        maxFileSize: 2 * 1024 * 1024, // 2MB in bytes
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    },

    // Pagination defaults
    pagination: {
        defaultPage: 1,
        defaultLimit: 10,
        maxLimit: 50
    },

    // Provider categories
    categories: [
        'Plumbing',
        'Electrical',
        'Cleaning',
        'Carpentry',
        'Painting',
        'AC Repair',
        'Appliance Repair',
        'Pest Control',
        'Gardening',
        'Moving'
    ]
};

module.exports = config;
