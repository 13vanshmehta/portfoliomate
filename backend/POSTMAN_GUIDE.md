# Postman Testing Guide

This guide covers every HTTP endpoint currently mounted by the backend in `src/server.js` and `src/routes/*.js`.

## Scope

- Root route: `GET /`
- Health route: `GET /api/v1/health`
- Auth routes: 5
- User routes: 10
- Firm routes: 5
- Announcement routes: 9
- Notification routes: 5

## Prerequisites

1. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```
2. Make sure Firebase, Firestore, Cloudinary, and email credentials are configured in `.env`.
3. Use Postman Desktop or the Postman Desktop Agent if you want to test file uploads.
4. Have access to the mailbox used for OTP-based flows.

## Important Implementation Notes

These are not assumptions. They are based on the current backend code.

- Protected endpoints accept either:
  - the backend JWT returned by `POST /api/v1/auth/login` or `POST /api/v1/auth/google-signin`
  - a Firebase ID token
- OTPs are stored in memory, not in Redis or Firestore. They normally expire after 10 minutes, and all pending OTPs are lost if the server restarts.
- `POST /api/v1/users/forgot-password` and `POST /api/v1/users/reset-password` are described as public in route comments, but they currently require `Authorization: Bearer <token>` because `authenticate` is applied before those routes in `src/routes/userRoutes.js`.
- `POST /api/v1/auth/login` requires a non-empty `password` field by validation, but the current controller only checks that the user exists and has verified email.
- `PUT /api/v1/users/password` requires `currentPassword`, but the current controller does not verify it server-side.
- `POST /api/v1/users/request-email-change` expects `newEmail` in the JSON body even though there is no express-validator middleware on that route.
- `DELETE /api/v1/notifications/fcm-token` expects a JSON body with `token`. Postman supports request bodies on `DELETE`.
- OTP routes call the mailer, but mail delivery failures are not surfaced as HTTP errors by the current controller flow. If OTP emails are not arriving, check backend logs and mail configuration.
- `GET /api/v1/announcements/firm/:firmId` is effectively cursor-based when you use `lastDocId`. The `page` query parameter is returned in the response but is not used to fetch an offset page by itself.

## Postman Environment

Create a Postman environment named `Announcement System Local` with these variables:

| Variable           | Example                      | Required | Notes                               |
| ------------------ | ---------------------------- | -------- | ----------------------------------- |
| `baseUrl`        | `http://localhost:5000`    | Yes      | Server base URL                     |
| `apiPrefix`      | `/api/v1`                  | Yes      | Default prefix from `server.js`   |
| `apiBase`        | `{{baseUrl}}{{apiPrefix}}` | Yes      | Convenience variable                |
| `firmId`         | `8c0d...`                  | Later    | Saved after create firm             |
| `authToken`      | `eyJ...`                   | Later    | Saved after login or Google sign-in |
| `userId`         | `firebase-uid`             | Later    | Saved after login                   |
| `announcementId` | `uuid`                     | Later    | Saved after create announcement     |
| `commentId`      | `uuid`                     | Later    | Saved after add comment             |
| `notificationId` | `uuid`                     | Later    | Saved after get notifications       |
| `userEmail`      | `user@example.com`         | Optional | Useful for OTP flows                |
| `newEmail`       | `new-user@example.com`     | Optional | Useful for email change flow        |
| `otp`            | `123456`                   | Manual   | Enter from email inbox              |
| `fcmToken`       | `sample-device-token`      | Optional | For notification token routes       |

## Recommended Collection Structure

- `00 System`
- `01 Firms`
- `02 Auth`
- `03 Users`
- `04 Announcements`
- `05 Notifications`

If you want to test notifications properly, create two verified users in the same firm:

- User A: creates the announcement
- User B: likes or comments on User A's announcement

That gives User A a real notification to fetch, mark as read, and delete.

## Reusable Postman Test Snippets

### Save `firmId`

Add this in the `Tests` tab of `POST /firms`:

```javascript
pm.test("Create firm returns 201", function () {
  pm.response.to.have.status(201);
});

const json = pm.response.json();
pm.environment.set("firmId", json.data.firmId);
```

### Save auth token and user data

Add this in the `Tests` tab of `POST /auth/login` or `POST /auth/google-signin`:

