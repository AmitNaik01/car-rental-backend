const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware'); // Only verifyToken for user routes
const controller = require('../controllers/userBookingController');

// Middleware: Only Auth Check (for regular users)
router.post('/preview', verifyToken, controller.previewBooking);
router.post('/book', verifyToken, controller.bookCar);
router.post('/cars', verifyToken, controller.getAllCarsWithDetails);
router.post('/cars/:car_id', verifyToken, controller.getCarDetails);
router.get('/my-bookings', verifyToken, controller.getUserBookingsWithCars);
router.get('/booking/:id', verifyToken, controller.getBookingById);
router.put('/booking/:id', verifyToken, controller.modifyBooking);
router.delete('/bookings/:id/cancel', verifyToken, controller.cancelBooking);


module.exports = router;
