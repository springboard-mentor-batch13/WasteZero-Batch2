const express = require('express');
const router = express.Router();

const {
  createOpportunity,
  getAllOpportunities,
  searchOpportunities,
  filterOpportunities,
  getDashboardStatistics,
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
router.get('/dashboard/stats', protect, getDashboardStatistics);
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
