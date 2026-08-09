const User = require('../models/User');
const Message = require('../models/Message');
const { encrypt, decrypt } = require('../utils/encryption');
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
            content: encrypt(content.trim())
        });

        const responseMessage = {
            ...message.toObject(),
            content: content.trim()
        };
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

        const decryptedMessages = messages.map(message => {
            const obj = message.toObject();

            try {
                obj.content = decrypt(obj.content);
            } catch (err) {
                console.log("Skipping decryption:", obj._id);
                // Old plain-text message
                obj.content = obj.content;
            }

            return obj;
        });

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