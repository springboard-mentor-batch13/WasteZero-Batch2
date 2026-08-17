const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const MessageRequest = require('../models/MessageRequest');
const Notification = require('../models/Notification');
const { encrypt } = require('../utils/encryption');

const onlineUsers = new Map();


// ============================================================
// CREATE CONSISTENT CONVERSATION KEY
// ============================================================

const createConversationKey = (userId1, userId2) => {
    return [String(userId1), String(userId2)]
        .sort()
        .join('_');
};


// ============================================================
// REGISTER CHAT SOCKET
// ============================================================

const registerChatSocket = (io) => {

    // ========================================================
    // SOCKET AUTHENTICATION
    // ========================================================

    io.use(async (socket, next) => {

        try {

            const token =
                socket.handshake.auth.token;

            if (!token) {
                return next(
                    new Error('Authentication token missing')
                );
            }

            const decoded =
                jwt.verify(
                    token,
                    process.env.JWT_SECRET
                );

            const user =
                await User.findById(
                    decoded.id
                ).select('-password');

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


    // ========================================================
    // CONNECTION
    // ========================================================

    io.on('connection', (socket) => {

        const currentUserId =
            socket.user._id.toString();


        // ----------------------------------------------------
        // STORE ONLINE USER
        // ----------------------------------------------------

        onlineUsers.set(
            currentUserId,
            socket.id
        );


        console.log('Socket User:', {
            id: currentUserId,
            username: socket.user.username,
            fullName: socket.user.fullName,
            role: socket.user.role
        });


        io.emit('userOnline', {
            userId: currentUserId,
            username: socket.user.username,
            fullName: socket.user.fullName
        });


        console.log(
            `${socket.user.fullName} connected`
        );


        // ====================================================
        // SEND MESSAGE
        // ====================================================

        socket.on(
            'sendMessage',
            async ({ receiverId, content }) => {

                try {

                    // ------------------------------------------------
                    // VALIDATION
                    // ------------------------------------------------

                    if (
                        !receiverId ||
                        !content?.trim()
                    ) {

                        return socket.emit(
                            'messageError',
                            {
                                message:
                                    'receiverId and content are required'
                            }
                        );
                    }


                    // ------------------------------------------------
                    // PREVENT SELF MESSAGE
                    // ------------------------------------------------

                    if (
                        String(receiverId) ===
                        currentUserId
                    ) {

                        return socket.emit(
                            'messageError',
                            {
                                message:
                                    'You cannot message yourself'
                            }
                        );
                    }


                    // ------------------------------------------------
                    // FIND RECEIVER
                    // ------------------------------------------------

                    const receiverUser =
                        await User.findById(
                            receiverId
                        ).select(
                            '_id fullName username role'
                        );


                    if (!receiverUser) {

                        return socket.emit(
                            'messageError',
                            {
                                message:
                                    'Receiver not found'
                            }
                        );
                    }


                    // ------------------------------------------------
                    // SAME ROLE USERS CANNOT MESSAGE
                    // ------------------------------------------------

                    if (
                        socket.user.role ===
                        receiverUser.role
                    ) {

                        return socket.emit(
                            'messageError',
                            {
                                message:
                                    'Users with the same role cannot message each other'
                            }
                        );
                    }


                    // ------------------------------------------------
                    // FIND MESSAGE RELATIONSHIP
                    // ------------------------------------------------

                    const conversationKey =
                        createConversationKey(
                            currentUserId,
                            receiverId
                        );


                    const relationship =
                        await MessageRequest.findOne({
                            conversationKey
                        });


                    // ------------------------------------------------
                    // NO RELATIONSHIP
                    // ------------------------------------------------

                    if (!relationship) {

                        return socket.emit(
                            'messageError',
                            {
                                message:
                                    'You must send a message request before sending messages'
                            }
                        );
                    }


                    // ------------------------------------------------
                    // PENDING
                    // ------------------------------------------------

                    if (
                        relationship.status ===
                        'PENDING'
                    ) {

                        /*
                         * Only the person who created
                         * the request can send while
                         * it is pending.
                         */

                        if (
                            String(
                                relationship.senderId
                            ) !== currentUserId
                        ) {

                            return socket.emit(
                                'messageError',
                                {
                                    message:
                                        'This user has not accepted your message request yet'
                                }
                            );
                        }
                    }


                    // ------------------------------------------------
                    // BLOCKED
                    // ------------------------------------------------

                    let blockedSender = false;


                    if (
                        relationship.status ===
                        'BLOCKED'
                    ) {

                        const blockedBy =
                            String(
                                relationship.blockedBy
                            );


                        // --------------------------------------------
                        // PERSON WHO BLOCKED
                        // --------------------------------------------

                        if (
                            blockedBy ===
                            currentUserId
                        ) {

                            return socket.emit(
                                'messageError',
                                {
                                    message:
                                        'This conversation is blocked. Unblock the user to continue messaging.'
                                }
                            );
                        }


                        // --------------------------------------------
                        // PERSON WHO WAS BLOCKED
                        // --------------------------------------------

                        blockedSender = true;
                    }


                    // ------------------------------------------------
                    // ENCRYPT MESSAGE BEFORE DATABASE STORAGE
                    // ------------------------------------------------

                    const encryptedContent =
                        encrypt(
                            content.trim()
                        );


                    // ------------------------------------------------
                    // CREATE MESSAGE
                    // ------------------------------------------------

                    const message =
                        await Message.create({

                            senderId:
                                socket.user._id,

                            receiverId,

                            content:
                                encryptedContent,

                            status:
                                'sent'
                        });


                    // =================================================
                    // BLOCKED SENDER
                    // =================================================

                    if (blockedSender) {

                        /*
                         * Requirement:
                         *
                         * Blocked user can send.
                         *
                         * Message is stored.
                         *
                         * But recipient must NOT:
                         *
                         * - receive it through Socket.IO
                         * - receive a notification
                         * - see an unread notification
                         */

                        socket.emit(
                            'messageSent',
                            {
                                ...message.toObject(),
                                content:
                                    content.trim()
                            }
                        );

                        return;
                    }


                    // =================================================
                    // PENDING REQUEST
                    // =================================================

                    if (
                        relationship.status ===
                        'PENDING'
                    ) {

                        const senderName =
                            socket.user.fullName ||
                            socket.user.username ||
                            'A user';


                        /*
                         * Notify receiver that this is
                         * a MESSAGE REQUEST, not a normal
                         * message notification.
                         */

                        await Notification.create({

                            recipientId:
                                receiverId,

                            recipientRole:
                                receiverUser.role,

                            sourceRole:
                                socket.user.role,

                            title:
                                'New Message Request',

                            message:
                                `${senderName} wants to message you.`,

                            type:
                                'MessageRequest',

                            redirectUrl:
                                '/messages'
                        });


                        /*
                         * Do NOT deliver the actual
                         * chat message through Socket.IO
                         * while request is pending.
                         */

                        socket.emit(
                            'messageSent',
                            {
                                ...message.toObject(),
                                content:
                                    content.trim()
                            }
                        );

                        socket.emit(
                            'messageRequestPending',
                            {
                                receiverId,
                                status:
                                    'PENDING'
                            }
                        );

                        return;
                    }


                    // =================================================
                    // ACCEPTED NORMAL MESSAGE
                    // =================================================

                    if (
                        relationship.status ===
                        'ACCEPTED'
                    ) {

                        const senderName =
                            socket.user.fullName ||
                            socket.user.username ||
                            'A user';


                        // ---------------------------------------------
                        // CREATE NORMAL MESSAGE NOTIFICATION
                        // ---------------------------------------------

                        await Notification.create({

                            recipientId:
                                receiverId,

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


                        // ---------------------------------------------
                        // CHECK RECEIVER ONLINE
                        // ---------------------------------------------

                        const receiverSocketId =
                            onlineUsers.get(
                                String(receiverId)
                            );


                        // ---------------------------------------------
                        // DELIVER REAL-TIME MESSAGE
                        // ---------------------------------------------

                        if (receiverSocketId) {

                            message.status =
                                'delivered';

                            await message.save();


                            io.to(
                                receiverSocketId
                            ).emit(
                                'receiveMessage',
                                {
                                    ...message.toObject(),
                                    content:
                                        content.trim()
                                }
                            );


                            socket.emit(
                                'messageDelivered',
                                {
                                    messageId:
                                        message._id,

                                    status:
                                        'delivered'
                                }
                            );

                        }


                        // ---------------------------------------------
                        // CONFIRM TO SENDER
                        // ---------------------------------------------

                        socket.emit(
                            'messageSent',
                            {
                                ...message.toObject(),
                                content:
                                    content.trim()
                            }
                        );

                        return;
                    }


                    // ------------------------------------------------
                    // UNKNOWN STATUS
                    // ------------------------------------------------

                    socket.emit(
                        'messageError',
                        {
                            message:
                                'Unable to send message with the current conversation status'
                        }
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


        // ========================================================
        // MARK MESSAGE AS READ
        // ========================================================

        socket.on(
            'markAsRead',
            async ({ messageId }) => {

                try {

                    const message =
                        await Message.findById(
                            messageId
                        );


                    if (!message) {
                        return;
                    }


                    /*
                     * Only the receiver should be
                     * able to mark a message as read.
                     */

                    if (
                        String(
                            message.receiverId
                        ) !== currentUserId
                    ) {

                        return;
                    }


                    message.status =
                        'read';

                    await message.save();


                    const senderSocketId =
                        onlineUsers.get(
                            String(
                                message.senderId
                            )
                        );


                    if (senderSocketId) {

                        io.to(
                            senderSocketId
                        ).emit(
                            'messageRead',
                            {
                                messageId:
                                    message._id,

                                status:
                                    'read'
                            }
                        );
                    }


                } catch (error) {

                    console.error(
                        'Mark message read error:',
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


        // ========================================================
        // DISCONNECT
        // ========================================================

        socket.on(
            'disconnect',
            () => {

                /*
                 * Only remove the socket if this
                 * socket is still the active socket
                 * for this user.
                 *
                 * This prevents an older connection
                 * from deleting a newer connection.
                 */

                if (
                    onlineUsers.get(
                        currentUserId
                    ) === socket.id
                ) {

                    onlineUsers.delete(
                        currentUserId
                    );
                }


                io.emit(
                    'userOffline',
                    {
                        userId:
                            currentUserId
                    }
                );


                console.log(
                    `${socket.user.fullName} disconnected`
                );
            }
        );

    });
};


// ============================================================
// EXPORT
// ============================================================

module.exports = registerChatSocket;