```javascript
pm.test("Login returns 200 or 201", function () {
  pm.expect([200, 201]).to.include(pm.response.code);
});

const json = pm.response.json();
pm.environment.set("authToken", json.data.token);
pm.environment.set("userId", json.data.user.userId);
pm.environment.set("firmId", json.data.user.firmId);
pm.environment.set("userEmail", json.data.user.emailId);
```

### Save `announcementId`

Add this in the `Tests` tab of `POST /announcements`:

```javascript
pm.test("Create announcement returns 201", function () {
  pm.response.to.have.status(201);
});

const json = pm.response.json();
pm.environment.set("announcementId", json.data.announcementId);
```

### Save `commentId`

Add this in the `Tests` tab of `POST /announcements/:announcementId/comments`:

```javascript
pm.test("Add comment returns 201", function () {
  pm.response.to.have.status(201);
});

const json = pm.response.json();
pm.environment.set("commentId", json.data.comment.commentId);
```

### Save `notificationId`

Add this in the `Tests` tab of `GET /notifications`:

```javascript
pm.test("Notifications fetch returns 200", function () {
  pm.response.to.have.status(200);
});

const json = pm.response.json();
if (json.data && json.data.length > 0) {
  pm.environment.set("notificationId", json.data[0].notificationId);
}
```

## Recommended Execution Order

1. `GET {{baseUrl}}/`
2. `GET {{apiBase}}/health`
3. `POST {{apiBase}}/firms`
4. `GET {{apiBase}}/firms`
5. `POST {{apiBase}}/auth/signup`
6. `POST {{apiBase}}/auth/verify-otp`
7. `POST {{apiBase}}/auth/login`
8. Run all user profile endpoints
9. `POST {{apiBase}}/announcements`
10. Run the remaining announcement endpoints
11. Use a second user in the same firm to generate notifications
12. Run notification endpoints
13. Leave destructive endpoints such as account delete, announcement delete, comment delete, and firm delete for the end

## Endpoint-by-Endpoint Guide

### 00 System

#### GET `{{baseUrl}}/`

- Auth: None
- Body: None
- Expected:
  - Status `200`
  - `success: true`
  - `message: "Welcome to PortfolioMate Announcement API"`
  - `documentation: "/api/v1/health"` unless `API_PREFIX` is overridden

#### GET `{{apiBase}}/health`

- Auth: None
- Body: None
- Expected:
  - Status `200`
  - `success: true`
  - `message: "PortfolioMate API is running"`
  - `timestamp` present

### 01 Firms

#### POST `{{apiBase}}/firms`

- Auth: None
- Headers:
  - `Content-Type: application/json`
- Body:
  ```json
  {
    "firmEmailId": "ops@examplefirm.com",
    "description": "Sample firm used for API testing"
  }
  ```
- Expected:
  - Status `201`
  - `data.firmId`
  - `data.firmEmailId`
  - `data.description`
- Follow-up:
  - Save `firmId`

#### GET `{{apiBase}}/firms`

- Auth: None
- Query params:
  - optional `limit`
- Expected:
  - Status `200`
  - `success: true`
  - `data` is an array of firms

#### GET `{{apiBase}}/firms/{{firmId}}`

- Auth: None
- Body: None
- Expected:
  - Status `200`
  - `data.firmId === {{firmId}}`

#### PUT `{{apiBase}}/firms/{{firmId}}`

- Auth: Bearer token required
- Headers:
  - `Authorization: Bearer {{authToken}}`
  - `Content-Type: application/json`
- Body:
  ```json
  {
    "description": "Updated firm description from Postman"
  }
  ```
- Expected:
  - Status `200`
  - `message: "Firm updated successfully"`
  - Updated `data.description`

#### DELETE `{{apiBase}}/firms/{{firmId}}`

- Auth: Bearer token required
- Body: None
- Expected:
  - Status `200`
  - `message: "Firm deleted successfully"`
- Important:
  - This fails with `400` if users are still associated with the firm.
  - Run this only after deleting related test users.

### 02 Auth

#### POST `{{apiBase}}/auth/signup`

- Auth: None
- Headers:
  - `Content-Type: application/json`
