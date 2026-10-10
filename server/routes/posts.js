const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../auth');

const router = express.Router();

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') +
    '-' + Date.now();
}

function calcReadTime(content) {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function makeExcerpt(content) {
  const plain = content.replace(/[#*`_~>\[\]!]/g, '').replace(/\n+/g, ' ').trim();
  return plain.length > 160 ? plain.slice(0, 157) + '...' : plain;
}

// GET /api/posts
router.get('/', async (req, res) => {
  try {
    const posts = await db.prepare(`
      SELECT p.*, u.username, u.avatar_color,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
      FROM posts p
      JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
    `).all();
    res.json(posts);
  } catch (err) {
    console.error('GET /posts error:', err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /api/posts/:idOrSlug
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const post = await db.prepare(`
      SELECT p.*, u.username, u.avatar_color, u.bio
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = ? OR p.slug = ?
    `).get(idOrSlug, idOrSlug);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    console.error('GET /posts/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// POST /api/posts
router.post('/', authMiddleware, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });
  if (title.length < 5) return res.status(400).json({ error: 'Title must be at least 5 characters' });
  if (content.length < 20) return res.status(400).json({ error: 'Content must be at least 20 characters' });

  try {
    const slug = slugify(title);
    const excerpt = makeExcerpt(content);
    const read_time = calcReadTime(content);
    const result = await db.prepare(
      'INSERT INTO posts (author_id, title, slug, content, excerpt, read_time) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, title, slug, content, excerpt, read_time);
    const post = await db.prepare(
      'SELECT p.*, u.username, u.avatar_color FROM posts p JOIN users u ON p.author_id = u.id WHERE p.id = ?'
    ).get(Number(result.lastInsertRowid));
    res.status(201).json(post);
  } catch (err) {
    console.error('POST /posts error:', err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// PUT /api/posts/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (Number(post.author_id) !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });

    const excerpt = makeExcerpt(content);
    const read_time = calcReadTime(content);
    await db.prepare(
      'UPDATE posts SET title=?, content=?, excerpt=?, read_time=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
    ).run(title, content, excerpt, read_time, req.params.id);

    const updated = await db.prepare(
      'SELECT p.*, u.username, u.avatar_color FROM posts p JOIN users u ON p.author_id = u.id WHERE p.id = ?'
    ).get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('PUT /posts/:id error:', err);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// DELETE /api/posts/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (Number(post.author_id) !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    await db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error('DELETE /posts/:id error:', err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

module.exports = router;
