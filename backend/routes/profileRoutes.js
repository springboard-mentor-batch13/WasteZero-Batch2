/**
 * Profile Routes
 * 
 * This file maps the profile endpoints to their respective controller functions.
 * It currently defines the GET and PUT routes for the user profile.
 */
const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/profile - Fetch the user profile (Protected route)
router.get('/', protect, getProfile);

// PUT /api/profile - Update the user profile (Protected route)
router.put('/', protect, updateProfile);

module.exports = router;
