const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');

const {
  createMessageRequest,
  getConversationStatus,
  getPendingRequests,
  acceptMessageRequest,
  blockUser,
  unblockUser,
} = require('../controllers/messageRequestController');

// Create first-time message request
router.post(
  '/request',
  protect,
  createMessageRequest
);

// Get pending requests received by current user
router.get(
  '/pending',
  protect,
  getPendingRequests
);

// Check conversation relationship with another user
router.get(
  '/status/:userId',
  protect,
  getConversationStatus
);

// Accept message request
router.patch(
  '/accept/:requestId',
  protect,
  acceptMessageRequest
);

// Block user
router.patch(
  '/block/:requestId',
  protect,
  blockUser
);

// Unblock user
router.patch(
  '/unblock/:requestId',
  protect,
  unblockUser
);

module.exports = router;