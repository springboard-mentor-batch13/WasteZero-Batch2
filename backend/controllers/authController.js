const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RegistrationOTP = require('../models/RegistrationOTP');
const PasswordResetOTP = require('../models/PasswordResetOTP');
const sendEmail = require('../utils/sendEmail');
const { validationResult } = require('express-validator');

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign({ id: user._id, role: user.role }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const buildUserResponse = (user) => ({
  id: user._id,
  fullName: user.fullName,
  username: user.username,
  email: user.email,
  role: user.role,
});

/**
 * Register a new user.
 */
const registerUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const hasInvalidRole = errors
        .array()
        .some((error) => (error.path || error.param) === 'role' && error.msg === 'Invalid role');

      if (hasInvalidRole) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
      }

      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { fullName, username, email, password, confirmPassword, role } = req.body;

    if (!fullName || !username || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ success: false, message: 'Full name, username, email, password, confirm password, and role are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const message = existingUser.email === email ? 'Email already registered' : 'Username already taken';
      return res.status(409).json({ success: false, message });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName,
      username,
      email,
      password: hashedPassword,
      role: role || 'Volunteer',
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: buildUserResponse(newUser),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send OTP for registration verification.
 */
const sendRegisterOTP = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const hasInvalidRole = errors
        .array()
        .some((error) => (error.path || error.param) === 'role' && error.msg === 'Invalid role');

      if (hasInvalidRole) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
      }

      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { fullName, username, email, password, confirmPassword, role } = req.body;

    if (!fullName || !username || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ success: false, message: 'Full name, username, email, password, confirm password, and role are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordPattern.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const message = existingUser.email === email ? 'Email already registered' : 'Username already taken';
      return res.status(409).json({ success: false, message });
    }

    const otp = generateOTP();
    const hashedPassword = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await RegistrationOTP.deleteMany({ email: email.toLowerCase() });

    // Debug: show OTP data before creating
    console.log('Creating OTP...');
    const otpData = {
      email: email.toLowerCase(),
      otp,
      hashedPassword,
      fullName,
      username,
      role: role || 'Volunteer',
      expiresAt,
      createdAt: new Date(),
    };
    console.log(otpData);

    let otpRecord;
    try {
      otpRecord = await RegistrationOTP.create(otpData);
      console.log('Saved OTP:', otpRecord);
    } catch (createError) {
      console.error('[OTP CREATE] Failed to create OTP record:', createError.stack || createError);
      return res.status(500).json({ success: false, message: 'Failed to create OTP record' });
    }

    try {
      await sendEmail({
        to: otpRecord.email,
        subject: 'WasteZero Account Verification',
        html: `Hello ${otpRecord.fullName},<br><br>Your WasteZero verification code is<br><br><strong>${otp}</strong><br><br>This OTP is valid for 10 minutes.<br><br>Do not share this code with anyone.<br><br>Regards,<br>WasteZero Team`,
      });
    } catch (emailError) {
      console.error('[OTP EMAIL] Failed to send OTP email.');
      console.error('[OTP EMAIL] Error:', emailError.message || emailError);
      if (emailError.response) {
        console.error('[OTP EMAIL] SMTP response:', emailError.response);
      }

      await RegistrationOTP.deleteOne({ _id: otpRecord._id });
      return res.status(500).json({ success: false, message: 'Failed to send OTP email' });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify registration OTP and create the user.
 */
const verifyRegisterOTP = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const otpRecord = await RegistrationOTP.findOne({ email: email.toLowerCase() });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP not found' });
    }

    if (otpRecord.expiresAt < new Date()) {
      await RegistrationOTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const existingUser = await User.findOne({ $or: [{ email: otpRecord.email }, { username: otpRecord.username }] });
    if (existingUser) {
      await RegistrationOTP.deleteOne({ _id: otpRecord._id });
      const message = existingUser.email === otpRecord.email ? 'Email already registered' : 'Username already taken';
      return res.status(409).json({ success: false, message });
    }

    const newUser = await User.create({
      fullName: otpRecord.fullName,
      username: otpRecord.username,
      email: otpRecord.email,
      password: otpRecord.hashedPassword,
      role: otpRecord.role || 'Volunteer',
    });

    await RegistrationOTP.deleteOne({ _id: otpRecord._id });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Registration completed successfully',
      token,
      user: buildUserResponse(newUser),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login an existing user.
 */
const loginUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      role: user.role,
      user: buildUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send OTP for forgot password.
 */
const forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await PasswordResetOTP.deleteMany({ email: email.toLowerCase() });

    let otpRecord;
    try {
      otpRecord = await PasswordResetOTP.create({
        email: email.toLowerCase(),
        otp,
        expiresAt,
        createdAt: new Date(),
      });
    } catch (createError) {
      console.error('[OTP CREATE] Failed to create OTP record:', createError.stack || createError);
      return res.status(500).json({ success: false, message: 'Failed to create OTP record' });
    }

    try {
      await sendEmail({
        to: otpRecord.email,
        subject: 'WasteZero Password Reset OTP',
        html: `Hello ${user.fullName},<br><br>Your WasteZero password reset verification code is<br><br><strong>${otp}</strong><br><br>This OTP is valid for 10 minutes.<br><br>Do not share this code with anyone.<br><br>Regards,<br>WasteZero Team`,
      });
    } catch (emailError) {
      console.error('[OTP EMAIL] Failed to send OTP email.');
      console.error('[OTP EMAIL] Error:', emailError.message || emailError);

      await PasswordResetOTP.deleteOne({ _id: otpRecord._id });
      return res.status(500).json({ success: false, message: 'Failed to send OTP email' });
    }

    res.status(200).json({
      success: true,
      message: 'Reset OTP sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify reset password OTP.
 */
<<<<<<< HEAD
<<<<<<< HEAD
const verifyResetOtp = async (req, res, next) => {
=======
const verifyResetOTP = async (req, res, next) => {
>>>>>>> origin/ritika
=======
const verifyResetOtp = async (req, res, next) => {
>>>>>>> main
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const otpRecord = await PasswordResetOTP.findOne({ email: email.toLowerCase() });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP not found' });
    }

    if (otpRecord.expiresAt < new Date()) {
      await PasswordResetOTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password.
 */
const resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, new password, and confirm password are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordPattern.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
      });
    }

    const otpRecord = await PasswordResetOTP.findOne({ email: email.toLowerCase() });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP not found' });
    }

    if (otpRecord.expiresAt < new Date()) {
      await PasswordResetOTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await PasswordResetOTP.deleteOne({ _id: otpRecord._id });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

<<<<<<< HEAD
<<<<<<< HEAD
module.exports = {
  registerUser,
  loginUser,
  sendRegisterOTP,
  verifyRegisterOTP,
  forgotPassword,
  verifyResetOtp,
  resetPassword
};
=======
module.exports = { registerUser, loginUser, sendRegisterOTP, verifyRegisterOTP, forgotPassword, verifyResetOTP, resetPassword };
>>>>>>> origin/ritika
=======
module.exports = { registerUser, loginUser, sendRegisterOTP, verifyRegisterOTP, forgotPassword, verifyResetOTP, resetPassword };
>>>>>>> main
