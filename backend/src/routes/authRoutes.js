const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
  signupValidation,
  loginValidation,
  verifyOtpValidation,
  googleSignInValidation,
} = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting to auth routes
router.use(authLimiter);

// @route   POST /api/v1/auth/signup
// @desc    Register new user with email/password
// @access  Public
router.post('/signup', signupValidation, authController.signup);

// @route   POST /api/v1/auth/verify-otp
// @desc    Verify email with OTP
// @access  Public
router.post('/verify-otp', verifyOtpValidation, authController.verifyOtp);

// @route   POST /api/v1/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, authController.login);

// @route   POST /api/v1/auth/google-signin
// @desc    Google Sign-In
// @access  Public
router.post('/google-signin', googleSignInValidation, authController.googleSignIn);

// @route   POST /api/v1/auth/resend-otp
// @desc    Resend OTP
// @access  Public
router.post('/resend-otp', authController.resendOtp);

module.exports = router;
