const express = require('express');
const router = express.Router();
const multer = require('multer');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const {
  updateUserValidation,
  updateEmailValidation,
  updatePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require('../middleware/validation');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for profile photos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

// @route   GET /api/v1/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', userController.getProfile);

// @route   PUT /api/v1/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', updateUserValidation, userController.updateProfile);

// @route   POST /api/v1/users/profile-photo
// @desc    Upload profile photo
// @access  Private
router.post('/profile-photo', upload.single('photo'), userController.uploadProfilePhoto);

// @route   DELETE /api/v1/users/profile-photo
// @desc    Delete profile photo
// @access  Private
router.delete('/profile-photo', userController.deleteProfilePhoto);

// @route   POST /api/v1/users/request-email-change
// @desc    Request email change (sends OTP)
// @access  Private
router.post('/request-email-change', userController.requestEmailChange);

// @route   PUT /api/v1/users/email
// @desc    Update email with OTP verification
// @access  Private
router.put('/email', updateEmailValidation, userController.updateEmail);

// @route   PUT /api/v1/users/password
// @desc    Update password
// @access  Private
router.put('/password', updatePasswordValidation, userController.updatePassword);

// @route   POST /api/v1/users/forgot-password
// @desc    Forgot password (sends OTP)
// @access  Public (but placed here for organization)
router.post('/forgot-password', forgotPasswordValidation, userController.forgotPassword);

// @route   POST /api/v1/users/reset-password
// @desc    Reset password with OTP
// @access  Public (but placed here for organization)
router.post('/reset-password', resetPasswordValidation, userController.resetPassword);

// @route   DELETE /api/v1/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', userController.deleteAccount);

module.exports = router;
