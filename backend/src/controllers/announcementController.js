const announcementService = require('../services/announcementService');
const { getUserById } = require('../services/userService');
const { notifyFirm } = require('../services/notificationService');
const uploadService = require('../utils/uploadService');

// Create announcement
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, body, classificationTags, isPinned } = req.body;
    const user = req.user;

    // Get user details
    const userDetails = await getUserById(user.uid);

    // Handle media uploads
    let mediaUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadResults = await uploadService.uploadMultipleFiles(req.files, 'portfoliomate/announcements');
      mediaUrls = uploadResults.map(result => ({
        url: result.url,
        publicId: result.publicId,
        fileName: result.originalName || result.fileName || 'document',
        contentType: result.contentType || 'application/octet-stream',
        size: result.size,
        resourceType: result.resourceType,
      }));
    }

    // Parse logic for array inputs if sent from FormData
    let tagsArray = [];
    if (classificationTags) {
      if (Array.isArray(classificationTags)) {
        tagsArray = classificationTags;
      } else if (typeof classificationTags === 'string') {
        try {
          tagsArray = JSON.parse(classificationTags);
        } catch {
          tagsArray = [classificationTags];
        }
      }
    }

    const announcementData = {
      title,
      body,
      classificationTags: tagsArray,
      isPinned: isPinned === 'true' || isPinned === true,
      announcedBy: user.uid,
      announcedByName: `${userDetails.firstName} ${userDetails.lastName}`,
      announcedByPhoto: userDetails.profilePhotoUrl,
      firmId: user.firmId,
      mediaUrls: mediaUrls.map(m => m.url), // store just the URLs for frontend ease, or modify frontend to handle objects. Since frontend expects strings, we stay compliant.
    };

    const announcement = await announcementService.createAnnouncement(announcementData);

    // Send notifications to all users in the firm (async)
    notifyFirm(
      user.firmId,
      user.uid,
      'announcement',
      'New Announcement',
      `${userDetails.firstName} ${userDetails.lastName} posted: ${title}`,
      { relatedAnnouncementId: announcement.announcementId }
    );

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// Get announcements by firm (with pagination)
const getAnnouncementsByFirm = async (req, res, next) => {
  try {
    const { firmId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const lastDocId = req.query.lastDocId;

    // Check if user has access to this firm
    if (req.user.firmId !== firmId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this firm',
      });
    }

    let lastDoc = null;
    if (lastDocId) {
      const { db } = require('../config/firebase');
      lastDoc = await db().collection('announcements').doc(lastDocId).get();
    }

    const result = await announcementService.getAnnouncementsByFirm(firmId, page, limit, lastDoc);

    res.json({
      success: true,
      data: {
        announcements: result.announcements.map(a => a.toJSON()),
        page,
        limit,
        hasMore: result.hasMore,
        lastDocId: result.lastVisible?.id || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get single announcement
const getAnnouncement = async (req, res, next) => {
  try {
    const { announcementId } = req.params;

    const announcement = await announcementService.getAnnouncementById(announcementId);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    // Check if user has access
    if (req.user.firmId !== announcement.firmId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this announcement',
      });
    }

    // Check if user has liked
    const hasLiked = await announcementService.getLikeStatus(announcementId, req.user.uid);

    res.json({
      success: true,
      data: {
        ...announcement.toJSON(),
        hasLiked,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update announcement
const updateAnnouncement = async (req, res, next) => {
  try {
    const { announcementId } = req.params;
    const { title, body, classificationTags } = req.body;

    const announcement = await announcementService.getAnnouncementById(announcementId);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    // Check if user is the author
    if (announcement.announcedBy !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own announcements',
      });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (body) updateData.body = body;
    if (classificationTags) updateData.classificationTags = classificationTags;

    const updatedAnnouncement = await announcementService.updateAnnouncement(announcementId, updateData);

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: updatedAnnouncement.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// Delete announcement
const deleteAnnouncement = async (req, res, next) => {
  try {
    const { announcementId } = req.params;

    const announcement = await announcementService.getAnnouncementById(announcementId);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    // Check if user is the author
    if (announcement.announcedBy !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own announcements',
      });
    }

    // Delete media files from Cloudinary
    if (announcement.mediaUrls && announcement.mediaUrls.length > 0) {
      const deletePromises = announcement.mediaUrls.map(mediaUrl => {
        // Extract resource type and public_id from Cloudinary URL
        // URL format: https://res.cloudinary.com/<cloud_name>/<resource_type>/upload/v<version>/<public_id>.<ext>
        let resourceType = 'image';
        let publicId = null;

        try {
          const urlParts = mediaUrl.split('/');
          const uploadIndex = urlParts.indexOf('upload');
          
          if (uploadIndex !== -1) {
            resourceType = urlParts[uploadIndex - 1]; // usually 'image', 'video', or 'raw'
            // Keep everything after /upload/v.../ up to the file extension
            // Sometimes there's no version if not strictly required, but usually there's a vXXXX
            const afterUpload = urlParts.slice(uploadIndex + 1);
            if (afterUpload[0].startsWith('v')) {
              afterUpload.shift(); // remove version
            }
            // Join what's left and remove the file extension for images/videos
            const fullPath = afterUpload.join('/');
            publicId = fullPath;
            if (resourceType !== 'raw' && fullPath.lastIndexOf('.') !== -1) {
              publicId = fullPath.substring(0, fullPath.lastIndexOf('.'));
            }
          }
        } catch (err) {
          console.error('Error parsing Cloudinary URL', err);
        }

        if (!publicId) return Promise.resolve();

        return uploadService.deleteFile(publicId, resourceType).catch(err => {
          console.error(`Failed to delete file ${publicId}:`, err);
          // Continue even if delete fails
        });
      });
      
      await Promise.all(deletePromises);
    }

    await announcementService.deleteAnnouncement(announcementId);

    res.json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Toggle like
const toggleLike = async (req, res, next) => {
  try {
    const { announcementId } = req.params;

    const announcement = await announcementService.getAnnouncementById(announcementId);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    // Check if user has access
    if (req.user.firmId !== announcement.firmId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this announcement',
      });
    }

    const userDetails = await getUserById(req.user.uid);
    const result = await announcementService.toggleLike(
      announcementId,
      req.user.uid,
      `${userDetails.firstName} ${userDetails.lastName}`,
      userDetails.profilePhotoUrl
    );

    // Notify announcement author if liked
    if (result.liked && announcement.announcedBy !== req.user.uid) {
      const { notifyUser } = require('../services/notificationService');
      notifyUser(
        announcement.announcedBy,
        'like',
        'New Like',
        `${userDetails.firstName} ${userDetails.lastName} liked your announcement`,
        { relatedAnnouncementId: announcementId, relatedUserId: req.user.uid }
      );
    }

    res.json({
      success: true,
      message: result.liked ? 'Announcement liked' : 'Announcement unliked',
      data: {
        liked: result.liked,
        likesCount: result.likesCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add comment
const addComment = async (req, res, next) => {
  try {
    const { announcementId } = req.params;
    const { text, parentId } = req.body;

    const announcement = await announcementService.getAnnouncementById(announcementId);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    // Check if user has access
    if (req.user.firmId !== announcement.firmId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this announcement',
      });
    }

    const userDetails = await getUserById(req.user.uid);
    const result = await announcementService.addComment({
      announcementId,
      userId: req.user.uid,
      userName: `${userDetails.firstName} ${userDetails.lastName}`,
      userPhoto: userDetails.profilePhotoUrl,
      text,
      parentId: parentId || null
    });

    // Notify announcement author
    if (announcement.announcedBy !== req.user.uid) {
      const { notifyUser } = require('../services/notificationService');
      notifyUser(
        announcement.announcedBy,
        'comment',
        'New Comment',
        `${userDetails.firstName} ${userDetails.lastName} commented on your announcement`,
        { relatedAnnouncementId: announcementId, relatedUserId: req.user.uid }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment: result.comment,
        commentsCount: result.commentsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get comments
const getComments = async (req, res, next) => {
  try {
    const { announcementId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const announcement = await announcementService.getAnnouncementById(announcementId);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    // Check if user has access
    if (req.user.firmId !== announcement.firmId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this announcement',
      });
    }

    const comments = await announcementService.getCommentsByAnnouncement(announcementId, limit);

    res.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
};

// Delete comment
const deleteComment = async (req, res, next) => {
  try {
    const { announcementId, commentId } = req.params;

    const announcement = await announcementService.getAnnouncementById(announcementId);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    // Get comment to check ownership
    const comments = await announcementService.getCommentsByAnnouncement(announcementId);
    const comment = comments.find(c => c.commentId === commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check if user is the comment author or announcement author
    if (comment.userId !== req.user.uid && announcement.announcedBy !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments',
      });
    }

    const result = await announcementService.deleteComment(commentId, announcementId);

    res.json({
      success: true,
      message: 'Comment deleted successfully',
      data: {
        commentsCount: result.commentsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAnnouncement,
  getAnnouncementsByFirm,
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleLike,
  addComment,
  getComments,
  deleteComment,
};
