const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware'); // Only verifyToken for user routes
const controller = require('../controllers/userBookingController');

// Middleware: Only Auth Check (for regular users)
router.post('/preview', verifyToken, controller.previewBooking);
router.post('/book', verifyToken, controller.bookCar);
router.post('/cars', verifyToken, controller.getAllCarsWithDetails);
router.post('/cars/:car_id', verifyToken, controller.getCarDetails);

module.exports = router;
