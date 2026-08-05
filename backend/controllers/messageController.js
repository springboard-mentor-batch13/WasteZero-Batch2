const User = require('../models/User');
const Message = require('../models/Message');
const { encrypt, decrypt } = require('../utils/encryption');

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
            content: encrypt(content.trim())
        });

        const responseMessage = {
            ...message.toObject(),
            content: content.trim()
        };

        res.status(201).json({
            success: true,
            data: responseMessage
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

        const decryptedMessages = messages.map(message => ({
            ...message.toObject(),
            content: decrypt(message.content)
        }));

        res.json({
            success: true,
            data: decryptedMessages
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