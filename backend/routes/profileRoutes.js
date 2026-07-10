const express = require('express');
const router = express.Router();

const { 
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/profileController');

const { protect } = require('../middleware/authMiddleware');


// GET profile
router.get('/', protect, getProfile);


// Change password
router.put('/change-password', protect, changePassword);


// Update profile
router.put('/', protect, updateProfile);


module.exports = router;