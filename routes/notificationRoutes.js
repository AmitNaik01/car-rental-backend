const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const controller = require('../controllers/notificationController');

router.get('/', verifyToken, controller.getNotifications);
router.post('/mark-read/:id', verifyToken, controller.markAsRead);

module.exports = router;
