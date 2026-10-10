// Seed script — populates the DB with demo users and posts
const bcrypt = require('bcryptjs');

// Initialize DB (creates tables if not exist)
const db = require('./server/db');

const seedData = async () => {
  // Seed users
  const hash1 = await bcrypt.hash('password123', 12);
  const hash2 = await bcrypt.hash('password123', 12);
  const hash3 = await bcrypt.hash('password123', 12);

  const insertUser = db.prepare(
    'INSERT OR IGNORE INTO users (username, email, password_hash, bio, avatar_color) VALUES (?, ?, ?, ?, ?)'
  );

  insertUser.run('alice', 'alice@example.com', hash1, 'Full-stack developer and coffee enthusiast ☕', '#7c3aed');
  insertUser.run('bob', 'bob@example.com', hash2, 'Writer, thinker, occasional coder 🖊️', '#059669');
  insertUser.run('carol', 'carol@example.com', hash3, 'UX designer who codes on weekends 🎨', '#db2777');

  const alice = db.prepare('SELECT id FROM users WHERE username = ?').get('alice');
  const bob = db.prepare('SELECT id FROM users WHERE username = ?').get('bob');
  const carol = db.prepare('SELECT id FROM users WHERE username = ?').get('carol');

  const insertPost = db.prepare(
    'INSERT OR IGNORE INTO posts (author_id, title, slug, content, excerpt, read_time) VALUES (?, ?, ?, ?, ?, ?)'
  );

  // Post 1
  insertPost.run(alice.id, 'Getting Started with Node.js and Express',
    'getting-started-nodejs-express-seed1',
    `# Getting Started with Node.js and Express

Node.js has revolutionized backend development by bringing JavaScript to the server side. In this post, we'll explore how to build a REST API with Express.

## Why Node.js?

Node.js is **non-blocking** and event-driven, making it perfect for I/O-heavy applications like APIs, real-time apps, and microservices.

## Setting Up Express

\`\`\`bash
npm init -y
npm install express
\`\`\`

Create your first server:

\`\`\`javascript
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

app.listen(3000, () => console.log('Server running!'));
\`\`\`

## Key Concepts

- **Middleware** — Functions that run between the request and response
- **Routing** — Define handlers for different HTTP methods and paths
- **Error handling** — Centralized error management with express error handlers

## Next Steps

Once you're comfortable with the basics, explore:
- **Authentication** with JWT or sessions
- **Database integration** with SQLite, PostgreSQL, or MongoDB
- **Deployment** to platforms like Railway or Render

> The best way to learn is by building something you care about. Start small, iterate fast!`,
    'Node.js has revolutionized backend development by bringing JavaScript to the server side. Explore how to build a REST API with Express.',
    4
  );

  // Post 2
  insertPost.run(bob.id, 'The Art of Writing Clean Code',
    'art-of-writing-clean-code-seed2',
    `# The Art of Writing Clean Code

Clean code is not just about making things work — it's about making them **understandable, maintainable, and elegant**.

## What is Clean Code?

Robert C. Martin (Uncle Bob) defines clean code as code that is:

- **Simple** — Does one thing well
- **Readable** — Reads like well-written prose
- **Testable** — Easy to write tests for
- **Minimal** — No duplication, no waste

## Naming Things

One of the hardest problems in programming. A good name tells you:

1. What the variable/function is
2. What it does
3. How it should be used

**Bad:**
\`\`\`javascript
const d = new Date();
const x = users.filter(u => u.a);
\`\`\`

**Good:**
\`\`\`javascript
const createdAt = new Date();
const activeUsers = users.filter(user => user.isActive);
\`\`\`

## Functions Should Do One Thing

> A function should do one thing, do it well, and do it only.

Keep functions small. If you can't describe what a function does without using the word "and," it does too much.

## Comments Are Not a Substitute for Clear Code

Write code so clear it doesn't need comments. When you do comment, explain *why*, not *what*.

\`\`\`javascript
// BAD: increment counter
counter++;

// GOOD: retry limit reached — escalate to human review
if (retryCount >= MAX_RETRIES) escalateToHuman(ticket);
\`\`\`

## Conclusion

Writing clean code is a discipline. It takes time, practice, and empathy for the people who will read your code — including future you.`,
    'Clean code is not just about making things work — it\'s about making them understandable, maintainable, and elegant.',
    5
  );

  // Post 3
  insertPost.run(carol.id, 'Design Systems: Why Consistency Wins',
    'design-systems-consistency-wins-seed3',
    `# Design Systems: Why Consistency Wins

A design system is more than a style guide. It's a **living documentation** of your product's visual and functional language.

## The Problem It Solves

Without a design system, teams face:

- Inconsistent UI components across pages
- Duplicated effort building the same button 12 times
- Design drift as the product grows
- Slow onboarding for new designers and developers

## Core Components of a Design System

### 1. Design Tokens
Variables that store values for color, spacing, typography, and more.

\`\`\`css
:root {
  --color-primary: #7c3aed;
  --spacing-md: 16px;
  --font-weight-bold: 700;
}
\`\`\`

### 2. Component Library
Reusable UI components — buttons, inputs, cards, modals — documented with usage guidelines.

### 3. Patterns & Guidelines
Rules for how components compose together to solve common UX problems.

## Building vs. Buying

You don't always need to build from scratch. Popular choices:

| System | Best for |
|--------|---------|
| Material Design | Google-aligned products |
| Radix UI | Accessible React components |
| Shadcn/ui | Tailwind + Radix combo |
| Custom | Unique brand requirements |

## Start Small

Don't try to document everything on day one. Start with your most-used components and grow organically. A small, well-maintained design system beats a massive, abandoned one.

> Consistency is not about perfection — it's about creating familiar experiences that users can trust.`,
    'A design system is more than a style guide. It\'s a living documentation of your product\'s visual and functional language.',
    4
  );

  // Add some comments
  const post1 = db.prepare('SELECT id FROM posts WHERE slug LIKE ?').get('getting-started-nodejs%');
  const post2 = db.prepare('SELECT id FROM posts WHERE slug LIKE ?').get('art-of-writing%');

  if (post1 && bob && carol) {
    db.prepare('INSERT OR IGNORE INTO comments (post_id, author_id, content) VALUES (?, ?, ?)').run(
      post1.id, bob.id, 'Great intro! I started with Node.js last year and it completely changed how I think about servers. The async model takes some getting used to but it\'s so powerful once it clicks.'
    );
    db.prepare('INSERT OR IGNORE INTO comments (post_id, author_id, content) VALUES (?, ?, ?)').run(
      post1.id, carol.id, 'Really helpful! Would love to see a follow-up on adding authentication to Express apps. JWT middleware specifically.'
    );
  }

  if (post2 && alice) {
    db.prepare('INSERT OR IGNORE INTO comments (post_id, author_id, content) VALUES (?, ?, ?)').run(
      post2.id, alice.id, 'The naming examples are spot on. I\'ve been guilty of single-letter variable names way too many times. The "and" rule for functions is a great mental model I\'ll use from now on!'
    );
  }

  console.log('\n✅ Seed complete!\n');
  console.log('Demo accounts:');
  console.log('  alice@example.com / password123');
  console.log('  bob@example.com   / password123');
  console.log('  carol@example.com / password123\n');
};

seedData().catch(console.error);
