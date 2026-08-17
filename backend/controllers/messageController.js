const User = require('../models/User');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const MessageRequest = require('../models/MessageRequest');
const { encrypt, decrypt } = require('../utils/encryption');

// ============================================================
// HELPER
// ============================================================

const createConversationKey = (userId1, userId2) => {
    return [String(userId1), String(userId2)]
        .sort()
        .join('_');
};


// ============================================================
// GET USERS BY ROLE
// ============================================================

const getUsersByRole = async (req, res) => {
    try {

        const users = await User.find(
            { _id: { $ne: req.user._id } },
            '_id fullName username role'
        );

        res.json({
            success: true,
            data: {
                admins: users.filter(
                    user => user.role === 'Admin'
                ),

                ngos: users.filter(
                    user => user.role === 'NGO'
                ),

                volunteers: users.filter(
                    user => user.role === 'Volunteer'
                )
            }
        });

    } catch (error) {

        console.error(
            'Get users by role error:',
            error
        );

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// SEND MESSAGE
// ============================================================

const sendMessage = async (req, res) => {

    try {

        const senderId = req.user._id;
        const { receiverId, content } = req.body;


        // ----------------------------------------------------
        // BASIC VALIDATION
        // ----------------------------------------------------

        if (!receiverId || !content?.trim()) {

            return res.status(400).json({
                success: false,
                message: 'receiverId and content are required'
            });
        }


        // ----------------------------------------------------
        // PREVENT SELF MESSAGE
        // ----------------------------------------------------

        if (
            String(senderId) ===
            String(receiverId)
        ) {

            return res.status(400).json({
                success: false,
                message: 'You cannot message yourself'
            });
        }


        // ----------------------------------------------------
        // GET RECEIVER
        // ----------------------------------------------------

        const receiverUser = await User.findById(
            receiverId
        ).select(
            '_id fullName username role'
        );


        if (!receiverUser) {

            return res.status(404).json({
                success: false,
                message: 'Receiver not found'
            });
        }


        // ----------------------------------------------------
        // SAME ROLE USERS CANNOT MESSAGE
        // ----------------------------------------------------

        if (
            req.user.role ===
            receiverUser.role
        ) {

            return res.status(403).json({
                success: false,
                message:
                    'Users with the same role cannot message each other'
            });
        }


        // ----------------------------------------------------
        // FIND CONVERSATION RELATIONSHIP
        // ----------------------------------------------------

        const conversationKey =
            createConversationKey(
                senderId,
                receiverId
            );


        const relationship =
            await MessageRequest.findOne({
                conversationKey
            });


        // ----------------------------------------------------
        // NO RELATIONSHIP
        // ----------------------------------------------------

        if (!relationship) {

            return res.status(403).json({
                success: false,
                message:
                    'You must send a message request before sending messages'
            });
        }


        // ----------------------------------------------------
        // PENDING
        // ----------------------------------------------------

        if (
            relationship.status ===
            'PENDING'
        ) {

            /*
             * Only the person who initiated
             * the request can send the first
             * message while the request is pending.
             */

            if (
                String(relationship.senderId) !==
                String(senderId)
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        'This user has not accepted your message request yet'
                });
            }

        }


        // ----------------------------------------------------
        // BLOCKED
        // ----------------------------------------------------

        let isBlockedSender = false;

        if (
            relationship.status ===
            'BLOCKED'
        ) {

            /*
             * blockedBy = person who performed
             * the block.
             *
             * The other user is therefore
             * the blocked user.
             */

            if (
                String(relationship.blockedBy) ===
                String(senderId)
            ) {

                /*
                 * The person who blocked the
                 * conversation cannot continue
                 * sending while it is blocked.
                 */

                return res.status(403).json({
                    success: false,
                    message:
                        'This conversation is blocked. Unblock the user to continue messaging.'
                });

            } else {

                /*
                 * Current sender is the blocked user.
                 *
                 * Requirement:
                 * They may technically send messages,
                 * but the recipient must not receive
                 * or be notified about them.
                 */

                isBlockedSender = true;
            }
        }


        // ----------------------------------------------------
        // ENCRYPT MESSAGE
        // ----------------------------------------------------

        const encryptedContent =
            encrypt(content.trim());


        // ----------------------------------------------------
        // CREATE MESSAGE
        // ----------------------------------------------------

        const message =
            await Message.create({

                senderId,

                receiverId,

                content: encryptedContent,

                status: 'sent'
            });


        // ----------------------------------------------------
        // RETURN MESSAGE WITH PLAIN TEXT CONTENT
        // ----------------------------------------------------

        const responseMessage = {
            ...message.toObject(),

            content: content.trim()
        };


        // ====================================================
        // BLOCKED USER
        // ====================================================

        if (isBlockedSender) {

            /*
             * Important:
             *
             * Message IS stored.
             *
             * Sender gets success.
             *
             * Receiver gets:
             * - NO notification
             * - NO new-message notification
             *
             * Socket delivery must also be prevented
             * by the socket layer.
             */

            return res.status(201).json({

                success: true,

                data: responseMessage,

                message:
                    'Message sent'
            });
        }


        // ====================================================
        // PENDING REQUEST
        // ====================================================

        if (
            relationship.status ===
            'PENDING'
        ) {

            /*
             * This is the first-contact stage.
             *
             * Do NOT send a normal
             * "New Message" notification.
             *
             * Instead notify the receiver that
             * a message request exists.
             */

            const senderName =
                req.user.fullName ||
                req.user.username ||
                'A user';


            await Notification.create({

                recipientId:
                    receiverId,

                recipientRole:
                    receiverUser.role,

                sourceRole:
                    req.user.role,

                title:
                    'New Message Request',

                message:
                    `${senderName} wants to message you.`,

                type:
                    'MessageRequest',

                redirectUrl:
                    '/messages'
            });


            return res.status(201).json({

                success: true,

                data: responseMessage,

                relationshipStatus:
                    'PENDING',

                message:
                    'Message request sent successfully'
            });
        }


        // ====================================================
        // ACCEPTED NORMAL MESSAGE
        // ====================================================

        if (
            relationship.status ===
            'ACCEPTED'
        ) {

            const senderName =
                req.user.fullName ||
                req.user.username ||
                'A user';


            await Notification.create({

                recipientId:
                    receiverId,

                recipientRole:
                    receiverUser.role,

                sourceRole:
                    req.user.role,

                title:
                    'New Message',

                message:
                    `You received a new message from ${senderName}.`,

                type:
                    'Message',

                redirectUrl:
                    '/messages'
            });


            return res.status(201).json({

                success: true,

                data: responseMessage,

                relationshipStatus:
                    'ACCEPTED'
            });
        }


        // ----------------------------------------------------
        // FALLBACK
        // ----------------------------------------------------

        return res.status(400).json({

            success: false,

            message:
                'Unable to send message with the current conversation status'
        });


    } catch (error) {

        console.error(
            'Send message error:',
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message
        });
    }
};


