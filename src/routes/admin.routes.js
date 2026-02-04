const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth');
const { validateProviderId } = require('../middleware/validate');

// All admin routes require authentication
router.use(authenticate);

// GET /admin/stats - Dashboard statistics
router.get('/stats', adminController.getStats);

// GET /admin/providers - Get all providers (any status)
router.get('/providers', adminController.getAllProviders);

// GET /admin/providers/pending - Get pending providers
router.get('/providers/pending', adminController.getPendingProviders);

// GET /admin/providers/:id - Get provider by ID (any status)
router.get('/providers/:id', validateProviderId, adminController.getProviderByIdAdmin);

// PATCH /admin/providers/:id/approve - Approve provider
router.patch('/providers/:id/approve', validateProviderId, adminController.approveProvider);

// PATCH /admin/providers/:id/reject - Reject provider
router.patch('/providers/:id/reject', validateProviderId, adminController.rejectProvider);

// DELETE /admin/providers/:id - Delete provider
router.delete('/providers/:id', validateProviderId, adminController.deleteProvider);

module.exports = router;
