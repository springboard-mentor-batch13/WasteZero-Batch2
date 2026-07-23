const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();

const {
    applyForOpportunity,
    getAllApplications,
    getMyApplicationForOpportunity,
    acceptApplication,
    rejectApplication,
} = require('../controllers/applicationController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array(),
        });
    }

    next();
};

// Volunteer applies
router.post(
    '/apply',
    protect,
    authorizeRoles('Volunteer'),
    [body('opportunityId').isMongoId().withMessage('Valid opportunity ID is required')],
    validateRequest,
    applyForOpportunity
);

// Volunteer checks whether they already applied
router.get(
    '/opportunity/:opportunityId/me',
    protect,
    authorizeRoles('Volunteer'),
    [param('opportunityId').isMongoId().withMessage('Valid opportunity ID is required')],
    validateRequest,
    getMyApplicationForOpportunity
);

// Admin views all applications
router.get('/', protect, authorizeRoles('Admin'), getAllApplications);

// Admin accepts application
router.put('/:id/accept', protect, authorizeRoles('Admin'), acceptApplication);

// Admin rejects application
router.put('/:id/reject', protect, authorizeRoles('Admin'), rejectApplication);

module.exports = router;
