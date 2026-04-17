const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// @route   GET /api/v1/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', notificationController.getNotifications);

// @route   PUT /api/v1/notifications/:notificationId/read
// @desc    Mark notification as read
// @access  Private
router.put('/:notificationId/read', notificationController.markAsRead);

// @route   DELETE /api/v1/notifications/:notificationId
// @desc    Delete notification
// @access  Private
router.delete('/:notificationId', notificationController.deleteNotification);

// @route   POST /api/v1/notifications/fcm-token
// @desc    Save FCM token
// @access  Private
router.post('/fcm-token', notificationController.saveFCMToken);

// @route   DELETE /api/v1/notifications/fcm-token
// @desc    Remove FCM token
// @access  Private
router.delete('/fcm-token', notificationController.removeFCMToken);

module.exports = router;
