const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
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
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
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
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser };
