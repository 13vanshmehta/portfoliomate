class Notification {
  constructor(data) {
    this.notificationId = data.notificationId;
    this.userId = data.userId;
    this.type = data.type; // 'announcement', 'like', 'comment'
    this.title = data.title;
    this.body = data.body;
    this.relatedAnnouncementId = data.relatedAnnouncementId || null;
    this.relatedUserId = data.relatedUserId || null;
    this.isRead = data.isRead || false;
    this.timestamp = data.timestamp || new Date().toISOString();
  }

  toJSON() {
    return {
      notificationId: this.notificationId,
      userId: this.userId,
      type: this.type,
      title: this.title,
      body: this.body,
      relatedAnnouncementId: this.relatedAnnouncementId,
      relatedUserId: this.relatedUserId,
      isRead: this.isRead,
      timestamp: this.timestamp,
    };
  }
}

module.exports = Notification;
