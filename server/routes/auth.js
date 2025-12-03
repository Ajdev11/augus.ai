const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');

const router = express.Router();

function sign(user) {
  const payload = { id: user._id, email: user.email };
  return jwt.sign(payload, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}
function isValidEmail(value) {
  const email = String(value || '');
  if (email.length < 5 || email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidPassword(value) {
  const pwd = String(value || '');
  return pwd.length >= 8 && pwd.length <= 200;
}

// Zod schemas for input validation
const signupSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(200),
  name: z.string().max(120).optional(),
});
const signinSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
});
const emailOnlySchema = z.object({
  email: z.string().email().max(254),
});
const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(200),
});

// Rate limiters for auth endpoints (IP-based)
const signinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts, please try again later' },
});
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many sign-up attempts, please try again later' },
});
const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many reset requests, please try again later' },
});
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

router.post('/signup', async (req, res, next) => {
  try {
    const parsed = signupSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: 'Invalid email or password (min 8 chars)' });
    const { email: rawEmail, password, name } = parsed.data;
    const email = normalizeEmail(rawEmail);
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, name, passwordHash });
    const token = sign(user);
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (e) {
    next(e);
  }
});

router.post('/signin', signinLimiter, async (req, res, next) => {
  try {
    const parsed = signinSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: 'Email and password required' });
    const { email: rawEmail, password } = parsed.data;
    const email = normalizeEmail(rawEmail);
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = sign(user);
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (e) {
    next(e);
  }
});

router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('_id email name createdAt');
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

async function sendResetEmail(email, resetUrl) {
  try {
    let transporter;
    let mode = 'smtp';

    if ((process.env.SMTP_USER && process.env.SMTP_PASS) || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)) {
      const isGmail =
        (process.env.SMTP_HOST && String(process.env.SMTP_HOST).toLowerCase().includes('gmail')) ||
        (!process.env.SMTP_HOST && String(process.env.SMTP_USER || '').toLowerCase().endsWith('@gmail.com'));
      const host = process.env.SMTP_HOST || (isGmail ? 'smtp.gmail.com' : 'smtp.gmail.com');
      const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
      const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' ? true : false;
      transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      mode = isGmail ? 'gmail' : 'smtp';
    } else {
      // Dev/test fallback: ephemeral inbox via Ethereal
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      mode = 'ethereal';
    }

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER || 'no-reply@augus.ai',
      to: email,
      subject: 'Reset your augus.ai password',
      text: `Click the link to reset your password: ${resetUrl}`,
      html: `<p>Click the link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });

    // Helpful developer logs (non-production)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Mailer]', `provider=${mode}`);
      console.log('[Password reset link]', resetUrl);
      if (mode === 'ethereal') {
        const preview = nodemailer.getTestMessageUrl(info);
        if (preview) console.log('[Email preview URL]', preview);
      }
    }
  } catch (e) {
    console.error('Email send error', e);
  }
}

// Request password reset - sends email if user exists
router.post('/forgot', forgotLimiter, async (req, res, next) => {
  try {
    const parsed = emailOnlySchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: 'Email is required' });
    const { email: rawEmail } = parsed.data;
    const email = normalizeEmail(rawEmail);
    const user = await User.findOne({ email });
    if (!user) return res.json({ ok: true });
    // Invalidate previous tokens for this user
    await PasswordReset.deleteMany({ userId: user._id, usedAt: { $exists: false } });
    const token = crypto.randomBytes(24).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await PasswordReset.create({ userId: user._id, tokenHash, expiresAt });
    const base = process.env.APP_BASE_URL || 'http://localhost:3000';
    const resetUrl = `${base}/#/reset?token=${token}`;
    await sendResetEmail(email, resetUrl);
    return res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// GET fallback for environments having JSON body parsing issues (dev only) - same behavior
router.get('/forgot', forgotLimiter, async (req, res, next) => {
  try {
    const parsed = emailOnlySchema.safeParse({ email: req.query.email });
    if (!parsed.success) return res.status(400).json({ error: 'Email is required' });
    const email = normalizeEmail(parsed.data.email);
    const user = await User.findOne({ email });
    if (!user) return res.json({ ok: true });
    await PasswordReset.deleteMany({ userId: user._id, usedAt: { $exists: false } });
    const token = crypto.randomBytes(24).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await PasswordReset.create({ userId: user._id, tokenHash, expiresAt });
    const base = process.env.APP_BASE_URL || 'http://localhost:3000';
    const resetUrl = `${base}/#/reset?token=${token}`;
    await sendResetEmail(email, resetUrl);
    return res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/reset', resetLimiter, async (req, res, next) => {
  try {
    const parsed = resetSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: 'Token and valid password (min 8 chars) required' });
    const { token, password } = parsed.data;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const pr = await PasswordReset.findOne({ tokenHash, usedAt: { $exists: false } });
    if (!pr) return res.status(400).json({ error: 'Invalid token' });
    if (new Date() > pr.expiresAt) return res.status(400).json({ error: 'Token expired' });
    const user = await User.findById(pr.userId);
    if (!user) return res.status(400).json({ error: 'Invalid token' });
    user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();
    pr.usedAt = new Date();
    await pr.save();
    return res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;


