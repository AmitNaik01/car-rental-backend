const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Protected route for all logged-in users
router.get('/user-profile', verifyToken, (req, res) => {
  res.json({ message: `Welcome User ID: ${req.user.id}`, role: req.user.role });
});

// Admin-only route
router.get('/admin-panel', verifyToken, isAdmin, (req, res) => {
  res.json({ message: `Welcome Admin ID: ${req.user.id}` });
});

module.exports = router;
