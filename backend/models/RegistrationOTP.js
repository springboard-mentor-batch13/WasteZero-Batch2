const mongoose = require('mongoose');

const registrationOTPSchema = new mongoose.Schema(
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
    hashedPassword: {
      type: String,
      required: [true, 'Hashed password is required'],
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['Volunteer', 'NGO', 'Admin'],
      default: 'Volunteer',
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

registrationOTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RegistrationOTP', registrationOTPSchema, 'RegistrationOTPs');
