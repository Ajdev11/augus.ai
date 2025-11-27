## augus.ai
Interactive AI study assistant with PDF understanding, voice I/O, quizzes, and authentication.

### Stack
- React (CRA), React Router
- Tailwind CSS
- Node/Express API
- MongoDB (Mongoose)
- PDF.js (client-side text extraction)
- Web Speech API (TTS + SpeechRecognition)
- Auth: Email+password, Google OAuth (Google only in UI; others optional)

### Quick start
1) Install
```
npm install
```

2) Create environment file at `server/.env`
```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=change_me_to_a_long_random_string
SESSION_SECRET=devsession-change-me
APP_BASE_URL=http://localhost:3000
# Optional; only needed to override callback base
API_BASE_URL=http://localhost:4000

# SMTP (recommended for password reset; Gmail works great)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=your_16_char_gmail_app_password
FROM_EMAIL=no-reply@augus.ai

# Google OAuth (enabled)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub / Apple OAuth (not shown in UI by default; optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
# APPLE_* keys only if you plan to enable Apple
```
Notes:
- Use MongoDB Atlas or local Mongo (`mongodb://127.0.0.1:27017/augus_ai`).
- Gmail requires 2‑Step Verification and an App Password (see below).

3) Run
```
npm run dev    # starts API (4000) + React (3000)
```
Open `http://localhost:3000/#/`.

### Gmail SMTP (for “Forgot password” emails)
Use an App Password (not your normal Gmail password).
1) Turn on 2‑Step Verification in your Google Account.
2) Create App password: Security → App passwords → App: Mail, Device: Other (augus.ai).
3) Copy the 16‑character password and put it in `SMTP_PASS` in `server/.env` alongside `SMTP_USER=your@gmail.com`.
4) Restart API (`npm run server` or your dev process) and try “Send reset link” again.

Behavior:
- If SMTP is configured, real emails are sent.
- If SMTP is missing, the API uses Ethereal (dev-only) and logs:
  - `[Password reset link] http://…` (for quick testing)
  - `[Email preview URL] https://ethereal.email/message/...` (open to view the email)

### OAuth (Google only in UI)
- Google Cloud Console → APIs & Services → Credentials → OAuth client (Web):
  - Authorized JavaScript origins: `http://localhost:3000`
  - Authorized redirect URI: `http://localhost:4000/api/oauth/google/callback`
  - Put client ID/secret in `server/.env` as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
- GitHub/Apple are supported in the backend but hidden in the UI. If you add their credentials, also update the UI if you want to show those buttons.

### Routes
- Frontend
  - `/#/` Home
  - `/#/session` Sign up / Sign in / Forgot password
  - `/#/dashboard` Protected, PDF upload + AI session
  - `/#/reset?token=...` Reset password
  - `/#/oauth` OAuth token handler (do not open manually)
- API
  - `GET /api/health` → `{ ok: true, db: <mongoose_readyState> }`
  - Auth: `POST /api/auth/signup`, `POST /api/auth/signin`, `POST /api/auth/forgot`, `GET /api/auth/forgot`, `POST /api/auth/reset`, `GET /api/auth/me`
  - OAuth: `GET /api/oauth/google` (+ optional GitHub/Apple if configured)

### Password reset flow
- User submits email on “Forgot password”.
- If the user exists, a one-time token is created (hashed in DB) and an email is sent with `APP_BASE_URL/#/reset?token=...`. Tokens expire in 1 hour and are invalidated after use.
- The API always returns `{ ok: true }` to avoid revealing whether the email is registered.

### Troubleshooting
- Failed to fetch (frontend)
  - Ensure API is running (`npm run server`) and available at `http://localhost:4000`.
  - The client autodetects `API_BASE` when running on port 3000.
  - CORS preflight is enabled in the API.
- MongoDB error: `MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`
  - Your local MongoDB isn’t running or you’re not using Atlas. Use an Atlas connection string in `MONGODB_URI`.
- DNS error: `querySrv ENOTFOUND _mongodb._tcp.*`
  - Verify the Atlas SRV string (no typos). Consider using the “Standard (no SRV)” string or setting a reliable DNS (1.1.1.1 / 8.8.8.8).
- Port in use: `Error: listen EADDRINUSE :::4000`
  - Stop the conflicting process (on Windows PowerShell: find/kill process using port 4000) or change the port.
- Cannot GET `/api/auth/forgot`
  - Use `POST /api/auth/forgot` from the app. A `GET` fallback exists for legacy proxies but the primary is POST.
- Module not found: `nodemailer`
  - Run `npm install` to ensure server dependencies are installed.
- No email received
  - Configure Gmail SMTP with an App Password; restart the server.
  - Check API logs for `Email send error ...` or `Email preview URL ...` (Ethereal mode).

### Notes
- PDF.js worker is configured; parsing runs in the browser.
- Voice input/output uses browser APIs; microphone/speaker permissions are required.

### Scripts
- `npm run dev` API + React
- `npm run server` API only
- `npm start` React only
