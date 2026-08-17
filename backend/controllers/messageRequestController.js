const User = require('../models/User');
const MessageRequest = require('../models/MessageRequest');

const createConversationKey = (userId1, userId2) => {
  return [String(userId1), String(userId2)]
    .sort()
    .join('_');
};


// ============================================================
// CREATE MESSAGE REQUEST
// ============================================================

const createMessageRequest = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId, opportunityId } = req.body;

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: 'receiverId is required',
      });
    }

    // Prevent messaging yourself
    if (String(senderId) === String(receiverId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot message yourself',
      });
    }

    // Find receiver
    const receiver = await User.findById(receiverId).select(
      '_id fullName username role'
    );

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found',
      });
    }

    // Same-role users cannot message each other
    if (req.user.role === receiver.role) {
      return res.status(403).json({
        success: false,
        message: 'Users with the same role cannot message each other',
      });
    }

    // Create same conversation key regardless of direction
    const conversationKey = createConversationKey(
      senderId,
      receiverId
    );

    // Check if relationship already exists
    const existingRequest = await MessageRequest.findOne({
      conversationKey,
    });

    if (existingRequest) {
      return res.status(200).json({
        success: true,
        existing: true,
        data: existingRequest,
        message: 'A conversation relationship already exists',
      });
    }

    // Create new pending request
    const messageRequest = await MessageRequest.create({
      senderId,
      receiverId,
      opportunityId: opportunityId || null,
      status: 'PENDING',
      blockedBy: null,
      conversationKey,
    });

    return res.status(201).json({
      success: true,
      existing: false,
      message: 'Message request created successfully',
      data: messageRequest,
    });

  } catch (error) {
    console.error(
      'Create message request error:',
      error
    );

    // Duplicate conversation key
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A conversation relationship already exists',
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================================================
// GET CONVERSATION STATUS
// ============================================================

const getConversationStatus = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    if (String(currentUserId) === String(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot check a conversation with yourself',
      });
    }

    const conversationKey = createConversationKey(
      currentUserId,
      userId
    );

    const request = await MessageRequest.findOne({
      conversationKey,
    })
      .populate(
        'senderId',
        '_id fullName username role'
      )
      .populate(
        'receiverId',
        '_id fullName username role'
      )
      .populate(
        'blockedBy',
        '_id fullName username role'
      )
      .populate(
        'opportunityId',
        '_id title'
      );

    if (!request) {
      return res.json({
        success: true,
        exists: false,
        data: null,
      });
    }

    return res.json({
      success: true,
      exists: true,
      data: request,
    });

  } catch (error) {
    console.error(
      'Get conversation status error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================================================
// GET PENDING MESSAGE REQUESTS
// ============================================================

const getPendingRequests = async (req, res) => {
  try {
    const requests = await MessageRequest.find({
      receiverId: req.user._id,
      status: 'PENDING',
    })
      .populate(
        'senderId',
        '_id fullName username role'
      )
      .populate(
        'opportunityId',
        '_id title'
      )
      .sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      count: requests.length,
      data: requests,
    });

  } catch (error) {
    console.error(
      'Get pending requests error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================================================
// ACCEPT MESSAGE REQUEST
// ============================================================

const acceptMessageRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await MessageRequest.findById(
      requestId
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Message request not found',
      });
    }

    // Only receiver can accept
    if (
      String(request.receiverId) !==
      String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Only the recipient can accept this message request',
      });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message:
          `Request is already ${request.status.toLowerCase()}`,
      });
    }

    request.status = 'ACCEPTED';
    request.blockedBy = null;

    await request.save();

    return res.json({
      success: true,
      message: 'Message request accepted',
      data: request,
    });

  } catch (error) {
    console.error(
      'Accept message request error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================================================
// BLOCK USER
// ============================================================

const blockUser = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await MessageRequest.findById(
      requestId
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message:
          'Conversation relationship not found',
      });
    }

    // Only receiver can block the sender
    if (
      String(request.receiverId) !==
      String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Only the recipient can block this user',
      });
    }

    request.status = 'BLOCKED';
    request.blockedBy = req.user._id;

    await request.save();

    return res.json({
      success: true,
      message: 'User blocked successfully',
      data: request,
    });

  } catch (error) {
    console.error(
      'Block user error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================================================
// UNBLOCK USER
// ============================================================

const unblockUser = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await MessageRequest.findById(
      requestId
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message:
          'Conversation relationship not found',
      });
    }

    // Only the person who performed the block
    // can unblock the user
    if (
      String(request.blockedBy) !==
      String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Only the user who blocked this conversation can unblock it',
      });
    }

    request.status = 'ACCEPTED';
    request.blockedBy = null;

    await request.save();

    return res.json({
      success: true,
      message: 'User unblocked successfully',
      data: request,
    });

  } catch (error) {
    console.error(
      'Unblock user error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createMessageRequest,
  getConversationStatus,
  getPendingRequests,
  acceptMessageRequest,
  blockUser,
  unblockUser,
};