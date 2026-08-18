const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const { encrypt } = require('../utils/encryption');
const Notification = require('../models/Notification');

const onlineUsers = new Map();

const registerChatSocket = (io) => {

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(
                    new Error('Authentication token missing')
                );
            }

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            const user = await User
                .findById(decoded.id)
                .select('-password');

            if (!user) {
                return next(
                    new Error('User not found')
                );
            }

            socket.user = user;

            next();

        } catch (error) {
            console.error(
                'Socket authentication error:',
                error
            );

            next(
                new Error('Authentication failed')
            );
        }
    });


    io.on('connection', (socket) => {

        const userId =
            socket.user._id.toString();

        const userRoom =
            `user:${userId}`;


        socket.join(userRoom);


        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }

        onlineUsers
            .get(userId)
            .add(socket.id);


        console.log(
            `${socket.user.fullName} connected`
        );

        console.log(
            'Socket ID:',
            socket.id
        );

        console.log(
            'User ID:',
            userId
        );

        console.log(
            'Online Users:',
            Array.from(
                onlineUsers.keys()
            )
        );


        socket.emit(
            'onlineUsers',
            Array.from(
                onlineUsers.keys()
            )
        );


        io.emit(
            'userOnline',
            {
                userId: userId,
                username: socket.user.username,
                fullName: socket.user.fullName
            }
        );


        socket.on(
            'sendMessage',
            async ({
                receiverId,
                content
            }) => {

                try {

                    if (
                        !receiverId ||
                        !content ||
                        !content.trim()
                    ) {

                        socket.emit(
                            'messageError',
                            {
                                message:
                                    'Receiver and message are required'
                            }
                        );

                        return;
                    }


                    const receiverIdStr =
                        receiverId.toString();


                    console.log(
                        '-----------------------------'
                    );

                    console.log(
                        'SEND MESSAGE'
                    );

                    console.log(
                        'Sender:',
                        userId
                    );

                    console.log(
                        'Receiver:',
                        receiverIdStr
                    );

                    console.log(
                        'Content:',
                        content
                    );


                    const message =
                        await Message.create({
                            senderId:
                                socket.user._id,

                            receiverId:
                                receiverIdStr,

                            content:
                                encrypt(
                                    content.trim()
                                ),

                            status:
                                'sent'
                        });


                    const receiverUser =
                        await User
                            .findById(
                                receiverIdStr
                            )
                            .select('role');


                    if (receiverUser) {

                        const senderName =
                            socket.user.fullName ||
                            socket.user.username ||
                            'A user';


                        await Notification.create({
                            recipientId:
                                receiverIdStr,

                            recipientRole:
                                receiverUser.role,

                            sourceRole:
                                socket.user.role,

                            title:
                                'New Message',

                            message:
                                `You received a new message from ${senderName}.`,

                            type:
                                'Message',

                            redirectUrl:
                                '/messages'
                        });

                    }


                    const receiverRoom =
                        `user:${receiverIdStr}`;


                    const receiverOnline =
                        onlineUsers.has(
                            receiverIdStr
                        );


                    console.log(
                        'Receiver Room:',
                        receiverRoom
                    );

                    console.log(
                        'Receiver Online:',
                        receiverOnline
                    );


                    if (receiverOnline) {

                        message.status =
                            'delivered';

                        await message.save();


                        const messageToSend = {
                            ...message.toObject(),

                            _id:
                                String(
                                    message._id
                                ),

                            senderId:
                                String(
                                    message.senderId
                                ),

                            receiverId:
                                String(
                                    message.receiverId
                                ),

                            content:
                                content.trim(),

                            status:
                                'delivered'
                        };


                        console.log(
                            'Emitting receiveMessage to:',
                            receiverRoom
                        );


                        io.to(
                            receiverRoom
                        ).emit(
                            'receiveMessage',
                            messageToSend
                        );


                        socket.emit(
                            'messageDelivered',
                            {
                                messageId:
                                    String(
                                        message._id
                                    ),

                                status:
                                    'delivered'
                            }
                        );


                        socket.emit(
                            'messageSent',
                            messageToSend
                        );


                    } else {

                        const messageToSend = {
                            ...message.toObject(),

                            _id:
                                String(
                                    message._id
                                ),

                            senderId:
                                String(
                                    message.senderId
                                ),

                            receiverId:
                                String(
                                    message.receiverId
                                ),

                            content:
                                content.trim(),

                            status:
                                'sent'
                        };


                        console.log(
                            'Receiver is offline.'
                        );


                        socket.emit(
                            'messageSent',
                            messageToSend
                        );

                    }


                    console.log(
                        '-----------------------------'
                    );


                } catch (error) {

                    console.error(
                        'Socket send message error:',
                        error
                    );


                    socket.emit(
                        'messageError',
                        {
                            message:
                                error.message
                        }
                    );

                }

            }
        );


        socket.on(
            'markAsRead',
            async ({
                messageId
            }) => {

                try {

                    const message =
                        await Message.findById(
                            messageId
                        );


                    if (!message) {
                        return;
                    }


                    message.status =
                        'read';


                    await message.save();


                    const senderId =
                        message.senderId.toString();


                    const senderRoom =
                        `user:${senderId}`;


                    io.to(
                        senderRoom
                    ).emit(
                        'messageRead',
                        {
                            messageId:
                                String(
                                    message._id
                                ),

                            status:
                                'read'
                        }
                    );


                } catch (error) {

                    console.error(
                        'Mark message as read error:',
                        error
                    );


                    socket.emit(
                        'messageError',
                        {
                            message:
                                error.message
                        }
                    );

                }

            }
        );


        socket.on(
            'disconnect',
            () => {

                const userSockets =
                    onlineUsers.get(
                        userId
                    );


                if (userSockets) {

                    userSockets.delete(
                        socket.id
                    );


                    if (
                        userSockets.size === 0
                    ) {

                        onlineUsers.delete(
                            userId
                        );


                        io.emit(
                            'userOffline',
                            {
                                userId:
                                    userId
                            }
                        );

                    }

                }


                console.log(
                    `${socket.user.fullName} disconnected`
                );


                console.log(
                    'Socket ID:',
                    socket.id
                );


                console.log(
                    'Online Users:',
                    Array.from(
                        onlineUsers.keys()
                    )
                );

            }
        );

    });

};

module.exports = registerChatSocket;