- Body:
  ```json
  {
    "email": "user1@example.com",
    "password": "Password123!",
    "firstName": "User",
    "lastName": "One",
    "firmId": "{{firmId}}"
  }
  ```
- Expected:
  - Status `201`
  - `message` indicates OTP verification is required
  - `data.userId`
  - `data.email`
- Important:
  - The `firmId` must already exist.
  - Save the email address you used so you can verify OTP next.

#### POST `{{apiBase}}/auth/verify-otp`

- Auth: None
- Headers:
  - `Content-Type: application/json`
- Body:
  ```json
  {
    "email": "user1@example.com",
    "otp": "{{otp}}"
  }
  ```
- Expected:
  - Status `200`
  - `message: "Email verified successfully"`
- Important:
  - Read the OTP from the inbox tied to the signup email.
  - OTP expires if the server restarts or the 10-minute window passes.

#### POST `{{apiBase}}/auth/login`

- Auth: None
- Headers:
  - `Content-Type: application/json`
- Body:
  ```json
  {
    "email": "user1@example.com",
    "password": "Password123!"
  }
  ```
- Expected:
  - Status `200`
  - `data.user`
  - `data.token`
- Follow-up:
  - Save `authToken`, `userId`, `firmId`, and `userEmail`
- Important:
  - Current implementation checks verified user existence and requires a non-empty `password`, but does not validate the password value.

#### POST `{{apiBase}}/auth/google-signin`

- Auth: None
- Headers:
  - `Content-Type: application/json`
- Body for existing Google user:
  ```json
  {
    "idToken": "firebase-or-google-id-token"
  }
  ```
- Body for first-time Google user:
  ```json
  {
    "idToken": "firebase-or-google-id-token",
    "firmId": "{{firmId}}"
  }
  ```
- Expected:
  - Status `200` for existing user or `201` for first-time user
  - `data.user`
  - `data.token`
- Important:
  - Use a real ID token generated outside Postman, usually by the frontend or Firebase Auth tooling.

#### POST `{{apiBase}}/auth/resend-otp`

- Auth: None
- Headers:
  - `Content-Type: application/json`
- Body:
  ```json
  {
    "email": "user1@example.com"
  }
  ```
- Expected:
  - Status `200`
  - `message: "OTP sent successfully"`

### 03 Users

All routes below currently require `Authorization: Bearer {{authToken}}`.

#### GET `{{apiBase}}/users/profile`

- Auth: Bearer token required
- Body: None
- Expected:
  - Status `200`
  - `data.userId`
  - `data.emailId`
  - `data.firmId`

#### PUT `{{apiBase}}/users/profile`

- Auth: Bearer token required
- Headers:
  - `Content-Type: application/json`
- Body:
  ```json
  {
    "firstName": "Updated",
    "lastName": "Tester"
  }
  ```
- Expected:
  - Status `200`
  - `message: "Profile updated successfully"`
  - Updated `data.firstName` and `data.lastName`
- Important:
  - This returns `403` for Google sign-in users.

#### POST `{{apiBase}}/users/profile-photo`

- Auth: Bearer token required
- Body type: `form-data`
- Form fields:
  - key `photo` as `File`
- Expected:
  - Status `200`
  - `message: "Profile photo uploaded successfully"`
  - `data.profilePhotoUrl`
- Important:
  - Only image files are accepted.
  - The multer limit is 5 MB.
  - This returns `403` for Google sign-in users.

#### DELETE `{{apiBase}}/users/profile-photo`

- Auth: Bearer token required
- Body: None
- Expected:
  - Status `200`
  - `message: "Profile photo deleted successfully"`
- Important:
  - This returns `403` for Google sign-in users.

#### POST `{{apiBase}}/users/request-email-change`

- Auth: Bearer token required
- Headers:
  - `Content-Type: application/json`
- Body:
  ```json
  {
    "newEmail": "user1-new@example.com"
  }
  ```
- Expected:
  - Status `200`
  - `message: "OTP sent to new email address"`
- Important:
  - Save `newEmail` and use it in the next request.
  - This returns `403` for Google sign-in users.

#### PUT `{{apiBase}}/users/email`

- Auth: Bearer token required
- Headers:
  - `Content-Type: application/json`
