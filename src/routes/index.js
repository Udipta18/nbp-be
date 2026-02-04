const express = require('express');
const router = express.Router();

const providerRoutes = require('./provider.routes');
const adminRoutes = require('./admin.routes');
const authRoutes = require('./auth.routes');
const bookingRoutes = require('./booking.routes');
const reviewRoutes = require('./review.routes');
const { getCategories } = require('../controllers/provider.controller');

// Health check
router.get('/health', (req, res) => {
    res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

// API routes
router.use('/providers', providerRoutes);
router.use('/admin', adminRoutes);
router.use('/auth', authRoutes);
router.use('/bookings', bookingRoutes);
router.use('/reviews', reviewRoutes);

// Categories endpoint
router.get('/categories', getCategories);

module.exports = router;
