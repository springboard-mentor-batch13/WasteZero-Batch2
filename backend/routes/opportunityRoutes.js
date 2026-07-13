const express = require('express');
const router = express.Router();

const {
  createOpportunity,
  getAllOpportunities,
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
  '/',
  protect,
  authorizeRoles('NGO', 'Admin'),
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