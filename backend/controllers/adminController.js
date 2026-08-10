const User = require('../models/User');
const Opportunity = require('../models/Opportunity');
const AdminLog = require('../models/AdminLog');

//console.log('AdminLog:', AdminLog);

const getAdminDashboardStats = async (req, res) => {
    try {

        // Run independent queries in parallel
        const [
            totalUsers,
            totalOpportunities,
            adminUsers,
            ngoUsers
        ] = await Promise.all([
            User.countDocuments(),
            Opportunity.countDocuments(),

            User.find({ role: 'Admin' }).distinct('_id'),

            User.find({ role: 'NGO' }).distinct('_id')
        ]);

        // Count opportunities based on the role of the creator
        const [
            adminOpportunities,
            ngoOpportunities
        ] = await Promise.all([
            Opportunity.countDocuments({
                postedBy: { $in: adminUsers }
            }),

            Opportunity.countDocuments({
                postedBy: { $in: ngoUsers }
            })
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalOpportunities,
                adminOpportunities,
                ngoOpportunities
            }
        });

    } catch (error) {

        console.error(
            'Admin dashboard statistics error:',
            error
        );

        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Admin users cannot be suspended
    if (user.role === 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin user cannot be suspended',
      });
    }

    user.status = status;
    await user.save();

    // Save admin action in AdminLogs
    await AdminLog.create({
      action: `User ${status === 'Suspended' ? 'suspended' : 'activated'}`,
      userId: user._id,
    });

    res.status(200).json({
      success: true,
      message: `User ${status.toLowerCase()} successfully`,
      data: user,
    });
  } catch (error) {
    console.error('Update user status error:', error);

    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};


const getAdminLogs = async (req, res) => {
  try {
    const logs = await AdminLog.find()
      .populate('userId', 'fullName username role')
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Get admin logs error:', error);

    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};


const removeOpportunity = async (req, res) => {
  try {
    const { id } = req.params;

    const opportunity = await Opportunity.findById(id);

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found',
      });
    }

    opportunity.status = 'Removed';
    await opportunity.save();

    await AdminLog.create({
      action: 'Opportunity removed',
      userId: opportunity.postedBy,
    });

    res.status(200).json({
      success: true,
      message: 'Opportunity removed successfully',
      data: opportunity,
    });
  } catch (error) {
    console.error('Remove opportunity error:', error);

    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

module.exports = {
    getAdminDashboardStats,
     updateUserStatus,
     getAdminLogs,
     removeOpportunity
};