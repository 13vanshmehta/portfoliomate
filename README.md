# PortfolioMate - Announcement System

PortfolioMate is a full-stack announcement and notification system tailored for firms and organizations. It features a modern, premium user interface with glassmorphism design elements and seamlessly handles firm-wide broadcasts, interactive comments, and real-time push notifications.

## 🚀 Tech Stack

### Frontend
- **React (v18) & Vite** - Fast, modern frontend framework
- **Tailwind CSS v4** - Utility-first styling with custom vanising scrollbars and backdrop-blur effects
- **Framer Motion** - Fluid animations and layout transitions
- **Lucide React** - High-quality SVG icons
- **Axios** - Reliable API client

### Backend
- **Node.js & Express.js** - Robust REST API backend
- **Firebase Admin SDK** - Authentication, Firestore Database, and Cloud Messaging
- **Cloudinary** - Seamless media and document uploads

---

## 📂 Project Structure

```text
Announcement System/
├── backend/                # Node.js backend API
│   ├── src/                
│   │   ├── config/         # Firebase & Cloudinary configurations
│   │   ├── controllers/    # Route controllers (Auth, Announcements, Notifications)
│   │   ├── models/         # Firestore data models
│   │   ├── services/       # Core business logic (Includes Firebase serviceAccountKey)
│   │   └── utils/          # Helpers (File uploads, OTP generation)
│   ├── .env.example        # Backend environment variables template
│   └── package.json        
└── frontend/               # React Vite application
    ├── src/
    │   ├── api/            # Axios API client and route requests
    │   ├── components/     # Reusable UI components
    │   ├── layouts/        # Dashboard and Auth wrappers
    │   └── pages/          # Main application views (Announcements, Notifications, Auth)
    ├── .env.example        # Frontend environment variables template
    └── package.json        
```

---

## 🛠️ Setup Instructions

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **Firebase Project** (Configure Firestore Database, Authentication, and generate a Service Account Key)
- **Cloudinary Account** (For handling image/media uploads)

### 1. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Environment Configuration:
   - Copy `.env.example` to `.env` and fill in your Firebase and Cloudinary credentials.
   - Download your Firebase `serviceAccountKey.json` and place it inside the `backend/src/services/` directory. (Note: Make sure it's strictly excluded from version control).
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *(The server will run on `http://localhost:5000` by default)*

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Environment Configuration:
   - Copy `.env.example` to `.env` and configure your Vite environment variables (including Firebase API keys and the backend `VITE_API_BASE_URL`).
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

---

## ✨ Key Features
- **Firm-Specific Networking:** Users securely join "firms" to instantly connect with colleagues.
- **Dynamic Announcements:** Create firm-wide announcements with attachments, pinning, tagging, and rich interactions (likes & nested comments).
- **Intelligent Notifications:** Seamless, scalable notification delivery using in-memory sorting over Firestore collections to eliminate heavy indexing overhead. 
- **Premium UX:** Polished design featuring glassmorphism floating headers, animated layouts, and responsive sidebars.