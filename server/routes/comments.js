const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../auth');

const router = express.Router({ mergeParams: true });

// GET /api/posts/:postId/comments
router.get('/', async (req, res) => {
  try {
    const comments = await db.prepare(`
      SELECT c.*, u.username, u.avatar_color
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(req.params.postId);
    res.json(comments);
  } catch (err) {
    console.error('GET comments error:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/posts/:postId/comments
router.post('/', authMiddleware, async (req, res) => {
  const { content } = req.body;
  if (!content || content.trim().length < 2)
    return res.status(400).json({ error: 'Comment cannot be empty' });

  try {
    const post = await db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const result = await db.prepare(
      'INSERT INTO comments (post_id, author_id, content) VALUES (?, ?, ?)'
    ).run(req.params.postId, req.user.id, content.trim());

    const comment = await db.prepare(`
      SELECT c.*, u.username, u.avatar_color
      FROM comments c JOIN users u ON c.author_id = u.id
      WHERE c.id = ?
    `).get(Number(result.lastInsertRowid));
    res.status(201).json(comment);
  } catch (err) {
    console.error('POST comment error:', err);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

module.exports = router;
