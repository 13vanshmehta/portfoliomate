const notificationService = require('../services/notificationService');

// Get user notifications
const getNotifications = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const notifications = await notificationService.getUserNotifications(req.user.uid, limit);

    res.json({
      success: true,
      data: notifications.map(n => n.toJSON()),
    });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    await notificationService.markAsRead(notificationId);

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// Delete notification
const deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    await notificationService.deleteNotification(notificationId);

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Save FCM token
const saveFCMToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required',
      });
    }

    await notificationService.saveFCMToken(req.user.uid, token);

    res.json({
      success: true,
      message: 'FCM token saved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Remove FCM token
const removeFCMToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required',
      });
    }

    await notificationService.removeFCMToken(req.user.uid, token);

    res.json({
      success: true,
      message: 'FCM token removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  deleteNotification,
  saveFCMToken,
  removeFCMToken,
};
