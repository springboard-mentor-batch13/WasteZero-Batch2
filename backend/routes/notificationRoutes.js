const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  createNotification
} = require('../controllers/notificationController');

// Import authentication middleware from existing middleware folder
const { protect } = require('../middleware/authMiddleware');

// Apply auth middleware to all notification routes
router.use(protect);

// Collection routes
router.get('/', getNotifications);
router.post('/', createNotification);

// Utility / Batch routes
router.get('/unread-count', getUnreadCount);
router.patch('/mark-all-read', markAllAsRead);

// Item routes by ID
router.get('/:id', getNotificationById);
router.patch('/:id/read', markAsRead);
router.patch('/:id/unread', markAsUnread);
router.delete('/:id', deleteNotification);

module.exports = router;