class User {
  constructor(data) {
    this.userId = data.userId;
    this.emailId = data.emailId;
    this.password = data.password || null; // null for Google sign-in users
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.firmId = data.firmId;
    this.profilePhotoUrl = data.profilePhotoUrl || null;
    this.authProvider = data.authProvider; // 'email' or 'google'
    this.isEmailVerified = data.isEmailVerified || false;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  toJSON() {
    return {
      userId: this.userId,
      emailId: this.emailId,
      firstName: this.firstName,
      lastName: this.lastName,
      firmId: this.firmId,
      profilePhotoUrl: this.profilePhotoUrl,
      authProvider: this.authProvider,
      isEmailVerified: this.isEmailVerified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  getInitials() {
    return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`.toUpperCase();
  }
}

module.exports = User;
