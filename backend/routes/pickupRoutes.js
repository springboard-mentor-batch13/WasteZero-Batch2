const express = require('express');
const router = express.Router();

const {
  createPickup,
  getMyPickups,
  getPickupById,
  updatePickup,
  deletePickup,
} = require('../controllers/pickupController');

// Protect middleware to ensure the user is authenticated
const { protect } = require('../middleware/authMiddleware');

// Apply the protect middleware to all pickup routes
router.use(protect);

/**
 * @route   POST /api/pickups
 * @desc    Create a new pickup request
 * @access  Private
 */
router.post('/', createPickup);

/**
 * @route   GET /api/pickups
 * @desc    Get all pickups belonging to the authenticated user
 * @access  Private
 */
router.get('/', getMyPickups);

/**
 * @route   GET /api/pickups/:id
 * @desc    Get a single pickup by ID
 * @access  Private
 */
router.get('/:id', getPickupById);

/**
 * @route   PUT /api/pickups/:id
 * @desc    Update a pickup by ID
 * @access  Private
 */
router.put('/:id', updatePickup);

/**
 * @route   DELETE /api/pickups/:id
 * @desc    Delete a pickup by ID
 * @access  Private
 */
router.delete('/:id', deletePickup);

module.exports = router;
