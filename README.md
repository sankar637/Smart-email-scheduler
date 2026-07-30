# Smart Email Scheduler

A Gmail-Compose-style scheduled email sender. Users sign in with Google
(Firebase Authentication), separately connect their Gmail account for
**sending** (Google OAuth2, `gmail.send` scope), compose an email with a
schedule date/time, and a cron job fires it off automatically through their
own Gmail account at the right moment.

This fixes the original **"Gmail is not connected for this user"** bug,
which happened because Firebase login (identity) was being conflated with
Gmail send permission (a separate OAuth2 grant). The two are now handled
independently, exactly like Gmail's own "Connect account" flow.

## Why the bug happened

- Firebase Authentication only proves *who the user is* — it does not hand
  you a Gmail refresh token you can send mail with.
- To send mail *as* the user, you need a **separate OAuth2 consent step**
  requesting `https://www.googleapis.com/auth/gmail.send`, whose
  `refresh_token` you store yourself.
- The old code tried to send mail using only the Firebase login, so
  `gmailRefreshToken` was always `null` → "Gmail is not connected".

## Project structure

```
smart-email-scheduler/
├── server/                  # Node.js + Express + Sequelize (SQLite) API
│   ├── config/
│   │   ├── database.js      # Sequelize/SQLite connection
│   │   ├── firebaseAdmin.js # Firebase Admin SDK init (verifies login tokens)
│   │   └── googleAuth.js    # Google OAuth2 client for Gmail send permission
│   ├── models/
│   │   ├── User.js
│   │   ├── Email.js
│   │   └── index.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── gmailController.js
│   │   └── emailController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── gmailRoutes.js
│   │   └── emailRoutes.js
│   ├── middleware/authMiddleware.js
│   ├── scheduler/emailScheduler.js  # node-cron, runs every minute
│   ├── services/emailService.js     # Nodemailer OAuth2 transporter
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── client/                  # React + Vite frontend
    ├── src/
    │   ├── pages/Login.jsx
    │   ├── pages/Dashboard.jsx
    │   ├── components/Navbar.jsx
    │   ├── components/ProfileCard.jsx
    │   ├── components/EmailForm.jsx
    │   ├── components/EmailList.jsx
    │   ├── services/api.js
    │   ├── services/auth.js
    │   ├── firebase.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── .env.example
```

## Setup

### 1. Google Cloud Console

1. Create (or reuse) a project at https://console.cloud.google.com.
2. Enable the **Gmail API**.
3. Configure the **OAuth consent screen** (External is fine for testing;
   add your own Gmail as a test user while in "Testing" mode).
4. Create **OAuth 2.0 Client ID** credentials (type: Web application).
   - Authorized redirect URI: `http://localhost:5001/api/gmail/callback`
5. Copy the **Client ID** and **Client Secret** into `server/.env`.

### 2. Firebase

1. Create a Firebase project at https://console.firebase.google.com and
   enable **Authentication → Sign-in method → Google**.
2. Frontend: Project Settings → General → "Your apps" → Web app → copy the
   config values into `client/.env`.
3. Backend: Project Settings → Service Accounts → **Generate new private
   key**. Save the JSON as `server/config/serviceAccountKey.json` (this
   file is git-ignored) — or paste its contents into
   `FIREBASE_SERVICE_ACCOUNT_JSON` in `server/.env` for hosting platforms
   where you can't upload a file.

### 3. Backend

```bash
cd server
cp .env.example .env      # then fill in the values above
npm install
npm run dev                # nodemon server.js
```

### 4. Frontend

```bash
cd client
cp .env.example .env      # fill in Firebase web config + API URL
npm install
npm run dev
```

Frontend runs on `http://localhost:5178`, backend on `http://localhost:5001`.

## End-to-end workflow

```
User clicks "Sign in with Google"
        ↓
Firebase Authentication (frontend) → ID token
        ↓
Backend verifies ID token with Firebase Admin SDK
        ↓
User row created/updated in SQLite (id = Firebase UID)
        ↓
Backend issues its own JWT for API calls
        ↓
User clicks "Connect Gmail" on the dashboard
        ↓
Google OAuth2 consent screen (gmail.send scope)
        ↓
Callback stores gmailEmail + gmailAccessToken + gmailRefreshToken in SQLite
        ↓
Dashboard shows "Connected as user@gmail.com"
        ↓
User composes an email (To / Subject / Message / Date / Time) and clicks
"Schedule Email"
        ↓
Backend validates Gmail is connected, saves row in `emails` table
(status = PENDING)
        ↓
node-cron runs every minute, finds emails where
scheduleTime <= now AND status = PENDING
        ↓
For each: build a Nodemailer OAuth2 transporter from the user's
refresh token, send the mail from their connected Gmail account
        ↓
status updated to SENT (or FAILED, with the error saved)
```

## Key API endpoints

| Method | Endpoint                | Auth | Description |
|--------|--------------------------|------|-------------|
| POST   | `/api/auth/google`       | none | Exchange Firebase ID token for app JWT |
| GET    | `/api/auth/me`           | JWT  | Current user profile |
| GET    | `/api/gmail/connect`     | JWT  | Get Google consent URL |
| GET    | `/api/gmail/callback`    | none | Google OAuth2 redirect target |
| GET    | `/api/gmail/status`      | JWT  | Gmail connection status |
| POST   | `/api/gmail/disconnect`  | JWT  | Remove stored Gmail tokens |
| POST   | `/api/email/schedule`    | JWT  | Schedule a new email |
| GET    | `/api/email`             | JWT  | List scheduled emails |
| PUT    | `/api/email/:id`         | JWT  | Edit a PENDING email |
| DELETE | `/api/email/:id`         | JWT  | Delete a PENDING email |

## Notes

- No `EMAIL=` / `PASSWORD=` SMTP credentials are used anywhere — sending is
  100% Gmail OAuth2 through each user's own connected account.
- `prompt: "consent"` is set on the OAuth2 URL so Google reliably re-issues
  a `refresh_token` (Google only sends it the very first time otherwise).
- SQLite is fine for development; swap the `dialect` in
  `server/config/database.js` for Postgres/MySQL in production.
