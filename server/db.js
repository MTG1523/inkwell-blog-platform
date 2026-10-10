// db.js — better-sqlite3, writes to /tmp on Vercel (ephemeral but works)
const Database = require('better-sqlite3');
const path = require('path');

// Vercel serverless: only /tmp is writable at runtime
const dbPath = process.env.VERCEL
  ? '/tmp/blog.db'
  : path.join(__dirname, '..', 'blog.db');

const rawDb = new Database(dbPath);

rawDb.pragma('journal_mode = WAL');
rawDb.pragma('foreign_keys = ON');

rawDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    bio TEXT DEFAULT '',
    avatar_color TEXT DEFAULT '#7c3aed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    read_time INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Wrap in Promises so route handlers work uniformly
const db = {
  prepare(sql) {
    const stmt = rawDb.prepare(sql);
    return {
      get:  (...args) => Promise.resolve(stmt.get(...args)),
      all:  (...args) => Promise.resolve(stmt.all(...args)),
      run:  (...args) => Promise.resolve(stmt.run(...args)),
    };
  },
  exec: (sql) => { rawDb.exec(sql); return Promise.resolve(); },
  _raw: rawDb,
};

module.exports = db;
