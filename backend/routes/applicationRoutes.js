const express = require('express');
const router = express.Router();

const {
    applyForOpportunity,
    getAllApplications,
    acceptApplication,
    rejectApplication,
} = require('../controllers/applicationController');

const { protect } = require('../middleware/authMiddleware');

// Volunteer applies
router.post('/apply', protect, applyForOpportunity);

// Admin views all applications
router.get('/', protect, getAllApplications);

// Admin accepts application
router.put('/:id/accept', protect, acceptApplication);

// Admin rejects application
router.put('/:id/reject', protect, rejectApplication);

module.exports = router;