// backend/controllers/adminReportController.js

const User = require('../models/User');
const Opportunity = require('../models/Opportunity');
const Application = require('../models/Application');

/**
 * @desc    Get Admin Dashboard Overview Stats & Recent Activity
 * @route   GET /api/admin/reports/dashboard-stats
 * @access  Private (Admin only)
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const [userStats, opportunityStats, applicationStats, recentUsers, recentOpps] = await Promise.all([
      // 1. User breakdown by Role and Status
      User.aggregate([
        {
          $group: {
            _id: { role: '$role', status: '$status' },
            count: { $sum: 1 },
          },
        },
      ]),

      // 2. Opportunity breakdown by Status
      Opportunity.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // 3. Application breakdown by Status
      Application.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // 4. Recent activity: Top 5 newly joined users
      User.find().select('fullName email role status createdAt').sort({ createdAt: -1 }).limit(5),

      // 5. Recent activity: Top 5 posted opportunities
      Opportunity.find().select('title category status createdAt').sort({ createdAt: -1 }).limit(5),
    ]);

    // Format output for front-end summary cards
    const userSummary = { Total: 0, Volunteer: 0, NGO: 0, Admin: 0, Active: 0, Suspended: 0 };
    userStats.forEach((item) => {
      userSummary.Total += item.count;
      if (item._id.role) userSummary[item._id.role] = (userSummary[item._id.role] || 0) + item.count;
      if (item._id.status) userSummary[item._id.status] = (userSummary[item._id.status] || 0) + item.count;
    });

    const oppSummary = { Total: 0, Open: 0, Closed: 0, 'In Progress': 0, Removed: 0 };
    opportunityStats.forEach((item) => {
      oppSummary.Total += item.count;
      if (item._id) oppSummary[item._id] = item.count;
    });

    const appSummary = { Total: 0, Pending: 0, Accepted: 0, Rejected: 0 };
    applicationStats.forEach((item) => {
      appSummary.Total += item.count;
      if (item._id) appSummary[item._id] = item.count;
    });

    return res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: {
        users: userSummary,
        opportunities: oppSummary,
        applications: appSummary,
        recentActivity: {
          users: recentUsers,
          opportunities: recentOpps,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics',
      error: error.message,
    });
  }
};

/**
 * @desc    Get User Analytical Data (Active vs Inactive, Role distribution)
 * @route   GET /api/admin/reports/users
 * @access  Private (Admin only)
 */
exports.getUserReport = async (req, res) => {
  try {
    const report = await User.aggregate([
      {
        $group: {
          _id: '$role',
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
          suspendedUsers: { $sum: { $cond: [{ $eq: ['$status', 'Suspended'] }, 1, 0] } },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: 'User analytics report generated successfully',
      data: report,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error generating user report',
      error: error.message,
    });
  }
};

/**
 * @desc    Get Opportunity Analytics Data by Category & Status
 * @route   GET /api/admin/reports/opportunities
 * @access  Private (Admin only)
 */
exports.getOpportunityReport = async (req, res) => {
  try {
    const report = await Opportunity.aggregate([
      {
        $group: {
          _id: '$category',
          totalOpportunities: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ['$status', 'Open'] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
          removed: { $sum: { $cond: [{ $eq: ['$status', 'Removed'] }, 1, 0] } },
          totalVolunteersNeeded: { $sum: '$requiredVolunteers' },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: 'Opportunity report generated successfully',
      data: report,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error generating opportunity report',
      error: error.message,
    });
  }
};

/**
 * @desc    Get Volunteer Response Report (Applications)
 * @route   GET /api/admin/reports/volunteer-responses
 * @access  Private (Admin only)
 */
exports.getVolunteerResponseReport = async (req, res) => {
  try {
    const report = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          totalApplications: { $sum: 1 },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: 'Volunteer response report generated successfully',
      data: report,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error generating volunteer response report',
      error: error.message,
    });
  }
};

/**
 * @desc    Download User Performance Report as CSV
 * @route   GET /api/admin/reports/export/users
 * @access  Private (Admin only)
 */
exports.exportUsersCSV = async (req, res) => {
  try {
    const users = await User.find().select('fullName username email role status city state createdAt').lean();

    let csv = 'Full Name,Username,Email,Role,Status,City,State,Joined Date\n';
    users.forEach((u) => {
      const date = u.createdAt ? u.createdAt.toISOString().split('T')[0] : '';
      csv += `"${u.fullName}","${u.username}","${u.email}","${u.role}","${u.status || 'Active'}","${u.city || ''}","${u.state || ''}","${date}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users_report.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to export users CSV', error: error.message });
  }
};

/**
 * @desc    Download Opportunity Report as CSV
 * @route   GET /api/admin/reports/export/opportunities
 * @access  Private (Admin only)
 */
exports.exportOpportunitiesCSV = async (req, res) => {
  try {
    const opps = await Opportunity.find().select('title category status city state requiredVolunteers createdAt').lean();

    let csv = 'Title,Category,Status,City,State,Required Volunteers,Created Date\n';
    opps.forEach((o) => {
      const date = o.createdAt ? o.createdAt.toISOString().split('T')[0] : '';
      csv += `"${o.title}","${o.category}","${o.status}","${o.city}","${o.state}","${o.requiredVolunteers}","${date}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="opportunities_report.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to export opportunities CSV', error: error.message });
  }
};

/**
 * @desc    Download Application Report as CSV
 * @route   GET /api/admin/reports/export/applications
 * @access  Private (Admin only)
 */
exports.exportApplicationsCSV = async (req, res) => {
  try {
    const apps = await Application.find().select('opportunityTitle fullName email status createdAt').lean();

    let csv = 'Opportunity Title,Applicant Name,Applicant Email,Status,Application Date\n';
    apps.forEach((a) => {
      const date = a.createdAt ? a.createdAt.toISOString().split('T')[0] : '';
      csv += `"${a.opportunityTitle}","${a.fullName}","${a.email}","${a.status}","${date}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="applications_report.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to export applications CSV', error: error.message });
  }
};