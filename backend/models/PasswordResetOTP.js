const mongoose = require('mongoose');

const passwordResetOTPSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: [true, 'OTP is required'],
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry time is required'],
      default: () => new Date(Date.now() + 10 * 60 * 1000),
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

passwordResetOTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordResetOTP', passwordResetOTPSchema, 'PasswordResetOTPs');
