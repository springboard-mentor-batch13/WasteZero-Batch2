const express = require('express');
const router = express.Router();


const {
  createOpportunity,
  getAllOpportunities,
  searchOpportunities,
  filterOpportunities,
  getDashboardStatistics,
  getAdminDashboardStatistics,
  getOpportunityById,
  updateOpportunity,
  deleteOpportunity,
} = require('../controllers/opportunityController');

const { upload } = require('../config/cloudinary');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post(
  '/',
  protect,
  authorizeRoles('NGO', 'Admin'),
  upload.single('image'),
  createOpportunity
);

router.get('/', protect, getAllOpportunities);
router.get('/search', protect, searchOpportunities);
router.get('/filter', protect, filterOpportunities);

// NGO/shared dashboard statistics
router.get(
  '/dashboard/stats',
  protect,
  getDashboardStatistics
);

// Admin dashboard statistics
router.get(
  '/dashboard/admin-stats',
  protect,
  authorizeRoles('Admin'),
  getAdminDashboardStatistics
);

// Keep this after all specific routes
router.get('/:id', protect, getOpportunityById);


router.put(
  '/:id',
  protect,
  authorizeRoles('NGO', 'Admin'),
  upload.single('image'),
  updateOpportunity
);

router.delete(
  '/:id',
  protect,
  authorizeRoles('NGO', 'Admin'),
  deleteOpportunity
);

module.exports = router;
