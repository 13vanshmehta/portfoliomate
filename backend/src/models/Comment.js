class Comment {
  constructor(data) {
    this.commentId = data.commentId;
    this.announcementId = data.announcementId;
    this.userId = data.userId;
    this.userName = data.userName;
    this.userPhoto = data.userPhoto;
    this.text = data.text;
    this.timestamp = data.timestamp || new Date().toISOString();
  }

  toJSON() {
    return {
      commentId: this.commentId,
      announcementId: this.announcementId,
      userId: this.userId,
      userName: this.userName,
      userPhoto: this.userPhoto,
      text: this.text,
      timestamp: this.timestamp,
    };
  }
}

module.exports = Comment;
