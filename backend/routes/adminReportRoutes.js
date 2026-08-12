// backend/routes/adminReportRoutes.js

const express = require('express');
const router = express.Router();
const adminReportController = require('../controllers/adminReportController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Secure all endpoints with authentication and admin authorization
router.use(protect);
router.use(adminOnly);

// Stats & JSON Analytical Reports
router.get('/dashboard-stats', adminReportController.getDashboardStats);
router.get('/reports/users', adminReportController.getUserReport);
router.get('/reports/opportunities', adminReportController.getOpportunityReport);
router.get('/reports/volunteer-responses', adminReportController.getVolunteerResponseReport);

// CSV File Export Downloads
router.get('/reports/export/users', adminReportController.exportUsersCSV);
router.get('/reports/export/opportunities', adminReportController.exportOpportunitiesCSV);
router.get('/reports/export/applications', adminReportController.exportApplicationsCSV);

module.exports = router;