const express = require('express');
const router = express.Router();
const providerController = require('../controllers/provider.controller');
const { uploadImage } = require('../middleware/upload');
const { validateProviderCreate, validateProviderId, validateProviderQuery } = require('../middleware/validate');

// POST /providers - Create new provider (with image upload)
router.post('/', uploadImage, validateProviderCreate, providerController.createProvider);

// GET /providers - Get all approved providers
router.get('/', validateProviderQuery, providerController.getProviders);

// GET /providers/:id - Get single approved provider
router.get('/:id', validateProviderId, providerController.getProviderById);

// GET /providers/:id/reviews - Get provider reviews
router.get('/:id/reviews', validateProviderId, providerController.getProviderReviews);

module.exports = router;
