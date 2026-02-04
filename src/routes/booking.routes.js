const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate } = require('../middleware/auth');
const { validateBookingCreate } = require('../middleware/validate');

// POST /bookings - Create new booking (public)
router.post('/', validateBookingCreate, bookingController.createBooking);

// GET /bookings/:id - Get booking by ID
router.get('/:id', bookingController.getBookingById);

// Admin routes
router.get('/', authenticate, bookingController.getAllBookings);
router.patch('/:id/status', authenticate, bookingController.updateBookingStatus);

module.exports = router;
