const mongoose = require('mongoose');

const messageRequestSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Opportunity from which the first conversation was started.
    // Optional because users can also start conversations
    // from the Messages page.
    opportunityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      default: null,
    },

    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'BLOCKED'],
      default: 'PENDING',
    },

    // The user who performed the block.
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Unique key representing the relationship between
    // two users, regardless of who initiated it.
    conversationKey: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  'MessageRequest',
  messageRequestSchema
);