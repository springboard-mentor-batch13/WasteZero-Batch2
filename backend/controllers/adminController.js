const User = require('../models/User');
const Opportunity = require('../models/Opportunity');

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

module.exports = {
    getAdminDashboardStats
};