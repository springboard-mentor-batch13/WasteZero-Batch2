const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const { encrypt, decrypt } = require('../utils/encryption');
const Notification = require('../models/Notification'); // 👈 Import Notification Model
const onlineUsers = new Map();

const registerChatSocket = (io) => {

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication token missing'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return next(new Error('User not found'));
            }

            socket.user = user;
            next();

        } catch (error) {
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket) => {

        onlineUsers.set(socket.user._id.toString(), socket.id);
        console.log("Online Users:", Array.from(onlineUsers.keys()));

        socket.emit("onlineUsers", Array.from(onlineUsers.keys()));
        console.log("Socket User:", {
            id: socket.user._id.toString(),
            username: socket.user.username,
            fullName: socket.user.fullName
        });

        console.log("Emitting userOnline:", {
            userId: socket.user._id.toString(),
            username: socket.user.username,
            fullName: socket.user.fullName
        });

        io.emit('userOnline', {
            userId: socket.user._id.toString(),
            username: socket.user.username,
            fullName: socket.user.fullName
        });

        console.log(`${socket.user.fullName} connected`);

        socket.on('sendMessage', async ({ receiverId, content }) => {
            try {
                const message = await Message.create({
                    senderId: socket.user._id,
                    receiverId,
                    content: encrypt(content.trim()),
                    status: 'sent'
                });
                const messageToSend = {
                    ...message.toObject(),
                    content: content.trim()
                };

                // ----------------------------------------------------
                // 🔔 TRIGGER NOTIFICATION FOR MESSAGE RECEIVER
                // ----------------------------------------------------
                const receiverUser = await User.findById(receiverId).select('role');
                if (receiverUser) {
                    const senderName = socket.user.fullName || socket.user.username || 'A user';
                    await Notification.create({
                        recipientId: receiverId,          // Receiver only
                        recipientRole: receiverUser.role,  // Volunteer, NGO, or Admin
                        sourceRole: socket.user.role,
                        title: 'New Message',
                        message: `You received a new message from ${senderName}.`,
                        type: 'Message',
                        redirectUrl: '/messages'
                    });
                }

                const receiverIdStr = receiverId.toString();

                console.log("Receiver ID:", receiverIdStr);
                console.log("Online Users:", Array.from(onlineUsers.keys()));

                const receiverSocketId = onlineUsers.get(receiverIdStr);

                console.log("Receiver Socket:", receiverSocketId);

                if (receiverSocketId) {

                    message.status = 'delivered';
                    await message.save();

                    io.to(receiverSocketId).emit('receiveMessage', messageToSend);

                    socket.emit('messageDelivered', {
                        messageId: message._id,
                        status: 'delivered'
                    });
                }

                socket.emit('messageSent', messageToSend);

            } catch (error) {
                socket.emit('messageError', {
                    message: error.message
                });
            }
        });

        socket.on('markAsRead', async ({ messageId }) => {
            try {
                const message = await Message.findById(messageId);

                if (!message) return;

                message.status = 'read';
                await message.save();

                const senderSocketId = onlineUsers.get(message.senderId.toString());

                if (senderSocketId) {
                    io.to(senderSocketId).emit('messageRead', {
                        messageId: message._id,
                        status: 'read'
                    });
                }

            } catch (error) {
                socket.emit('messageError', {
                    message: error.message
                });
            }
        });

        socket.on('disconnect', () => {

            io.emit('userOffline', {
                userId: socket.user._id.toString()
            });

            onlineUsers.delete(socket.user._id.toString());

            console.log("Online Users:", Array.from(onlineUsers.keys()));

            console.log(`${socket.user.fullName} disconnected`);
        });

    });

};

module.exports = registerChatSocket;