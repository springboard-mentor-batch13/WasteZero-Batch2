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

    timestamp: {
      type: Date,
      default: Date.now,
    },
  }
);

module.exports = mongoose.model('AdminLog', adminLogSchema, 'AdminLogs');
console.log('AdminLog model loaded:', mongoose.model('AdminLog'));