- Body:
  ```json
  {
    "newEmail": "{{newEmail}}",
    "otp": "{{otp}}"
  }
  ```
- Expected:
  - Status `200`
  - `message: "Email updated successfully"`
  - `data.emailId === {{newEmail}}`

#### PUT `{{apiBase}}/users/password`

- Auth: Bearer token required
- Headers:
  - `Content-Type: application/json`
- Body:
  ```json
  {
    "currentPassword": "Password123!",
    "newPassword": "NewPassword123!"
  }
  ```
- Expected:
  - Status `200`
  - `message: "Password updated successfully"`
- Important:
  - This returns `403` for Google sign-in users.
  - Current implementation does not verify `currentPassword` server-side.

#### POST `{{apiBase}}/users/forgot-password`

- Auth: Bearer token required in current implementation
- Headers:
  - `Content-Type: application/json`
- Body:
  ```json
  {
    "email": "{{userEmail}}"
  }
  ```
- Expected:
  - Status `200`
  - `message: "OTP sent to your email"`
- Important:
  - Route comments say public, but the actual route is protected by auth middleware.
  - Google sign-in users receive `400`.

#### POST `{{apiBase}}/users/reset-password`

- Auth: Bearer token required in current implementation
- Headers:
  - `Content-Type: application/json`
- Body:
  ```json
  {
    "email": "{{userEmail}}",
    "otp": "{{otp}}",
    "newPassword": "ResetPassword123!"
  }
  ```
- Expected:
  - Status `200`
  - `message: "Password reset successfully"`
- Important:
  - Route comments say public, but the actual route is protected by auth middleware.

#### DELETE `{{apiBase}}/users/account`

- Auth: Bearer token required
- Body: None
- Expected:
  - Status `200`
  - `message: "Account deleted successfully"`
- Important:
  - Run this last. It deletes both Firebase Auth and Firestore user records.

### 04 Announcements

All announcement routes require `Authorization: Bearer {{authToken}}`.

#### POST `{{apiBase}}/announcements`

- Auth: Bearer token required
- Body type: `form-data`
- Form fields:
  - `title` as `Text`
  - `body` as `Text`
  - `classificationTags` as repeated `Text` fields if you want multiple tags
  - `media` as `File` and repeat the same key for multiple uploads
- Example form values:
  - `title`: `Quarterly portfolio update`
  - `body`: `New allocation notes and performance summary`
  - `classificationTags`: `portfolio`
  - `classificationTags`: `quarterly`
  - `media`: attach one or more files
- Expected:
  - Status `201`
  - `message: "Announcement created successfully"`
  - `data.announcementId`
  - `data.mediaUrls` array
- Important:
  - Up to 50 files are accepted.
  - Multer limit is 100 MB per file.
  - `classificationTags` must be parsed as an array. Repeating the key in form-data is the safest option in Postman.

#### GET `{{apiBase}}/announcements/firm/{{firmId}}`

- Auth: Bearer token required
- Query params:
  - optional `page`
  - optional `limit`
  - optional `lastDocId`
- Expected:
  - Status `200`
  - `data.announcements` array
  - `data.page`
  - `data.limit`
  - `data.hasMore`
  - `data.lastDocId`
- Important:
  - The authenticated user must belong to the same firm as `{{firmId}}`.
  - Use `lastDocId` from the previous response for the next page. Supplying only `page=2` will not advance the Firestore query.

#### GET `{{apiBase}}/announcements/{{announcementId}}`

- Auth: Bearer token required
- Body: None
- Expected:
  - Status `200`
  - `data.announcementId === {{announcementId}}`
  - `data.hasLiked` present

#### PUT `{{apiBase}}/announcements/{{announcementId}}`

- Auth: Bearer token required
- Headers:
  - `Content-Type: application/json`
- Body:
  ```json
  {
    "title": "Updated title from Postman",
    "body": "Updated announcement body",
    "classificationTags": ["updated", "postman"]
  }
  ```
- Expected:
  - Status `200`
  - `message: "Announcement updated successfully"`
- Important:
  - Only the announcement author can update it.
  - This route does not support media replacement.

#### DELETE `{{apiBase}}/announcements/{{announcementId}}`

- Auth: Bearer token required
- Body: None
- Expected:
  - Status `200`
  - `message: "Announcement deleted successfully"`
