const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

// POST /auth/login - Admin login
router.post('/login', authController.login);

// POST /auth/refresh - Refresh access token
router.post('/refresh', authController.refreshToken);

// POST /auth/logout - Logout (protected)
router.post('/logout', authenticate, authController.logout);

// GET /auth/profile - Get current user profile (protected)
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
