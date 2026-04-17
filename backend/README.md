# PortfolioMate Announcement System - Backend

Production-ready backend API for the PortfolioMate announcement system with Firebase, Redis, and Express.js.

## 🚀 Quick Start

**New to this project?** Start here: **[README_FIRST.md](./README_FIRST.md)**

### Setup Guides
- 📖 **[QUICK_START.md](./QUICK_START.md)** - Get running in 10 minutes
- 📖 **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete detailed setup
- 📖 **[ENV_CHECKLIST.md](./ENV_CHECKLIST.md)** - Step-by-step .env configuration

### Service-Specific Guides
- 📖 **[CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md)** - Cloudinary media storage setup
- 📖 **[REDIS_CLOUD_SETUP.md](./REDIS_CLOUD_SETUP.md)** - Redis Cloud cache setup
- 📖 **[CHANGES_SUMMARY.md](./CHANGES_SUMMARY.md)** - Recent changes and updates

---

## Features

- ✅ Email/Password & Google Sign-In Authentication (Firebase Auth)
- ✅ OTP Email Verification
- ✅ Firm-based Access Control
- ✅ Real-time Announcements with Firestore Listeners
- ✅ Pagination (20 posts per page)
- ✅ Redis Cache for Likes & Comments
- ✅ Unlimited Media Attachments (Cloudinary CDN)
- ✅ Push Notifications (Firebase Cloud Messaging)
- ✅ Production-grade Security & Rate Limiting
- ✅ Comprehensive Error Handling

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Storage**: Cloudinary (25GB free)
- **Cache**: Redis Cloud (30MB free)
- **Authentication**: Firebase Auth
- **Notifications**: Firebase Cloud Messaging

## Project Structure

```
backend/
├── src/
│   ├── config/          # Firebase, Redis, Cloudinary configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth, validation, error handling
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions (upload, cache, OTP)
│   └── server.js        # Entry point
├── .env.example         # Environment variables template
├── .gitignore
├── package.json
├── README_FIRST.md      # 👈 START HERE!
├── QUICK_START.md       # 10-minute setup
├── SETUP_GUIDE.md       # Detailed setup
└── README.md            # This file (API docs)
```

## Setup Instructions

### Prerequisites

- Node.js v18 or higher
- Redis server
- Firebase project with:
  - Firestore Database
  - Firebase Storage
  - Firebase Authentication (Email/Password & Google)
  - Firebase Cloud Messaging

### Installation

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment Variables**

   Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

   Fill in the following variables:

   **Server Configuration:**
   ```env
   PORT=5000
   NODE_ENV=development
   ```

   **Firebase Configuration:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Copy the values from the downloaded JSON file:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY_ID=your-private-key-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=your-client-id
   FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
   FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com
   FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   ```

   **Redis Configuration:**
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=0
   ```

   **Email Configuration (for OTP):**
   - For Gmail, enable 2FA and generate an App Password
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

   **CORS Configuration:**
   ```env
   CORS_ORIGIN=http://localhost:3000
   ```

3. **Setup Firebase**

   - Enable Authentication methods:
     - Email/Password
     - Google Sign-In
   
   - Create Firestore Database (Start in production mode)
   
   - Setup Firestore Security Rules:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth.uid == userId;
       }
       
       match /firms/{firmId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
       
       match /announcements/{announcementId} {
         allow read: if request.auth != null && 
           resource.data.firmId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.firmId;
         allow create: if request.auth != null;
         allow update, delete: if request.auth != null && 
           resource.data.announcedBy == request.auth.uid;
       }
       
       match /likes/{likeId} {
         allow read, write: if request.auth != null;
       }
       
       match /comments/{commentId} {
         allow read: if request.auth != null;
         allow create: if request.auth != null;
         allow delete: if request.auth != null && 
           resource.data.userId == request.auth.uid;
       }
       
       match /notifications/{notificationId} {
         allow read, delete: if request.auth != null && 
           resource.data.userId == request.auth.uid;
         allow create: if request.auth != null;
       }
       
       match /fcmTokens/{tokenId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

   - Setup Storage Rules:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /announcements/{allPaths=**} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
       
       match /profile-photos/{allPaths=**} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
     }
   }
   ```

   - Create Firestore Indexes (if needed):
     - Collection: `announcements`
       - Fields: `firmId` (Ascending), `timestamp` (Descending)

4. **Start Redis Server**
   ```bash
   redis-server
   ```

5. **Run the Server**

   Development mode:
   ```bash
   npm run dev
   ```

   Production mode:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Register with email/password
- `POST /api/v1/auth/verify-otp` - Verify email with OTP
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/google-signin` - Google Sign-In
- `POST /api/v1/auth/resend-otp` - Resend OTP

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update profile
- `POST /api/v1/users/profile-photo` - Upload profile photo
- `DELETE /api/v1/users/profile-photo` - Delete profile photo
- `POST /api/v1/users/request-email-change` - Request email change
- `PUT /api/v1/users/email` - Update email
- `PUT /api/v1/users/password` - Update password
- `POST /api/v1/users/forgot-password` - Forgot password
- `POST /api/v1/users/reset-password` - Reset password
- `DELETE /api/v1/users/account` - Delete account

