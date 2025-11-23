const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const crypto = require('crypto');
const auth = require('../middleware/auth');

const router = express.Router();

function sign(user) {
  const payload = { id: user._id, email: user.email };
  return jwt.sign(payload, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
}

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
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

router.post('/signin', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
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

// Request password reset - dev: returns link
router.post('/forgot', async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const user = await User.findOne({ email });
    if (!user) {
      // Do not reveal user existence; still respond ok
      return res.json({ ok: true });
    }
    // Invalidate previous tokens for this user
    await PasswordReset.deleteMany({ userId: user._id, usedAt: { $exists: false } });
    const token = crypto.randomBytes(24).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await PasswordReset.create({ userId: user._id, tokenHash, expiresAt });
    const resetUrl = `/reset?token=${token}`;
    // In production send email instead of returning URL
    return res.json({ ok: true, resetUrl });
  } catch (e) {
    next(e);
  }
});

// GET fallback for environments having JSON body parsing issues (dev only)
router.get('/forgot', async (req, res, next) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const user = await User.findOne({ email });
    if (!user) return res.json({ ok: true });
    await PasswordReset.deleteMany({ userId: user._id, usedAt: { $exists: false } });
    const token = crypto.randomBytes(24).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await PasswordReset.create({ userId: user._id, tokenHash, expiresAt });
    const resetUrl = `/reset?token=${token}`;
    return res.json({ ok: true, resetUrl });
  } catch (e) {
    next(e);
  }
});

router.post('/reset', async (req, res, next) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
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


