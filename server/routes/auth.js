const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'All fields are required' });
  if (username.length < 3)
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const hash = await bcrypt.hash(password, 12);
    const colors = ['#7c3aed', '#2563eb', '#059669', '#dc2626', '#d97706', '#db2777'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];
    const result = await db.prepare(
      'INSERT INTO users (username, email, password_hash, avatar_color) VALUES (?, ?, ?, ?)'
    ).run(username, email, hash, avatarColor);
    const token = jwt.sign({ id: Number(result.lastInsertRowid), username }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: Number(result.lastInsertRowid), username, email, avatarColor } });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      const field = err.message.includes('username') ? 'Username' : 'Email';
      return res.status(409).json({ error: `${field} already taken` });
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  try {
    const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: Number(user.id), username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: Number(user.id), username: user.username, email: user.email, avatarColor: user.avatar_color }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Not authenticated' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.prepare('SELECT id, username, email, bio, avatar_color, created_at FROM users WHERE id = ?').get(decoded.id);
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
