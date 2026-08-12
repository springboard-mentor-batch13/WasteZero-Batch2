const express = require('express');

const router = express.Router();

const {
    getAdminDashboardStats,
    getAdminUsers,
    suspendUser,
    activateUser,
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

router.get(
    '/users',
    protect,
    authorizeRoles('Admin'),
    getAdminUsers
);

router.patch(
    '/users/:id/suspend',
    protect,
    authorizeRoles('Admin'),
    suspendUser
);

router.patch(
    '/users/:id/activate',
    protect,
    authorizeRoles('Admin'),
    activateUser
);

router.patch(
    '/users/:id/status',
    protect,
    authorizeRoles('Admin'),
    updateUserStatus
);

router.get(
    '/logs',
    protect,
    authorizeRoles('Admin'),
    getAdminLogs
);

router.patch(
    '/opportunities/:id/remove',
    protect,
    authorizeRoles('Admin'),
    removeOpportunity
);

module.exports = router;