// ============================================================
// GET CONVERSATION
// ============================================================

const getConversation = async (req, res) => {

    try {

        const currentUserId =
            req.user._id;

        const { userId } =
            req.params;


        // ----------------------------------------------------
        // VALIDATE USER ID
        // ----------------------------------------------------

        if (!userId) {

            return res.status(400).json({
                success: false,
                message: 'userId is required'
            });
        }


        // ----------------------------------------------------
        // PREVENT SELF CONVERSATION
        // ----------------------------------------------------

        if (
            String(currentUserId) ===
            String(userId)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    'You cannot open a conversation with yourself'
            });
        }


        // ----------------------------------------------------
        // GET OTHER USER
        // ----------------------------------------------------

        const otherUser =
            await User.findById(
                userId
            ).select(
                '_id fullName username role'
            );


        if (!otherUser) {

            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }


        // ----------------------------------------------------
        // SAME ROLE CHECK
        // ----------------------------------------------------

        if (
            req.user.role ===
            otherUser.role
        ) {

            return res.status(403).json({
                success: false,
                message:
                    'Users with the same role cannot message each other'
            });
        }


        // ----------------------------------------------------
        // FIND RELATIONSHIP
        // ----------------------------------------------------

        const conversationKey =
            createConversationKey(
                currentUserId,
                userId
            );


        const relationship =
            await MessageRequest.findOne({
                conversationKey
            });


        // ----------------------------------------------------
        // NO RELATIONSHIP
        // ----------------------------------------------------

        if (!relationship) {

            return res.json({

                success: true,

                relationshipStatus:
                    'NONE',

                data: []
            });
        }


        // ----------------------------------------------------
        // GET MESSAGES
        // ----------------------------------------------------

        let messages =
            await Message.find({

                $or: [

                    {
                        senderId:
                            currentUserId,

                        receiverId:
                            userId
                    },

                    {
                        senderId:
                            userId,

                        receiverId:
                            currentUserId
                    }

                ]

            })
            .populate(
                'senderId',
                '_id fullName username role'
            )
            .populate(
                'receiverId',
                '_id fullName username role'
            )
            .sort({
                createdAt: 1
            });


        // ----------------------------------------------------
        // DECRYPT MESSAGES
        // ----------------------------------------------------

        const decryptedMessages =
            messages.map(message => {

                const obj =
                    message.toObject();

                try {

                    /*
                     * New messages are encrypted.
                     */

                    obj.content =
                        decrypt(obj.content);

                } catch (error) {

                    /*
                     * Backward compatibility:
                     *
                     * If an older message was stored
                     * before encryption was enabled,
                     * keep the original plain text.
                     */

                    console.warn(
                        'Unable to decrypt message:',
                        obj._id
                    );

                }

                return obj;
            });


        messages =
            decryptedMessages;


        // ----------------------------------------------------
        // BLOCKED CONVERSATION
        // ----------------------------------------------------

        if (
            relationship.status ===
            'BLOCKED'
        ) {

            const blockerId =
                String(
                    relationship.blockedBy
                );


            const currentUserIsBlocker =
                blockerId ===
                String(currentUserId);


            if (currentUserIsBlocker) {

                /*
                 * The blocker should not receive
                 * messages sent by the blocked user.
                 *
                 * Current MessageRequest schema does
                 * not contain blockedAt, so we cannot
                 * distinguish old messages from messages
                 * sent after the block.
                 *
                 * Therefore, for now, hide messages from
                 * the blocked user.
                 */

                messages =
                    messages.filter(
                        message => {

                            const messageSenderId =
                                String(
                                    message.senderId?._id ||
                                    message.senderId
                                );

                            return (
                                messageSenderId !==
                                String(userId)
                            );
                        }
                    );
            }

            /*
             * The blocked user can still see their
             * own messages/history.
             */
        }


        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------

        return res.json({

            success: true,

            relationshipStatus:
                relationship.status,

            data:
                messages
        });


    } catch (error) {

        console.error(
            'Get conversation error:',
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message
        });
    }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {

    getUsersByRole,

    sendMessage,

    getConversation
};