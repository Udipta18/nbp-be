const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authenticate } = require('../middleware/auth');
const { validateReviewCreate } = require('../middleware/validate');

// POST /reviews - Create new review (public)
router.post('/', validateReviewCreate, reviewController.createReview);

// GET /reviews/:id - Get review by ID
router.get('/:id', reviewController.getReviewById);

// DELETE /reviews/:id - Delete review (admin only)
router.delete('/:id', authenticate, reviewController.deleteReview);

module.exports = router;
