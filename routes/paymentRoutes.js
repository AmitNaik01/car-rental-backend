const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');

router.post('/payment/verify', verifyToken, paymentController.verifyRazorpayPayment);

module.exports = router;
