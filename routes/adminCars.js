const express = require('express');
const router = express.Router();
const upload = require('../utils/multerConfig');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const {
  saveBasicInfo,
  uploadCarImages,
  saveCarPricing,
  saveCarAvailability,
  uploadDocuments,
  getCarDetails,
  markCarAsComplete
} = require('../controllers/adminCarsController');

// Middleware: Auth + Role Check
const protectedAdmin = [verifyToken, isAdmin];

//  1. Save or update basic car info
router.post('/cars/save-basic-info', protectedAdmin, saveBasicInfo);

//  2. Save pricing info
router.post('/cars/save-pricing', protectedAdmin, saveCarPricing);

//  3. Save availability info
router.post('/cars/save-availability', protectedAdmin, saveCarAvailability);

//  4. Upload car images


router.post(
  '/cars/upload-images',
  protectedAdmin,
  upload.fields([
    { name: 'front_image', maxCount: 1 },
    { name: 'rear_image', maxCount: 1 },
    { name: 'side_image', maxCount: 1 },
    { name: 'interior_front_image', maxCount: 1 },
    { name: 'interior_back_image', maxCount: 1 },
  ]),
  uploadCarImages
);

// 5. Upload documents (PDF, JPG, PNG)
router.post(
  '/cars/upload-documents',
  protectedAdmin,
  upload.fields([
    { name: 'registration_certificate', maxCount: 1 },
    { name: 'insurance_certificate', maxCount: 1 },
    { name: 'pollution_certificate', maxCount: 1 },
  ]),
  uploadDocuments
);

// 6. Mark car status
router.post('/cars/complete', verifyToken, isAdmin, markCarAsComplete);



// 7. Get car data 
router.get('/cars/:car_id', getCarDetails);

module.exports = router;
