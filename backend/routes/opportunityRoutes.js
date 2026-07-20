const express = require('express');
const router = express.Router();
const upload = require("../middleware/upload");

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

// Middleware
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

/**
 * @route   POST /api/opportunities
 * @desc    Create a new opportunity
 * @access  Private (NGO/Admin)
 */
router.post(
    "/",
    protect,
    authorizeRoles("NGO", "Admin"),
    upload.single("image"),
    createOpportunity
);

/**
 * @route   GET /api/opportunities
 * @desc    Get all opportunities
 * @access  Private (Authenticated Users)
 */
router.get(
  '/',
  protect,
  getAllOpportunities
);

/**
 * @route   GET /api/opportunities/search
 * @desc    Search opportunities by title or description
 * @access  Private (Authenticated Users)
 */
router.get(
  '/search',
  protect,
  searchOpportunities
);

/**
 * @route   GET /api/opportunities/filter
 * @desc    Filter opportunities
 * @access  Private (Authenticated Users)
 */
router.get(
  '/filter',
  protect,
  filterOpportunities
);
/**
 * @route   GET /api/opportunities/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (Authenticated Users)
 */
router.get(
  '/dashboard/stats',
  protect,
  getDashboardStatistics
);

/**
 * @route   GET /api/opportunities/:id
 * @desc    Get a single opportunity by ID
 * @access  Private (Authenticated Users)
 */
router.get(
  '/:id',
  protect,
  getOpportunityById
);

/**
 * @route   PUT /api/opportunities/:id
 * @desc    Update an opportunity by ID
 * @access  Private (NGO/Admin)
 */
router.put(
  '/:id',
  protect,
  authorizeRoles('NGO', 'Admin'),
  upload.single("image"),
  updateOpportunity
);

/**
 * @route   DELETE /api/opportunities/:id
 * @desc    Delete an opportunity by ID
 * @access  Private (NGO/Admin)
 */
router.delete(
  '/:id',
  protect,
  authorizeRoles('NGO', 'Admin'),
  deleteOpportunity
);

module.exports = router;