- Important:
  - Only the author can delete it.
  - Associated likes, comments, and Cloudinary files are also cleaned up.

#### POST `{{apiBase}}/announcements/{{announcementId}}/like`

- Auth: Bearer token required
- Body: None
- Expected on first call:
  - Status `200`
  - `message: "Announcement liked"`
  - `data.liked === true`
- Expected on second call:
  - Status `200`
  - `message: "Announcement unliked"`
  - `data.liked === false`
- Important:
  - Use a second user if you want this action to generate a notification for the author.

#### POST `{{apiBase}}/announcements/{{announcementId}}/comments`

- Auth: Bearer token required
- Headers:
  - `Content-Type: application/json`
- Body:
  ```json
  {
    "text": "This is a test comment from Postman"
  }
  ```
- Expected:
  - Status `201`
  - `message: "Comment added successfully"`
  - `data.comment.commentId`
  - `data.commentsCount`
- Follow-up:
  - Save `commentId`
- Important:
  - Use a second user if you want this action to generate a notification for the announcement author.

#### GET `{{apiBase}}/announcements/{{announcementId}}/comments`

- Auth: Bearer token required
- Query params:
  - optional `limit`
- Expected:
  - Status `200`
  - `data` is an array of comments
- Suggested check:
  - Verify one item has `commentId === {{commentId}}`

#### DELETE `{{apiBase}}/announcements/{{announcementId}}/comments/{{commentId}}`

- Auth: Bearer token required
- Body: None
- Expected:
  - Status `200`
  - `message: "Comment deleted successfully"`
  - `data.commentsCount`
- Important:
  - The comment author or the announcement author can delete it.

### 05 Notifications

All notification routes require `Authorization: Bearer {{authToken}}`.

To generate a notification for testing:

1. Sign in as User A and create an announcement.
2. Sign in as User B from the same firm.
3. Like or comment on User A's announcement.
4. Sign back in as User A.

#### GET `{{apiBase}}/notifications`

- Auth: Bearer token required
- Query params:
  - optional `limit`
- Expected:
  - Status `200`
  - `data` is an array of notifications
- Follow-up:
  - Save one `notificationId`

#### PUT `{{apiBase}}/notifications/{{notificationId}}/read`

- Auth: Bearer token required
- Body: None
- Expected:
  - Status `200`
  - `message: "Notification marked as read"`

#### DELETE `{{apiBase}}/notifications/{{notificationId}}`

- Auth: Bearer token required
- Body: None
- Expected:
  - Status `200`
  - `message: "Notification deleted successfully"`

#### POST `{{apiBase}}/notifications/fcm-token`

- Auth: Bearer token required
- Headers:
  - `Content-Type: application/json`
- Body:
  ```json
  {
    "token": "{{fcmToken}}"
  }
  ```
- Expected:
  - Status `200`
  - `message: "FCM token saved successfully"`

#### DELETE `{{apiBase}}/notifications/fcm-token`

- Auth: Bearer token required
- Headers:
  - `Content-Type: application/json`
- Body:
  ```json
  {
    "token": "{{fcmToken}}"
  }
  ```
- Expected:
  - Status `200`
  - `message: "FCM token removed successfully"`

## Suggested Negative Tests

Run a small negative test pass after the happy path:

- Omit `Authorization` on a protected route and expect `401`.
- Send invalid `firmId`, `announcementId`, `commentId`, or `notificationId` and expect `404` where applicable.
- Try accessing another firm's announcements and expect `403`.
- Try updating or deleting another user's announcement and expect `403`.
- Send invalid OTP and expect `400`.
- Send invalid email shapes and expect `400`.
- Upload a non-image file to `POST /users/profile-photo` and expect an error.
- Delete a firm that still has users and expect `400`.

## Minimal Full-Coverage Checklist

Use this as a quick final pass:

- System: root, health
- Firms: create, list, get, update, delete
- Auth: signup, verify OTP, login, Google sign-in, resend OTP
- Users: profile get/update, photo upload/delete, request email change, update email, update password, forgot password, reset password, delete account
- Announcements: create, list by firm, get one, update, delete, like toggle, add comment, list comments, delete comment
- Notifications: list, mark read, delete, save FCM token, remove FCM token
