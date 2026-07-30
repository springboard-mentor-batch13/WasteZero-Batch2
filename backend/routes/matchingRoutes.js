const express = require('express');

const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { getMatches } = require('../controllers/matchingController');

// GET /api/matches
router.get('/', protect, getMatches);

module.exports = router;