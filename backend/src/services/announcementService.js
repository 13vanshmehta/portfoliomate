const { db } = require('../config/firebase');
const Announcement = require('../models/Announcement');
const { v4: uuidv4 } = require('uuid');

const ANNOUNCEMENTS_COLLECTION = 'announcements';
const LIKES_COLLECTION = 'likes';
const COMMENTS_COLLECTION = 'comments';

/**
 * Create a new announcement
 */
const createAnnouncement = async (announcementData) => {
  const announcementId = uuidv4();
  const announcementRef = db().collection(ANNOUNCEMENTS_COLLECTION).doc(announcementId);
  const announcement = new Announcement({ announcementId, ...announcementData });
  await announcementRef.set(announcement.toJSON());
  
  return announcement;
};

/**
 * Get announcement by ID with real-time counts
 */
const getAnnouncementById = async (announcementId) => {
  const announcementDoc = await db().collection(ANNOUNCEMENTS_COLLECTION).doc(announcementId).get();
  
  if (!announcementDoc.exists) {
    return null;
  }
  
  const announcement = new Announcement({ announcementId: announcementDoc.id, ...announcementDoc.data() });
  
  // Get real-time counts from Firestore
  const likesCount = await getLikesCount(announcementId);
  const commentsCount = await getCommentsCount(announcementId);
  
  announcement.likesCount = likesCount;
  announcement.commentsCount = commentsCount;
  
  return announcement;
};

/**
 * Get announcements by firm with pagination
 */
const getAnnouncementsByFirm = async (firmId, page = 1, limit = 20, lastDoc = null) => {
  let query = db()
    .collection(ANNOUNCEMENTS_COLLECTION)
    .where('firmId', '==', firmId)
    .orderBy('timestamp', 'desc')
    .limit(limit);

  if (lastDoc) {
    query = query.startAfter(lastDoc);
  }

  const snapshot = await query.get();
  
  const announcements = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const announcement = new Announcement({ announcementId: doc.id, ...doc.data() });
      
      // Get real-time counts
      const likesCount = await getLikesCount(announcement.announcementId);
      const commentsCount = await getCommentsCount(announcement.announcementId);
      
      announcement.likesCount = likesCount;
      announcement.commentsCount = commentsCount;
      
      return announcement;
    })
  );

  return {
    announcements,
    lastVisible: snapshot.docs[snapshot.docs.length - 1],
    hasMore: snapshot.docs.length === limit,
  };
};

/**
 * Update announcement
 */
const updateAnnouncement = async (announcementId, updateData) => {
  const announcementRef = db().collection(ANNOUNCEMENTS_COLLECTION).doc(announcementId);
  updateData.updatedAt = new Date().toISOString();
  await announcementRef.update(updateData);
  return await getAnnouncementById(announcementId);
};

/**
 * Delete announcement and all associated data
 */
const deleteAnnouncement = async (announcementId) => {
  // Delete announcement
  await db().collection(ANNOUNCEMENTS_COLLECTION).doc(announcementId).delete();
  
  // Delete associated likes
  const likesSnapshot = await db()
    .collection(LIKES_COLLECTION)
    .where('announcementId', '==', announcementId)
    .get();
  
  const likesDeletePromises = likesSnapshot.docs.map(doc => doc.ref.delete());
  await Promise.all(likesDeletePromises);
  
  // Delete associated comments
  const commentsSnapshot = await db()
    .collection(COMMENTS_COLLECTION)
    .where('announcementId', '==', announcementId)
    .get();
  
  const commentsDeletePromises = commentsSnapshot.docs.map(doc => doc.ref.delete());
  await Promise.all(commentsDeletePromises);
  
  return { success: true };
};

/**
 * Get likes count for an announcement
 */
const getLikesCount = async (announcementId) => {
  const likesSnapshot = await db()
    .collection(LIKES_COLLECTION)
    .where('announcementId', '==', announcementId)
    .get();
  
  return likesSnapshot.size;
};

/**
 * Get comments count for an announcement
 */
const getCommentsCount = async (announcementId) => {
  const commentsSnapshot = await db()
    .collection(COMMENTS_COLLECTION)
    .where('announcementId', '==', announcementId)
    .get();
  
  return commentsSnapshot.size;
};

/**
 * Toggle like on an announcement
 */
const toggleLike = async (announcementId, userId, userName, userPhoto) => {
  const likeId = `${announcementId}_${userId}`;
  const likeRef = db().collection(LIKES_COLLECTION).doc(likeId);
  const likeDoc = await likeRef.get();

  if (likeDoc.exists) {
    // Unlike
    await likeRef.delete();
    const likesCount = await getLikesCount(announcementId);
    return { liked: false, likesCount };
  } else {
    // Like
    await likeRef.set({
      announcementId,
      userId,
      userName,
      userPhoto,
      timestamp: new Date().toISOString(),
    });
    const likesCount = await getLikesCount(announcementId);
    return { liked: true, likesCount };
  }
};

/**
 * Check if user has liked an announcement
 */
const getLikeStatus = async (announcementId, userId) => {
  const likeId = `${announcementId}_${userId}`;
  const likeDoc = await db().collection(LIKES_COLLECTION).doc(likeId).get();
  return likeDoc.exists;
};

/**
 * Add a comment to an announcement
 */
const addComment = async (commentData) => {
  const commentId = uuidv4();
  const commentRef = db().collection(COMMENTS_COLLECTION).doc(commentId);
  
  const comment = {
    commentId,
    ...commentData,
    timestamp: new Date().toISOString(),
  };
  
  await commentRef.set(comment);
  
  const commentsCount = await getCommentsCount(commentData.announcementId);
  
  return { comment, commentsCount };
};

/**
 * Get comments for an announcement
 */
const getCommentsByAnnouncement = async (announcementId, limit = 50) => {
  const snapshot = await db()
    .collection(COMMENTS_COLLECTION)
    .where('announcementId', '==', announcementId)
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => ({ commentId: doc.id, ...doc.data() }));
};

/**
 * Delete a comment
 */
const deleteComment = async (commentId, announcementId) => {
  await db().collection(COMMENTS_COLLECTION).doc(commentId).delete();
  
  const commentsCount = await getCommentsCount(announcementId);
  
  return { success: true, commentsCount };
};

module.exports = {
  createAnnouncement,
  getAnnouncementById,
  getAnnouncementsByFirm,
  updateAnnouncement,
  deleteAnnouncement,
  toggleLike,
  getLikeStatus,
  addComment,
  getCommentsByAnnouncement,
  deleteComment,
  getLikesCount,
  getCommentsCount,
};
