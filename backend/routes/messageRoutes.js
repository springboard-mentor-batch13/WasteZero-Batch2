const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const {
    getUsersByRole,
    sendMessage,
    getConversation
} = require('../controllers/messageController');

router.get('/users', protect, getUsersByRole);
router.post('/send', protect, sendMessage);
router.get('/conversation/:userId', protect, getConversation);

module.exports = router;