### Firms
- `POST /api/v1/firms` - Create firm
- `GET /api/v1/firms` - Get all firms
- `GET /api/v1/firms/:firmId` - Get firm by ID
- `PUT /api/v1/firms/:firmId` - Update firm
- `DELETE /api/v1/firms/:firmId` - Delete firm

### Announcements
- `POST /api/v1/announcements` - Create announcement
- `GET /api/v1/announcements/firm/:firmId` - Get firm announcements (paginated)
- `GET /api/v1/announcements/:announcementId` - Get single announcement
- `PUT /api/v1/announcements/:announcementId` - Update announcement
- `DELETE /api/v1/announcements/:announcementId` - Delete announcement
- `POST /api/v1/announcements/:announcementId/like` - Toggle like
- `POST /api/v1/announcements/:announcementId/comments` - Add comment
- `GET /api/v1/announcements/:announcementId/comments` - Get comments
- `DELETE /api/v1/announcements/:announcementId/comments/:commentId` - Delete comment

### Notifications
- `GET /api/v1/notifications` - Get user notifications
- `PUT /api/v1/notifications/:notificationId/read` - Mark as read
- `DELETE /api/v1/notifications/:notificationId` - Delete notification
- `POST /api/v1/notifications/fcm-token` - Save FCM token
- `DELETE /api/v1/notifications/fcm-token` - Remove FCM token

## Authentication Flow

### Email/Password Signup
1. Client calls `POST /api/v1/auth/signup`
2. Server creates Firebase Auth user
3. Server sends OTP to email
4. Client calls `POST /api/v1/auth/verify-otp`
5. Server verifies OTP and marks email as verified

### Login
1. Client authenticates with Firebase Auth SDK (client-side)
2. Client receives ID token
3. Client includes token in `Authorization: Bearer <token>` header
4. Server verifies token on each request

### Google Sign-In
1. Client authenticates with Google (Firebase Auth SDK)
2. Client receives ID token
3. Client calls `POST /api/v1/auth/google-signin` with token
4. Server creates/updates user and returns user data

## Real-time Features

### Firestore Listeners (Frontend Implementation)
```javascript
// Listen to announcements in real-time
const unsubscribe = db.collection('announcements')
  .where('firmId', '==', userFirmId)
  .orderBy('timestamp', 'desc')
  .limit(20)
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        // New announcement
      }
      if (change.type === 'modified') {
        // Updated announcement
      }
      if (change.type === 'removed') {
        // Deleted announcement
      }
    });
  });
```

## Redis Cache Strategy

- Likes and comments are cached in Redis
- Cache syncs to Firestore every 60 seconds (configurable)
- Reduces database load significantly
- Automatic cache invalidation on announcement deletion

## Security Features

- Helmet.js for security headers
- Rate limiting (100 requests per 15 minutes)
- Auth rate limiting (5 attempts per 15 minutes)
- CORS configuration
- Input validation with express-validator
- Firm-based access control
- Firebase Auth token verification

## Error Handling

All errors return consistent JSON format:
```json
{
  "success": false,
  "message": "Error message",
  "errors": [] // Optional validation errors
}
```

## Testing

Health check:
```bash
curl http://localhost:5000/api/v1/health
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a process manager (PM2):
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name portfoliomate-api
   ```
3. Setup reverse proxy (Nginx)
4. Enable HTTPS
5. Configure Redis persistence
6. Setup monitoring and logging

## License

ISC
