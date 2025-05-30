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
router.post('/reset-password/', authController.resetPassword);



module.exports = router;
