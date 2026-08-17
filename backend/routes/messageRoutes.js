const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');

const {
  getUsersByRole,
  sendMessage,
  getConversation
} = require('../controllers/messageController');


// ============================================================
// GET USERS AVAILABLE FOR MESSAGING
// ============================================================

router.get(
  '/users',
  protect,
  getUsersByRole
);


// ============================================================
// GET CONVERSATION WITH A USER
// ============================================================

router.get(
  '/conversation/:userId',
  protect,
  getConversation
);


// ============================================================
// SEND MESSAGE
// ============================================================

router.post(
  '/send',
  protect,
  sendMessage
);


module.exports = router;
