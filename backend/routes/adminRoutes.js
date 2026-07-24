const express = require('express');

const router = express.Router();

const {
    getAdminDashboardStats
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

module.exports = router;