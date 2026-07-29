const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Null when recipientRole is 'All'
      index: true
    },
    recipientRole: {
      type: String,
      enum: ['Volunteer', 'NGO', 'Admin', 'All'],
      default: 'Volunteer',
      required: true
    },
    sourceRole: {
      type: String,
      enum: ['Volunteer', 'NGO', 'Admin', 'System'],
      default: 'System',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: ['Match', 'Message', 'Opportunity', 'System']
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    redirectUrl: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient user query and date sorting
notificationSchema.index({ recipientId: 1, createdAt: -1 });

// Transform MongoDB _id to frontend expected `id` property
notificationSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;