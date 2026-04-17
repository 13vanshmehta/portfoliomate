const express = require('express');
const router = express.Router();
const multer = require('multer');
const announcementController = require('../controllers/announcementController');
const { authenticate, checkFirmAccess } = require('../middleware/auth');
const {
  createAnnouncementValidation,
  updateAnnouncementValidation,
  paginationValidation,
  createCommentValidation,
} = require('../middleware/validation');

// Configure multer for file uploads (no size limit as per requirements)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file (can be adjusted)
  },
});

// All routes require authentication
router.use(authenticate);

// @route   POST /api/v1/announcements
// @desc    Create new announcement
// @access  Private
router.post(
  '/',
  upload.array('media', 50), // Allow up to 50 files
  createAnnouncementValidation,
  announcementController.createAnnouncement
);

// @route   GET /api/v1/announcements/firm/:firmId
// @desc    Get announcements by firm (with pagination)
// @access  Private
router.get(
  '/firm/:firmId',
  checkFirmAccess,
  paginationValidation,
  announcementController.getAnnouncementsByFirm
);

// @route   GET /api/v1/announcements/:announcementId
// @desc    Get single announcement
// @access  Private
router.get('/:announcementId', announcementController.getAnnouncement);

// @route   PUT /api/v1/announcements/:announcementId
// @desc    Update announcement
// @access  Private
router.put('/:announcementId', updateAnnouncementValidation, announcementController.updateAnnouncement);

// @route   DELETE /api/v1/announcements/:announcementId
// @desc    Delete announcement
// @access  Private
router.delete('/:announcementId', announcementController.deleteAnnouncement);

// @route   POST /api/v1/announcements/:announcementId/like
// @desc    Toggle like on announcement
// @access  Private
router.post('/:announcementId/like', announcementController.toggleLike);

// @route   POST /api/v1/announcements/:announcementId/comments
// @desc    Add comment to announcement
// @access  Private
router.post('/:announcementId/comments', createCommentValidation, announcementController.addComment);

// @route   GET /api/v1/announcements/:announcementId/comments
// @desc    Get comments for announcement
// @access  Private
router.get('/:announcementId/comments', announcementController.getComments);

// @route   DELETE /api/v1/announcements/:announcementId/comments/:commentId
// @desc    Delete comment
// @access  Private
router.delete('/:announcementId/comments/:commentId', announcementController.deleteComment);

module.exports = router;
