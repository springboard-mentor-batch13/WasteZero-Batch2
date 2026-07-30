const Notification = require('../models/Notification');

/**
 * @desc    Get user notifications (filtered by user ID and role)
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;

    // Admin sees all notifications; Volunteers/NGOs see their own or broadcasted ('All') ones
    let query = {};
    if (userRole !== 'Admin') {
      query = {
        $or: [
          { recipientId: userId },
          { recipientRole: 'All' }
        ]
      };
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Notifications fetched successfully',
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get unread notifications count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;

    let query = { isRead: false };
    if (userRole !== 'Admin') {
      query.$or = [
        { recipientId: userId },
        { recipientRole: 'All' }
      ];
    }

    const count = await Notification.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: 'Unread count fetched successfully',
      data: count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single notification by ID
 * @route   GET /api/notifications/:id
 * @access  Private
 */
const getNotificationById = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification details fetched successfully',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark notification as unread
 * @route   PATCH /api/notifications/:id/unread
 * @access  Private
 */
const markAsUnread = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: false },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as unread',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all user notifications as read
 * @route   PATCH /api/notifications/mark-all-read
 * @access  Private
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;

    let query = {};
    if (userRole !== 'Admin') {
      query = {
        $or: [
          { recipientId: userId },
          { recipientRole: 'All' }
        ]
      };
    }

    await Notification.updateMany(query, { isRead: true });

    const updatedNotifications = await Notification.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: updatedNotifications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new notification
 * @route   POST /api/notifications
 * @access  Private
 */
const createNotification = async (req, res, next) => {
  try {
    const { title, message, type, redirectUrl, recipientId, recipientRole, sourceRole } = req.body;

    const notification = await Notification.create({
      title,
      message,
      type,
      redirectUrl,
      recipientId: recipientId || null,
      recipientRole: recipientRole || 'Volunteer',
      sourceRole: sourceRole || req.user.role || 'System'
    });

    return res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  createNotification
};