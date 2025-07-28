const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');

router.post('/send', verifyToken, chatController.sendChatMessage);
router.get('/history/:booking_id', verifyToken, chatController.getChatHistory);
router.get('/admin/conversations', verifyToken, chatController.getAdminConversations);
module.exports = router;
