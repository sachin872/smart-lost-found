# Smart Lost & Found System 🔍🤖

An AI-powered, production-grade full-stack web application that helps organizations and university campuses report lost items, inventory found items, automatically discover high-confidence potential matches, verify rightful ownership through interactive questionnaires, and securely coordinate physical returns with cryptographically hashed 6-digit OTP handovers.

---

## 📌 Table of Contents
1. [Key Features](#-key-features)
2. [Technology Stack](#-technology-stack)
3. [Architecture Overview](#-architecture-overview)
4. [AI Matching Engine Breakdown](#-ai-matching-engine-breakdown)
5. [Database Schema & Models](#-database-schema--models)
6. [Security & Privacy](#-security--privacy)
7. [Installation & Local Setup](#-installation--local-setup)
8. [MongoDB Atlas Step-by-Step Setup](#-mongodb-atlas-step-by-step-setup)
9. [Cloudinary Setup](#-cloudinary-setup)
10. [Database Seeding & Demo Accounts](#-database-seeding--demo-accounts)
11. [REST API Documentation](#-rest-api-documentation)
12. [Automated Testing](#-automated-testing)
13. [Deployment Guide (Vercel & Render/Railway)](#-deployment-guide)

---

## 🚀 Key Features

### 1. Dual Portal Reports
- **Report Lost Items:** Multi-image upload, brand, condition, unique scratch/dent features, serial number, GPS/text location, date and time.
- **Report Found Items:** Physical storage location tracking (e.g. *Campus Security Safe Box #14*), intake timestamps, item state.

### 2. Multi-Factor AI Matching Engine
- **Deterministic & Semantic Text Similarity:** Synonym expansion (*laptop bag* ↔ *backpack*, *navy* ↔ *dark blue*, *logo* ↔ *branding*) and Cosine TF-IDF vector similarity.
- **Vision Model Abstraction:** Pluggable CLIP / PyTorch vision service integration with transparent status tracking.
- **Geographical Haversine Proximity:** Configurable distance decay (Immediate, Close &lt;100m, Moderate &lt;500m, Broad &lt;2km).
- **Temporal Time Decay:** Mathematical decay evaluating time margins between lost time and found intake.
- **Weighted Formula:**
  $$\text{FinalScore} = (0.30 \times \text{Text}) + (0.30 \times \text{Image}) + (0.10 \times \text{Category}) + (0.05 \times \text{Color}) + (0.05 \times \text{Brand}) + (0.10 \times \text{Location}) + (0.10 \times \text{Time})$$
- **Confidence Levels:**
  - `HIGH CONFIDENCE` (85 – 100%)
  - `MEDIUM CONFIDENCE` (65 – 84%)
  - `LOW CONFIDENCE` (&lt; 65%)

### 3. Natural Language Search
- Natural language query parser extracts structured attributes directly from colloquial inputs:
  > *"I lost my black wallet near the canteen yesterday"*
  > $\rightarrow$ Intent: `lost`, Color: `black`, Category: `Wallets & Cards`, Location: `canteen`, Date: `yesterday`.

### 4. Ownership Verification System
- Protects found items from fraudulent claims.
- Users answer a 5-point ownership verification questionnaire (brand, unique marks, interior contents, precise loss coordinates, and hidden features).
- Calculates an objective **Verification Score (0–100%)** sent to administrators.

### 5. Secure 6-Digit OTP Handover Terminal
- Once a claim is approved, a cryptographically secure 6-digit numeric OTP is generated.
- The plain OTP is delivered **only** to the verified owner.
- The database stores **only the salted bcrypt hash** of the OTP (`otpHash`).
- At pickup, the security officer inputs the OTP. The system verifies it against the hash, locks after 5 failed attempts, and officially marks both items as `RETURNED`.

### 6. Role-Based Access Control
- **Student / General User:** Report items, track claims, view AI matches, receive OTPs.
- **Finder / Security Staff:** Inventory found items, manage storage safe boxes, perform physical OTP verification handovers.
- **Administrator:** Full administrative dashboard, user moderation (block/unblock), claim approval/rejection, system audit trails, analytics.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React Icons |
| **Backend** | Node.js, Express.js (ES Modules), JWT, bcryptjs, express-validator, express-rate-limit, Helmet, Morgan |
| **Database** | MongoDB Atlas / Mongoose ODM (with in-memory fallback for local dev) |
| **Storage** | Cloudinary CDN (with base64 fallback) |
| **AI / NLP** | Semantic Cosine Engine, Synonym Dictionary, Modular CLIP/Embeddings API Adapter |
| **Testing** | Node.js Native Test Runner (`node:test`, `node:assert`) |

---

## 🏛️ Architecture Overview

```
smart-lost-found/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/         # Navbar, Sidebar, ScoreBadge, StatusBadge, Modal, ImageUpload, Skeleton
│   │   ├── context/            # AuthContext, NotificationContext
│   │   ├── layouts/            # AppLayout, AdminLayout
│   │   ├── pages/              # LandingPage, Login, Register, Dashboard, ReportLost, ReportFound, Search,
│   │   │                       # Matches, MatchDetails, Claims, Notifications, Profile
│   │   │   └── admin/          # AdminDashboard, AdminUsers, AdminClaims, AdminAnalytics
│   │   └── services/           # api.js (Axios with JWT Bearer interceptor)
│   └── vite.config.js          # Proxies /api requests to Express server (port 5000)
│
└── server/                     # Node.js + Express Backend
    ├── config/                 # db.js (MongoDB Atlas), cloudinary.js
    ├── controllers/            # auth, user, lost, found, match, claim, handover, admin, search
    ├── middleware/             # auth.js (JWT protect/role), admin.js, upload.js, rateLimiter.js, errorHandler.js
    ├── models/                 # User, LostItem, FoundItem, Match, Claim, Handover, Notification, Report, AuditLog
    ├── routes/                 # REST endpoints
    ├── services/               # textMatchingService, imageMatchingService, matchingService,
    │                           # notificationService, cloudinaryService, auditService, nlpParserService
    ├── utils/                  # otpGenerator, distanceCalculator (Haversine), timeDecay
    ├── seeds/                  # seed.js (Admin, users, 10 lost & 10 found items, matches, claims)
    ├── tests/                  # api.test.js (Automated integration & unit test suite)
    └── server.js               # Main application entry point
```

---

## 🧠 AI Matching Engine Breakdown

### 1. Semantic Text Matching (`/services/textMatchingService.js`)
Handles vocabulary differences between lost and found descriptions.
- **Synonym Normalization:** Expands concepts such as *laptop bag* $\leftrightarrow$ *backpack*, *navy* $\leftrightarrow$ *dark blue*, *smartphone* $\leftrightarrow$ *iPhone*.
- **TF-IDF & Cosine Similarity:** Computes vector angles between the normalized token sets.
- **Pluggable Architecture:** Features `getRemoteEmbeddingSimilarity()` to forward payloads to external Python FastAPI services running Sentence Transformers (`all-MiniLM-L6-v2`) or OpenAI embeddings.

### 2. Image Matching Service (`/services/imageMatchingService.js`)
- Strictly adheres to truth in AI status: when no live visual microservice is connected, it flags:
  `AI Image Matching Service – Integration Required (CLIP/Vision Model)`.
- When an external CLIP service is supplied via `AI_SERVICE_URL`, it dispatches image URLs and receives cosine embeddings.

### 3. Location Matching (`/utils/distanceCalculator.js`)
Uses the great-circle Haversine formula over geographical coordinates:
- Same location / $\le 20\text{m}$: **100%**
- Within $100\text{m}$: **90%**
- Within $500\text{m}$: **75%**
- Within $2000\text{m}$: Linear scaling down to 30%
- Graceful text token Jaccard similarity fallback if GPS coordinates are missing.

### 4. Time Decay (`/utils/timeDecay.js`)
- Items found within 2 hours: **100%**
- Found within 24 hours: **90%**
- Found within 3 days: **80%**
- Found within 7 days: **65%**
- Found within 14 days: **50%**

---

## 🗄️ Database Schema & Models

- **USERS:** `_id`, `name`, `email`, `phone`, `passwordHash`, `role` (`user`, `finder`, `admin`), `profileImage`, `isVerified`, `isBlocked`, `createdAt`, `updatedAt`.
- **LOST_ITEMS:** `_id`, `userId`, `title`, `description`, `category`, `subcategory`, `brand`, `color`, `condition`, `serialNumber`, `uniqueFeatures`, `imageUrls`, `lostLocation`, `latitude`, `longitude`, `lostDate`, `lostTime`, `status`, `createdAt`, `updatedAt`.
- **FOUND_ITEMS:** `_id`, `finderId`, `title`, `description`, `category`, `subcategory`, `brand`, `color`, `condition`, `serialNumber`, `uniqueFeatures`, `imageUrls`, `foundLocation`, `latitude`, `longitude`, `foundDate`, `foundTime`, `currentStorageLocation`, `status`, `createdAt`, `updatedAt`.
- **MATCHES:** `_id`, `lostItemId`, `foundItemId`, `textScore`, `imageScore`, `categoryScore`, `colorScore`, `brandScore`, `locationScore`, `timeScore`, `finalScore`, `confidenceLevel`, `matchReason`, `status`, `createdAt`.
- **CLAIMS:** `_id`, `matchId`, `lostItemId`, `foundItemId`, `claimantId`, `verificationAnswers`, `verificationScore`, `verificationStatus` (`pending`, `approved`, `rejected`, `info_requested`), `adminNotes`, `approvedBy`, `createdAt`, `updatedAt`.
- **HANDOVERS:** `_id`, `claimId`, `ownerId`, `finderId`, `adminId`, `otpHash` (select: false), `handoverLocation`, `scheduledDate`, `scheduledTime`, `verifiedAt`, `status`, `failedAttempts`, `notes`, `createdAt`.
- **NOTIFICATIONS:** `_id`, `userId`, `type`, `title`, `message`, `relatedItemId`, `relatedItemModel`, `relatedMatchId`, `isRead`, `createdAt`.
- **AUDIT_LOGS:** `_id`, `user`, `action`, `target`, `metadata`, `timestamp`.

---

## 🔒 Security & Privacy

1. **Password Hashing:** Handled using `bcryptjs` with salt rounds = 10. Plain text passwords are never stored.
2. **Hashed Handover OTP:** OTP is a 6-digit numeric token generated securely via `crypto.randomBytes()`. It is hashed with bcrypt before saving to MongoDB.
3. **Brute-Force Rate Limiting:**
   - 300 requests/15m across general API
   - 25 requests/15m on authentication endpoints
   - 10 attempts/10m on OTP verification endpoints
4. **Data Privacy:** Public lost and found catalogs expose only necessary details, hiding claimant answers, phone numbers, and storage security details until authenticated.
5. **Security Headers & CORS:** Configured with `helmet` and strict origin whitelisting.

---

## 💻 Installation & Local Setup

### Prerequisites
- Node.js v18+ (tested on Node v24.19.0)
- npm v9+

### 1. Clone or Open the Workspace
```bash
cd smart-lost-found
```

### 2. Backend Setup
```bash
cd server
npm install
```
Configure your `server/.env` (see below for MongoDB Atlas or leave blank for local auto-fallback).

### 3. Frontend Setup
Open a separate terminal window:
```bash
cd client
npm install
npm run dev
```

### 4. Running the Backend
In the server terminal:
```bash
npm run dev
```
The backend starts on `http://localhost:5000` and the Vite client on `http://localhost:5173`.

---

## ☁️ MongoDB Atlas Step-by-Step Setup

Follow these exact steps to connect a persistent cloud database:

1. **Create an Account:** Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and register or sign in.
2. **Build a Database Cluster:**
   - Click **Create**.
   - Select the free **M0 Sandbox** tier.
   - Choose your preferred cloud provider and closest region.
   - Click **Create Deployment**.
3. **Create Database User:**
   - Under **Security** $\rightarrow$ **Database Access**, click **Add New Database User**.
   - Choose **Password** authentication.
   - Enter a username (e.g. `lostfound_admin`) and a secure password.
   - Assign the role `Read and write to any database`. Click **Add User**.
4. **Configure Network IP Access:**
   - Under **Security** $\rightarrow$ **Network Access**, click **Add IP Address**.
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`) or enter your current IP.
   - Confirm and save.
5. **Retrieve Connection String:**
   - Go to **Database** $\rightarrow$ Click **Connect** on your cluster.
   - Select **Drivers** (Node.js).
   - Copy the connection string:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/smart_lost_found?retryWrites=true&w=majority
     ```
6. **Set in `server/.env`:**
   Paste into `server/.env`:
   ```env
   MONGO_URI=mongodb+srv://lostfound_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/smart_lost_found?retryWrites=true&w=majority
   ```
7. **Start Backend & Verify:**
   Run `npm run dev` in `server/`. You will see:
   ```
   ✅ MongoDB Atlas Connected: cluster0-shard-00-00.xxxxx.mongodb.net
   🚀 Smart Lost & Found Server running on port 5000 [development]
   ```

---

## 📷 Cloudinary Setup

1. Sign up at [Cloudinary](https://cloudinary.com/).
2. On your Cloudinary Dashboard, copy your **Cloud Name**, **API Key**, and **API Secret**.
3. Add them to `server/.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
*Note: If Cloudinary keys are omitted during development, the application automatically uses optimized Base64 data buffers so image uploads remain 100% operational.*

---

## 🌱 Database Seeding & Demo Accounts

Populate the database with 1 Admin, 3 sample users, 10 realistic lost items, 10 found items, AI matches, sample claims, and notifications:

```bash
cd server
npm run seed
```

### Pre-Configured Demo Credentials (DEVELOPMENT ONLY):

| Role | Email | Password |
|---|---|---|
| **System Admin** | `admin@smartlostfound.edu` | `Admin@12345` |
| **Student (Owner)** | `sachin.patel@student.edu` | `Student@123` |
| **Student 2** | `sarah.c@student.edu` | `Student@123` |
| **Campus Finder / Security** | `security.marcus@campus.edu` | `Security@123` |

*(Quick-login buttons are also conveniently embedded directly on the Login page!)*

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register new user account.
- `POST /api/auth/login` — Sign in and receive JWT token.
- `GET  /api/auth/me` — Get current logged-in user profile (Protected).
- `POST /api/auth/forgot-password` — Generate password reset token.
- `PUT  /api/auth/reset-password/:token` — Reset password.

### Lost Items (`/api/lost`)
- `POST /api/lost` — Report a lost item (multipart image upload + triggers AI matching).
- `GET  /api/lost` — Filter and paginate lost items (`?category=&status=&page=`).
- `GET  /api/lost/:id` — View lost item details.
- `GET  /api/lost/my` — Get authenticated user's reported lost items.
- `PUT  /api/lost/:id` — Update report (owner or admin only).
- `DELETE /api/lost/:id` — Delete report.

### Found Items (`/api/found`)
- `POST /api/found` — Report a found item (storage tracking + triggers AI matching).
- `GET  /api/found` — Filter and paginate found inventory.
- `GET  /api/found/:id` — View found item details.
- `GET  /api/found/my` — Get user's reported found items.
- `PUT  /api/found/:id` — Update report.
- `DELETE /api/found/:id` — Delete report.

### AI Matches (`/api/matches`)
- `GET  /api/matches` — Get user's matches or all matches (`?confidence=`).
- `GET  /api/matches/:id` — Side-by-side comparison with AI subscores breakdown.
- `POST /api/matches/run` — Manually trigger batch matching across all records.

### Claims & Ownership (`/api/claims`)
- `POST /api/claims` — Submit ownership verification questionnaire.
- `GET  /api/claims` — List claims.
- `GET  /api/claims/:id` — View claim answers and verification score.

### Handover & OTP (`/api/handover`)
- `POST /api/handover` — Initiate handover & generate hashed OTP (Admin).
- `POST /api/handover/verify` — Validate 6-digit OTP and mark item `RETURNED` (Rate-limited).
- `GET  /api/handover` — List handovers.

### Notifications (`/api/notifications`)
- `GET /api/notifications` — List notifications with unread counter.
- `PUT /api/notifications/:id/read` — Mark single notification read.
- `PUT /api/notifications/read-all` — Mark all read.

### Search (`/api/search`)
- `GET /api/search?q=...` — Unified search with natural language parsing.

### Admin Operations (`/api/admin`)
- `GET /api/admin/dashboard` — Telemetry KPIs, charts data, high-confidence queue.
- `GET /api/admin/users` — Browse and search users.
- `PUT /api/admin/users/:id/status` — Block or unblock user.
- `PUT /api/admin/claims/:id/approve` — Approve claim & generate handover OTP.
- `PUT /api/admin/claims/:id/reject` — Reject claim.
- `PUT /api/admin/claims/:id/request-info` — Request additional proof.
- `GET /api/admin/audit-logs` — Immutable audit trail of events.

---

## 🧪 Automated Testing

Run the automated test suite directly using the native Node.js test runner:

```bash
cd server
npm test
```

### Verified Test Cases:
1. User Registration & Password Hashing (bcrypt)
2. User Authentication & JWT Generation
3. Admin & Finder Role Checks
4. Lost Item Creation
5. Found Item Creation
6. Multi-Factor AI Match Evaluation (weights, subscores, reasons)
7. Haversine Distance & Time Decay Calculations
8. Ownership Claim Submission & Automated Verification Scoring
9. Admin Claim Approval & Handoff Initialization
10. 6-Digit OTP Cryptographic Verification & Return Status Lifecycle

---

## 🚀 Deployment Guide

### Deploying Frontend to Vercel
1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com), click **Add New Project** $\rightarrow$ Import your repo.
3. Set **Root Directory** to `client`.
4. Configure Build Command: `npm run build` and Output Directory: `dist`.
5. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend-api.onrender.com/api`
6. Click **Deploy**.

### Deploying Backend to Render / Railway
1. In [Render](https://render.com), create a **Web Service**.
2. Select your repository.
3. Set **Root Directory** to `server`.
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `MONGO_URI` = `mongodb+srv://...`
   - `JWT_SECRET` = `long_secure_random_string`
   - `CLOUDINARY_CLOUD_NAME` = `...`
   - `CLOUDINARY_API_KEY` = `...`
   - `CLOUDINARY_API_SECRET` = `...`
   - `CLIENT_URL` = `https://your-frontend.vercel.app`
7. Click **Create Web Service**.

---

## 📜 License
This project is open-source and available under the [MIT License](LICENSE).
