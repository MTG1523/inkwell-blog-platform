require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/posts', require('./server/routes/posts'));
app.use('/api/posts/:postId/comments', require('./server/routes/comments'));

// Delete comment — standalone route
const db = require('./server/db');
const { authMiddleware } = require('./server/auth');
app.delete('/api/comments/:id', authMiddleware, async (req, res) => {
  try {
    const comment = await db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (Number(comment.author_id) !== req.user.id)
      return res.status(403).json({ error: 'Not authorized' });
    await db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('DELETE comment error:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Fallback: serve index for any unknown GET (SPA-style)
app.get('{*splat}', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Blog Platform running at http://localhost:${PORT}\n`);
});
