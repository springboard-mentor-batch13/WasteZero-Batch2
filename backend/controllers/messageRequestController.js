const mongoose = require('mongoose');

const User = require('../models/User');
const MessageRequest = require('../models/MessageRequest');

const createConversationKey = (userId1, userId2) => {
  return [String(userId1), String(userId2)]
    .sort()
    .join('_');
};

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

    // Check receiver exists
    const receiver = await User.findById(receiverId).select(
      '_id role fullName username'
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

    const conversationKey = createConversationKey(
      senderId,
      receiverId
    );

    // Check whether a relationship already exists
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

    const messageRequest = await MessageRequest.create({
      senderId,
      receiverId,
      opportunityId: opportunityId || null,
      status: 'PENDING',
      conversationKey,
    });

    res.status(201).json({
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

    // Handle duplicate conversationKey
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A conversation relationship already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


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

    const conversationKey = createConversationKey(
      currentUserId,
      userId
    );

    const request = await MessageRequest.findOne({
      conversationKey,
    })
      .populate('senderId', '_id fullName username role')
      .populate('receiverId', '_id fullName username role')
      .populate('blockedBy', '_id fullName username role');

    if (!request) {
      return res.json({
        success: true,
        exists: false,
        data: null,
      });
    }

    res.json({
      success: true,
      exists: true,
      data: request,
    });

  } catch (error) {
    console.error(
      'Get conversation status error:',
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  createMessageRequest,
  getConversationStatus,
};