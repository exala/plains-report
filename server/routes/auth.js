const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDbWrapper } = require('../db/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const BCRYPT_ROUNDS = 10;
const JWT_EXPIRY = '7d';

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email, and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const db = await getDbWrapper();
  const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
  if (existing) {
    return res.status(409).json({ error: 'Email or username already in use' });
  }

  try {
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    ).run(username, email, hash);

    const user = { id: result.lastInsertRowid, username, email, is_admin: 0 };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRY });
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const db = await getDbWrapper();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(404).json({ error: 'No account found with that email' });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const payload = { id: user.id, username: user.username, email: user.email, is_admin: user.is_admin };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRY });
  res.json({ token, user: payload });
});

router.get('/me', authMiddleware, async (req, res) => {
  const db = await getDbWrapper();
  const user = db.prepare('SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = router;
