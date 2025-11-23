const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
let AppleStrategy;
try { AppleStrategy = require('passport-apple'); } catch {}

const router = express.Router();

const FRONTEND = process.env.APP_BASE_URL || 'http://localhost:3000';
const API_BASE = process.env.API_BASE_URL || 'http://localhost:4000';

passport.serializeUser((user, done) => {
  done(null, { id: user._id });
});
passport.deserializeUser((obj, done) => done(null, obj));

function sign(user) {
  const payload = { id: user._id, email: user.email };
  return jwt.sign(payload, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
}

async function upsertUserFromProfile({ email, name, providerKey, providerId }) {
  if (!email) throw new Error('Email not provided by provider');
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ email, name, providers: { [providerKey]: providerId } });
  } else {
    if (!user.providers) user.providers = {};
    if (!user.providers[providerKey]) {
      user.providers[providerKey] = providerId;
      await user.save();
    }
  }
  return user;
}

// Configure Google
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${API_BASE}/api/oauth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] && profile.emails[0].value;
          const name = profile.displayName || '';
          const user = await upsertUserFromProfile({ email, name, providerKey: 'googleId', providerId: profile.id });
          return done(null, user);
        } catch (e) {
          return done(e);
        }
      }
    )
  );
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' }));
  router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: `${FRONTEND}/#/session?error=google` }),
    (req, res) => {
      const token = sign(req.user);
      res.redirect(`${FRONTEND}/#/oauth?token=${encodeURIComponent(token)}`);
    }
  );
}

// Configure GitHub
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${API_BASE}/api/oauth/github/callback`,
        scope: ['user:email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email =
            (profile.emails && profile.emails.find((e) => e && e.value && e.verified)?.value) ||
            (profile.emails && profile.emails[0] && profile.emails[0].value);
          const name = profile.displayName || profile.username || '';
          const user = await upsertUserFromProfile({ email, name, providerKey: 'githubId', providerId: profile.id });
          return done(null, user);
        } catch (e) {
          return done(e);
        }
      }
    )
  );
  router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
  router.get(
    '/github/callback',
    passport.authenticate('github', { failureRedirect: `${FRONTEND}/#/session?error=github` }),
    (req, res) => {
      const token = sign(req.user);
      res.redirect(`${FRONTEND}/#/oauth?token=${encodeURIComponent(token)}`);
    }
  );
}

// Apple (optional; requires configured keys)
if (AppleStrategy && process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
  passport.use(
    new AppleStrategy(
      {
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        key: process.env.APPLE_PRIVATE_KEY.split('\\n').join('\n'),
        callbackURL: `${API_BASE}/api/oauth/apple/callback`,
        scope: ['name', 'email'],
      },
      async (accessToken, refreshToken, idToken, profile, done) => {
        try {
          const email = (profile && profile.email) || (idToken && idToken.email);
          const name = profile && profile.name && (profile.name.firstName + ' ' + profile.name.lastName);
          const user = await upsertUserFromProfile({ email, name, providerKey: 'appleId', providerId: profile.id });
          return done(null, user);
        } catch (e) {
          return done(e);
        }
      }
    )
  );
  router.post('/apple', passport.authenticate('apple'));
  router.post(
    '/apple/callback',
    passport.authenticate('apple', { failureRedirect: `${FRONTEND}/#/session?error=apple` }),
    (req, res) => {
      const token = sign(req.user);
      res.redirect(`${FRONTEND}/#/oauth?token=${encodeURIComponent(token)}`);
    }
  );
}

router.get('/providers', (_req, res) => {
  res.json({
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    apple: !!(process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY),
  });
});

module.exports = router;


