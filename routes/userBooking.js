const express = require('express');
const router = express.Router();
const upload = require('../utils/multerConfig');
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
router.delete('/booking/:id/cancel', verifyToken, controller.cancelBooking);
router.get('/profile', verifyToken, controller.getUserProfile);
router.put(
  '/update-profile',
  verifyToken,
  upload.single('profile_image'),
  controller.updateUserProfile
);
router.get('/get-user-documents', verifyToken, controller.getUserDocuments);
// Upload passport image
router.put(
  '/upload-passport',
  verifyToken,
  upload.single('passport_image'),
  controller.uploadPassportImage
);

// Upload license image
router.put(
  '/upload-license',
  verifyToken,
  upload.single('license_image'),
  controller.uploadLicenseImage
);

router.put('/bank-details', verifyToken, controller.storeUserBankDetails);
router.get('/bank-details', verifyToken, controller.getUserBankDetails);

router.put('/add-payment-method', verifyToken, controller.addPaymentMethod );
router.get('/get-payment-method', verifyToken, controller.getPaymentMethods );

router.get('/booking-history', verifyToken, controller.getBookingHistory);


router.post(
  '/support/submit',
  verifyToken,
  upload.array('support_images', 4), // max 4 images
  controller.submitSupportRequest
);

module.exports = router;
