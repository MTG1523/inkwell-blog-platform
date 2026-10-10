// db.js — supports both Turso (cloud) and local SQLite
// Turso is used when TURSO_DATABASE_URL env var is set (Vercel production)
// Falls back to better-sqlite3 for local dev

let db;

if (process.env.TURSO_DATABASE_URL) {
  // ── Turso / libSQL (async client wrapped to match sync API surface) ──
  const { createClient } = require('@libsql/client');

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  // Run schema migrations
  async function init() {
    await client.executeMultiple(`
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
  }

  // Async wrapper that mimics better-sqlite3's sync API for our routes
  db = {
    _client: client,
    _init: init(),
    prepare(sql) {
      return {
        _sql: sql,
        async get(...args) {
          await db._init;
          const result = await client.execute({ sql, args });
          return result.rows[0] ? rowToObj(result.rows[0], result.columns) : undefined;
        },
        async all(...args) {
          await db._init;
          const result = await client.execute({ sql, args });
          return result.rows.map(r => rowToObj(r, result.columns));
        },
        async run(...args) {
          await db._init;
          const result = await client.execute({ sql, args });
          return { lastInsertRowid: result.lastInsertRowid, changes: result.rowsAffected };
        },
      };
    },
    async exec(sql) {
      await db._init;
      await client.executeMultiple(sql);
    },
    pragma() {}, // no-op for Turso
  };

  function rowToObj(row, columns) {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  }

  console.log('🌐 Using Turso cloud database');
} else {
  // ── Local SQLite via better-sqlite3 (synchronous) ──
  const Database = require('better-sqlite3');
  const path = require('path');
  const rawDb = new Database(path.join(__dirname, '..', 'blog.db'));

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

  // Wrap sync better-sqlite3 to return Promises (so route handlers work with both)
  db = {
    prepare(sql) {
      const stmt = rawDb.prepare(sql);
      return {
        get: (...args) => Promise.resolve(stmt.get(...args)),
        all: (...args) => Promise.resolve(stmt.all(...args)),
        run: (...args) => Promise.resolve(stmt.run(...args)),
      };
    },
    exec: (sql) => { rawDb.exec(sql); return Promise.resolve(); },
    pragma: (...args) => rawDb.pragma(...args),
    // Expose raw for seed script
    _raw: rawDb,
  };

  console.log('💾 Using local SQLite database');
}

module.exports = db;
