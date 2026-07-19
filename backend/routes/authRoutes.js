const express = require('express');
const { body } = require('express-validator');

const {
  registerUser,
  loginUser,
  sendRegisterOTP,
  verifyRegisterOTP,
  forgotPassword,
  verifyResetOtp,
  resetPassword
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles, allowedRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 */
router.post(
  '/register',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('confirmPassword')
      .notEmpty()
      .withMessage('Confirm password is required'),
    body('role')
      .notEmpty()
      .withMessage('Role is required')
      .isIn(allowedRoles)
      .withMessage('Invalid role'),
  ],
  registerUser
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 */
router.post(
  '/login',
  [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required'),

    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  loginUser
);

router.post(
  '/send-register-otp',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('confirmPassword')
      .notEmpty()
      .withMessage('Confirm password is required'),
    body('role')
      .notEmpty()
      .withMessage('Role is required')
      .isIn(allowedRoles)
      .withMessage('Invalid role'),
  ],
  sendRegisterOTP
);

router.post(
  '/verify-register-otp',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address'),

    body('otp')
      .trim()
      .notEmpty()
      .withMessage('OTP is required'),
  ],
  verifyRegisterOTP
);

router.post(
  '/forgot-password',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address'),
  ],
  forgotPassword
);

router.post(
  '/verify-reset-otp',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address'),

    body('otp')
      .trim()
      .notEmpty()
      .withMessage('OTP is required'),
  ],
  verifyResetOtp
);

router.post(
  '/reset-password',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address'),

    body('otp')
      .trim()
      .notEmpty()
      .withMessage('OTP is required'),

    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),

    body('confirmPassword')
      .notEmpty()
      .withMessage('Confirm password is required'),
  ],
  resetPassword
);

router.get(
  '/protected',
  protect,
  authorizeRoles(...allowedRoles),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Access granted',
      user: req.user,
    });
  }
);

module.exports = router;
