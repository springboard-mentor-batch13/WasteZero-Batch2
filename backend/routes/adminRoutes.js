const express = require('express');

const router = express.Router();

const {
    getAdminDashboardStats,
    updateUserStatus,
    getAdminLogs,
    removeOpportunity
} = require('../controllers/adminController');

const {
    protect
} = require('../middleware/authMiddleware');

const {
    authorizeRoles
} = require('../middleware/roleMiddleware');


// Admin dashboard statistics
router.get(
    '/dashboard/stats',
    protect,
    authorizeRoles('Admin'),
    getAdminDashboardStats
);

// Suspend or activate user
router.patch(
  '/users/:id/status',
  protect,
  authorizeRoles('Admin'),
  updateUserStatus
);

// Admin logs
router.get(
  '/logs',
  protect,
  authorizeRoles('Admin'),
  getAdminLogs
);

// Remove opportunity
router.patch(
  '/opportunities/:id/remove',
  protect,
  authorizeRoles('Admin'),
  removeOpportunity
);

module.exports = router;