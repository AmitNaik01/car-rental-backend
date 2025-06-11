const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware'); // Only verifyToken for user routes
const controller = require('../controllers/userBookingController');

// Middleware: Only Auth Check (for regular users)
router.post('/preview', verifyToken, controller.previewBooking);
router.post('/book', verifyToken, controller.bookCar);

module.exports = router;
