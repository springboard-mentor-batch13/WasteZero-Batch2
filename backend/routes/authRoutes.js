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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistration'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already registered or username already taken
 */
router.post(
  '/register',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('confirmPassword').notEmpty().withMessage('Confirm password is required'),
    body('role').notEmpty().withMessage('Role is required').isIn(allowedRoles).withMessage('Invalid role'),
  ],
  registerUser
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login an existing user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  loginUser
);

router.post(
  '/send-register-otp',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('confirmPassword').notEmpty().withMessage('Confirm password is required'),
    body('role').notEmpty().withMessage('Role is required').isIn(allowedRoles).withMessage('Invalid role'),
  ],
  sendRegisterOTP
);

router.post(
  '/verify-register-otp',
  [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('otp').trim().notEmpty().withMessage('OTP is required'),
  ],
  verifyRegisterOTP
);

// Send password reset OTP
router.post(
  '/forgot-password',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address')
  ],
  forgotPassword
);


// Verify password reset OTP
router.post(
  '/verify-reset-otp',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address'),

    body('otp')
      .trim()
      .notEmpty()
      .withMessage('OTP is required')
  ],
  verifyResetOtp
);


// Reset password
router.post(
  '/reset-password',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address'),

    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),

    body('confirmPassword')
      .notEmpty()
      .withMessage('Confirm password is required')
  ],
  resetPassword
);

router.get('/protected', protect, authorizeRoles(...allowedRoles), (req, res) => {
  res.status(200).json({ success: true, message: 'Access granted', user: req.user });
});

router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Please enter a valid email address'),
  ],
  forgotPassword
);

router.post(
  '/verify-reset-otp',
  [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('otp').trim().notEmpty().withMessage('OTP is required'),
  ],
  verifyResetOTP
);

router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('otp').trim().notEmpty().withMessage('OTP is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('confirmPassword').notEmpty().withMessage('Confirm password is required'),
  ],
  resetPassword
);

module.exports = router;
