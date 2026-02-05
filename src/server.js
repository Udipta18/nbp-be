require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
// CORS configuration
// Fallback to '*' if undefined to ensure it works
let allowedOrigins = config.cors.allowedOrigins || ['*'];
// If it's a string (env var issue), try to parse or treat as single
if (typeof allowedOrigins === 'string') {
    allowedOrigins = allowedOrigins.split(',').map(o => o.trim());
}

// Normalize origins (remove trailing slashes) to ensure matching works
const validOrigins = allowedOrigins.map(origin => origin.replace(/\/$/, ''));

// Check if wildcard is present
const isWildcard = allowedOrigins.includes('*') || (allowedOrigins.length === 1 && allowedOrigins[0] === '*');

console.log('🌐 CORS Config:', { isWildcard, validOrigins }); // Debug log

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) {
            return callback(null, true);
        }
        
        // Allow all origins if wildcard is set
        if (isWildcard) {
            return callback(null, true);
        }
        
        // Check against normalized whitelist
        if (validOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log(`❌ CORS Blocked: Origin ${origin} not in whitelist`, validOrigins);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: { success: false, error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);

// Logging
if (config.server.isDev) {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Hyperlocal Services Marketplace API',
        version: '1.0.0',
        docs: '/api/health'
    });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${config.server.env}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
