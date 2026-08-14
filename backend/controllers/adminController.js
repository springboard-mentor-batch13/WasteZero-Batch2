const User = require('../models/User');
const Opportunity = require('../models/Opportunity');
const AdminLog = require('../models/AdminLog');

const parsePagination = (query) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);

    return {
        page,
        limit,
        skip: (page - 1) * limit
    };
};

const sendServerError = (res, error, context) => {
    console.error(context, error);

    res.status(500).json({
        success: false,
        message: 'Server Error'
    });
};

const toAdminUser = (user) => ({
    id: String(user._id),
    _id: user._id,
    fullName: user.fullName || user.username || 'Unnamed user',
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status || 'Active',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
});

const createAdminLog = async ({ action, userId, adminId }) => {
    await AdminLog.create({
        action,
        userId,
        adminId,
        timestamp: new Date()
    });
};

const getAdminUsers = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const { search = '', role = '', status = '' } = req.query;
        const filter = {};

        if (search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { fullName: searchRegex },
                { username: searchRegex },
                { email: searchRegex },
                { role: searchRegex },
                { status: searchRegex }
            ];
        }

        if (role) {
            filter.role = role;
        }

        if (status) {
            filter.status = status;
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('_id fullName username email role status createdAt updatedAt')
                .sort({ createdAt: -1, _id: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: users.map(toAdminUser),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        sendServerError(res, error, 'Admin users error:');
    }
};

const setUserStatus = async (req, res, status, action, successMessage) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin user cannot be suspended'
            });
        }

        user.status = status;
        await user.save();

        await createAdminLog({
            action,
            userId: user._id,
            adminId: req.user._id
        });

        res.status(200).json({
            success: true,
            message: successMessage || action,
            data: toAdminUser(user)
        });
    } catch (error) {
        sendServerError(res, error, `${action} error:`);
    }
};

const suspendUser = async (req, res) => {
    return setUserStatus(req, res, 'Suspended', 'User suspended');
};

const activateUser = async (req, res) => {
    return setUserStatus(req, res, 'Active', 'User activated');
};

const updateUserStatus = async (req, res) => {
    const { status } = req.body;

    if (!['Active', 'Suspended'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status'
        });
    }

    const action = `User ${status === 'Suspended' ? 'suspended' : 'activated'}`;
    const successMessage = `User ${status.toLowerCase()} successfully`;

    return setUserStatus(req, res, status, action, successMessage);
};

const getAdminLogs = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const { search = '', action = '', userId = '' } = req.query;
        const filter = {};

        if (search.trim()) {
            filter.action = new RegExp(search.trim(), 'i');
        }

        if (action) {
            filter.action = action;
        }

        if (userId) {
            filter.userId = userId;
        }

        const [logs, total] = await Promise.all([
            AdminLog.find(filter)
                .populate('userId', 'fullName username role')
                .sort({ timestamp: -1, _id: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AdminLog.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        sendServerError(res, error, 'Admin logs error:');
    }
};

const getAdminDashboardStats = async (req, res) => {
    try {
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
        sendServerError(res, error, 'Admin dashboard statistics error:');
    }
};

const removeOpportunity = async (req, res) => {
    try {
        const { id } = req.params;
        const opportunity = await Opportunity.findById(id);

        if (!opportunity) {
            return res.status(404).json({
                success: false,
                message: 'Opportunity not found'
            });
        }

        opportunity.status = 'Removed';
        await opportunity.save();

        await createAdminLog({
            action: 'Opportunity removed',
            userId: opportunity.postedBy,
            adminId: req.user._id
        });

        res.status(200).json({
            success: true,
            message: 'Opportunity removed successfully',
            data: opportunity
        });
    } catch (error) {
        sendServerError(res, error, 'Remove opportunity error:');
    }
};

module.exports = {
    getAdminDashboardStats,
    getAdminUsers,
    suspendUser,
    activateUser,
    updateUserStatus,
    getAdminLogs,
    removeOpportunity,
    createAdminLog
};
