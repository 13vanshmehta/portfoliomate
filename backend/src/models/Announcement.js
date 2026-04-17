class Announcement {
  constructor(data) {
    this.announcementId = data.announcementId;
    this.title = data.title;
    this.body = data.body;
    this.classificationTags = data.classificationTags || [];
    this.isPinned = data.isPinned || false;
    this.announcedBy = data.announcedBy; // userId
    this.announcedByName = data.announcedByName;
    this.announcedByPhoto = data.announcedByPhoto;
    this.firmId = data.firmId;
    this.mediaUrls = data.mediaUrls || [];
    this.likesCount = data.likesCount || 0;
    this.commentsCount = data.commentsCount || 0;
    this.timestamp = data.timestamp || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  toJSON() {
    return {
      announcementId: this.announcementId,
      title: this.title,
      body: this.body,
      classificationTags: this.classificationTags,
      isPinned: this.isPinned,
      announcedBy: this.announcedBy,
      announcedByName: this.announcedByName,
      announcedByPhoto: this.announcedByPhoto,
      firmId: this.firmId,
      mediaUrls: this.mediaUrls,
      likesCount: this.likesCount,
      commentsCount: this.commentsCount,
      timestamp: this.timestamp,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Announcement;
