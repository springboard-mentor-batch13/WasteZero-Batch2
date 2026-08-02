const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');

const {
  getMatchingNGOs,
} = require('../controllers/pickupMatchingController');

router.get('/matching-ngos', protect, getMatchingNGOs);

module.exports = router;