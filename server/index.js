const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const passport = require('passport');

// Load env BEFORE requiring routes (so providers enable correctly)
dotenv.config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const oauthRoutes = require('./routes/oauth');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.options('*', cors());
// Sessions for OAuth (dev memory store is fine)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'devsession',
    resave: false,
    saveUninitialized: false,
    cookie: { sameSite: 'lax' },
  })
);
app.use(passport.initialize());
app.use(passport.session());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/augus_ai';
const PORT = process.env.PORT || 4000;

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB error', err));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));


