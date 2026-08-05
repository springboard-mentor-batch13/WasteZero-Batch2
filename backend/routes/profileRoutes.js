const express = require('express');
const router = express.Router();

const {
  getProfile,
  updateProfile,
  changePassword,
  getServiceAreas,
  updateServiceAreas,
} = require('../controllers/profileController');

const { protect } = require('../middleware/authMiddleware');

// =========================
// Profile Routes
// =========================

// Get profile
router.get('/', protect, getProfile);

// Update profile
router.put('/', protect, updateProfile);

// Change password
router.put('/change-password', protect, changePassword);

// =========================
// NGO Service Area Routes
// =========================

// Get NGO service areas
router.get('/service-areas', protect, getServiceAreas);

// Update NGO service areas
router.put('/service-areas', protect, updateServiceAreas);

module.exports = router;