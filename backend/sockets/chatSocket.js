const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
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

        console.log(`${socket.user.fullName} connected`);
        socket.on('sendMessage', async ({ receiverId, content }) => {
            try {
                const message = await Message.create({
                    senderId: socket.user._id,
                    receiverId,
                    content: content.trim()
                });

                const receiverSocketId = onlineUsers.get(receiverId);

                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('receiveMessage', message);
                }

                socket.emit('messageSent', message);

            } catch (error) {
                socket.emit('messageError', {
                    message: error.message
                });
            }
        });

        socket.on('disconnect', () => {

            onlineUsers.delete(socket.user._id.toString());

            console.log(`${socket.user.fullName} disconnected`);
        });

    });

};

module.exports = registerChatSocket;