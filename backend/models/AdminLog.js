const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, 'Admin action is required'],
      trim: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'AdminLogs',
  }
);

adminLogSchema.index({ timestamp: -1 });
adminLogSchema.index({ action: 1 });
adminLogSchema.index({ userId: 1 });

module.exports = mongoose.model('AdminLog', adminLogSchema);
