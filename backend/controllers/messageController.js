const User = require('../models/User');
const Message = require('../models/Message');
const Notification = require('../models/Notification'); // 👈 Import Notification Model

const getUsersByRole = async (req, res) => {
    try {
        const users = await User.find(
            { _id: { $ne: req.user._id } },
            '_id fullName username role'
        );
        res.json({
            success: true,
            data: {
                admins: users.filter(user => user.role === 'Admin'),
                ngos: users.filter(user => user.role === 'NGO'),
                volunteers: users.filter(user => user.role === 'Volunteer')
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;

        if (!receiverId || !content?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'receiverId and content are required'
            });
        }

        const message = await Message.create({
            senderId: req.user._id,
            receiverId,
            content: content.trim()
        });

        // ----------------------------------------------------
        // 🔔 TRIGGER NOTIFICATION FOR MESSAGE RECEIVER
        // ----------------------------------------------------
        const receiverUser = await User.findById(receiverId).select('role');
        if (receiverUser) {
            const senderName = req.user.fullName || req.user.username || 'A user';
            await Notification.create({
                recipientId: receiverId,          // Receiver only
                recipientRole: receiverUser.role,  // Volunteer, NGO, or Admin
                sourceRole: req.user.role,
                title: 'New Message',
                message: `You received a new message from ${senderName}.`,
                type: 'Message',
                redirectUrl: '/messages'
            });
        }

        res.status(201).json({
            success: true,
            data: message
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getConversation = async (req, res) => {
    try {
        const { userId } = req.params;

        const messages = await Message.find({
            $or: [
                {
                    senderId: req.user._id,
                    receiverId: userId
                },
                {
                    senderId: userId,
                    receiverId: req.user._id
                }
            ]
        })
            .populate('senderId', '_id fullName username')
            .populate('receiverId', '_id fullName username')
            .sort({ createdAt: 1 });

        res.json({
            success: true,
            data: messages
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getUsersByRole,
    sendMessage,
    getConversation
};