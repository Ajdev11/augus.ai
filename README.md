# augus.ai
Interactive AI study assistant with PDF understanding, voice I/O, quizzes, and authentication.

## Tech
- React (CRA), React Router
- Tailwind CSS
- Node/Express API
- MongoDB (Mongoose)
- PDF.js (client-side text extraction)
- Web Speech API (TTS + SpeechRecognition)
- Auth: Email+password, Google OAuth (GitHub/Apple optional)

## Quick start
1) Install
```
npm install
```

2) Environment
- Create `server/.env`:
```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=change_me
SESSION_SECRET=devsession-change-me
APP_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:4000

# SMTP (optional but recommended for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=your_gmail_app_password
FROM_EMAIL=no-reply@augus.ai

# Google OAuth (enabled)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```
Notes:
- Use Atlas or local Mongo (`mongodb://127.0.0.1:27017/augus_ai`).
- Gmail requires 2‑Step Verification and an App Password.

3) Run
```
npm run dev    # starts API (4000) + React (3000)
```
Open `http://localhost:3000/#/`.

## Routes
- Frontend
  - `/#/` Home
  - `/#/session` Sign up / Sign in / Forgot password
  - `/#/dashboard` Protected, PDF upload + AI session
  - `/#/reset?token=...` Reset password
  - `/#/oauth` OAuth token handler (do not open manually)
- API
  - `GET /api/health`
  - Auth: `/api/auth/signup`, `/api/auth/signin`, `/api/auth/forgot`, `/api/auth/reset`, `/api/auth/me`
  - OAuth: `/api/oauth/google` (and `/api/oauth/github` if configured)

## OAuth setup
- Google Cloud Console → Credentials → OAuth client (Web)
  - Authorized origins: `http://localhost:3000`
  - Redirect URI: `http://localhost:4000/api/oauth/google/callback`
  - Put client ID/secret in `server/.env`.
- GitHub → Settings → Developer settings → OAuth Apps
  - Callback: `http://localhost:4000/api/oauth/github/callback`
  - Add ID/secret in `server/.env`.

## Password reset
- If SMTP is set, emails are sent.
- If SMTP isn’t set, the API logs a test “[Email preview URL] …” (Ethereal) and the raw reset link for development.

## Notes
- PDF.js worker is configured; client parsing is done in the browser.
- Voice input/output uses browser APIs; permissions are required.

## Scripts
- `npm run dev` API + React
- `npm run server` API only
- `npm start` React only
