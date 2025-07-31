// routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');


// Test route
router.get('/', (req, res) => {
  res.send('Auth route working!');
});
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/resend-reset-code', authController.resendResetCode);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationCode);

router.post('/logout', verifyToken, authController.logout);
module.exports = router;
