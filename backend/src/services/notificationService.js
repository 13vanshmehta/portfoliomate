const { db, messaging } = require('../config/firebase');
const Notification = require('../models/Notification');
const { v4: uuidv4 } = require('uuid');

const NOTIFICATIONS_COLLECTION = 'notifications';
const FCM_TOKENS_COLLECTION = 'fcmTokens';

// Create notification in Firestore
const createNotification = async (notificationData) => {
  const notificationId = uuidv4();
  const notificationRef = db().collection(NOTIFICATIONS_COLLECTION).doc(notificationId);
  const notification = new Notification({ notificationId, ...notificationData });
  await notificationRef.set(notification.toJSON());
  return notification;
};

// Send push notification via FCM
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    // Get user's FCM tokens
    const tokensSnapshot = await db()
      .collection(FCM_TOKENS_COLLECTION)
      .where('userId', '==', userId)
      .get();

    if (tokensSnapshot.empty) {
      console.log(`No FCM tokens found for user ${userId}`);
      return { success: false, message: 'No FCM tokens found' };
    }

    const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

    const message = {
      notification: {
        title,
        body,
      },
      data,
      tokens,
    };

    const response = await messaging().sendMulticast(message);
    
    // Remove invalid tokens
    if (response.failureCount > 0) {
      const tokensToRemove = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          tokensToRemove.push(tokens[idx]);
        }
      });
      
      // Delete invalid tokens
      const deletePromises = tokensToRemove.map(async (token) => {
        const tokenDocs = await db()
          .collection(FCM_TOKENS_COLLECTION)
          .where('token', '==', token)
          .get();
        return Promise.all(tokenDocs.docs.map(doc => doc.ref.delete()));
      });
      
      await Promise.all(deletePromises);
    }

    return { success: true, response };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
};

// Create and send notification (async background task)
const notifyUser = async (userId, type, title, body, relatedData = {}) => {
  try {
    // Create notification in database
    await createNotification({
      userId,
      type,
      title,
      body,
      ...relatedData,
    });

    // Send push notification
    await sendPushNotification(userId, title, body, {
      type,
      ...relatedData,
    });
  } catch (error) {
    console.error('Error in notifyUser for userId:', userId, error);
  }
};

// Notify all users in a firm (for new announcements)
const notifyFirm = async (firmId, excludeUserId, type, title, body, relatedData = {}) => {
  // Run asynchronously without blocking the main thread response
  setImmediate(async () => {
    try {
      if (!firmId) {
        console.error('Cannot notify firm: firmId is missing');
        await notifyUser(excludeUserId, type, title, body, relatedData);
        return;
      }
      
      // Get all users in the firm
      const usersSnapshot = await db()
        .collection('users')
        .where('firmId', '==', String(firmId).trim())
        .get();

      const notificationPromises = [];
      
      // Force sending to the creator exactly once so you can always test your own posts
      notificationPromises.push(notifyUser(excludeUserId, type, title, body, relatedData));

      // Send to everyone else in the firm
      usersSnapshot.forEach(doc => {
        if (doc.id !== excludeUserId) {
          notificationPromises.push(notifyUser(doc.id, type, title, body, relatedData));
        }
      });

      await Promise.all(notificationPromises);
      console.log(`Notification completely sent to ${notificationPromises.length} users in firm: ${firmId}`);
    } catch (error) {
      console.error('Error in notifyFirm:', error);
    }
  });
};

// Get notifications for a user
const getUserNotifications = async (userId, limit = 50) => {
  const snapshot = await db()
    .collection(NOTIFICATIONS_COLLECTION)
    .where('userId', '==', userId)
    .limit(limit)
    .get();

  const notifications = snapshot.docs.map(doc => new Notification({ notificationId: doc.id, ...doc.data() }));
  
  // Sort in memory to avoid requiring a Firebase composite index
  return notifications.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA; // Descending
  });
};

// Mark notification as read
const markAsRead = async (notificationId) => {
  const notificationRef = db().collection(NOTIFICATIONS_COLLECTION).doc(notificationId);
  await notificationRef.update({ isRead: true });
  return { success: true };
};

// Delete notification
const deleteNotification = async (notificationId) => {
  await db().collection(NOTIFICATIONS_COLLECTION).doc(notificationId).delete();
  return { success: true };
};

// Save FCM token for user
const saveFCMToken = async (userId, token) => {
  const tokenId = `${userId}_${token}`;
  const tokenRef = db().collection(FCM_TOKENS_COLLECTION).doc(tokenId);
  await tokenRef.set({
    userId,
    token,
    createdAt: new Date().toISOString(),
  });
  return { success: true };
};

// Remove FCM token
const removeFCMToken = async (userId, token) => {
  const tokenId = `${userId}_${token}`;
  await db().collection(FCM_TOKENS_COLLECTION).doc(tokenId).delete();
  return { success: true };
};

module.exports = {
  createNotification,
  sendPushNotification,
  notifyUser,
  notifyFirm,
  getUserNotifications,
  markAsRead,
  deleteNotification,
  saveFCMToken,
  removeFCMToken,
};
