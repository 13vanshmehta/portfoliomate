const { body, param, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Auth validations
const signupValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('firmId').trim().notEmpty().withMessage('Firm ID is required'),
  validate,
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

const verifyOtpValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  validate,
];

const googleSignInValidation = [
  body('idToken').notEmpty().withMessage('ID token is required'),
  body('firmId').optional().trim().notEmpty().withMessage('Firm ID is required when provided'),
  validate,
];

// Announcement validations
const createAnnouncementValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('body').trim().notEmpty().withMessage('Body is required'),
  body('classificationTags').optional(),
  validate,
];

const updateAnnouncementValidation = [
  param('announcementId').notEmpty().withMessage('Announcement ID is required'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('body').optional().trim().notEmpty().withMessage('Body cannot be empty'),
  body('classificationTags').optional(),
  validate,
];

// User validations
const updateUserValidation = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  validate,
];

const updateEmailValidation = [
  body('newEmail').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  validate,
];

const updatePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  validate,
];

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  validate,
];

const resetPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  validate,
];

// Firm validations
const createFirmValidation = [
  body('firmName').trim().notEmpty().withMessage('Firm name is required'),
  body('firmEmailId').isEmail().normalizeEmail().withMessage('Valid firm email is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  validate,
];

const updateFirmValidation = [
  param('firmId').notEmpty().withMessage('Firm ID is required'),
  body('firmName').optional().trim().notEmpty().withMessage('Firm name cannot be empty'),
  body('firmEmailId').optional().isEmail().normalizeEmail().withMessage('Valid firm email is required'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  validate,
];

// Pagination validation
const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  validate,
];

// Comment validation
const createCommentValidation = [
  param('announcementId').notEmpty().withMessage('Announcement ID is required'),
  body('text').trim().notEmpty().withMessage('Comment text is required'),
  body('parentId').optional().isString(),
  validate,
];

module.exports = {
  signupValidation,
  loginValidation,
  verifyOtpValidation,
  googleSignInValidation,
  createAnnouncementValidation,
  updateAnnouncementValidation,
  updateUserValidation,
  updateEmailValidation,
  updatePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  createFirmValidation,
  updateFirmValidation,
  paginationValidation,
  createCommentValidation,
};
