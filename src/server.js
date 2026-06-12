// src/server.js — Fayaz Khan Consultancy backend.
const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { sessionMiddleware } = require('./session');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);

// ---- Helpers -------------------------------------------------------------
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');

function requireAuth(req, res, next) {
  if (!req.session) return res.status(401).json({ error: 'Please log in first.' });
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session || req.session.role !== 'admin')
    return res.status(403).json({ error: 'Admin access only.' });
  next();
}

// ---- Auth API ------------------------------------------------------------
app.post('/api/register', (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  if (name.length < 2) return res.status(400).json({ error: 'Please enter your full name.' });
  if (!isEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'An account with this email already exists.' });

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
  ).run(name, email, hash, 'student');

  const user = { id: Number(info.lastInsertRowid), name, email, role: 'student' };
  res.setSession(user);
  res.json({ ok: true, user });
});

app.post('/api/login', (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!row || !bcrypt.compareSync(password, row.password))
    return res.status(401).json({ error: 'Incorrect email or password.' });

  const user = { id: row.id, name: row.name, email: row.email, role: row.role };
  res.setSession(user);
  res.json({ ok: true, user });
});

app.post('/api/logout', (req, res) => {
  res.clearSession();
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  res.json({ user: req.session || null });
});

// ---- Applications API ----------------------------------------------------
app.post('/api/applications', (req, res) => {
  const b = req.body;
  const full_name = (b.full_name || '').trim();
  const email = (b.email || '').trim().toLowerCase();
  const degree = (b.degree || '').trim();

  if (full_name.length < 2) return res.status(400).json({ error: 'Please enter your full name.' });
  if (!isEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!degree) return res.status(400).json({ error: 'Please choose a degree (Master\'s/ME or Ph.D.).' });

  const info = db.prepare(`
    INSERT INTO applications
      (user_id, full_name, email, phone, degree, field, country, gpa, ielts, statement)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.session ? req.session.id : null,
    full_name, email,
    (b.phone || '').trim(),
    degree,
    (b.field || '').trim(),
    (b.country || '').trim(),
    (b.gpa || '').trim(),
    (b.ielts || '').trim(),
    (b.statement || '').trim()
  );
  res.json({ ok: true, id: Number(info.lastInsertRowid) });
});

// A logged-in student can see their own applications.
app.get('/api/my-applications', requireAuth, (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.session.id);
  res.json({ applications: rows });
});

// ---- Contact API ---------------------------------------------------------
app.post('/api/contact', (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const subject = (req.body.subject || '').trim();
  const body = (req.body.message || req.body.body || '').trim();

  if (name.length < 2) return res.status(400).json({ error: 'Please enter your name.' });
  if (!isEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (body.length < 10) return res.status(400).json({ error: 'Message must be at least 10 characters.' });

  db.prepare('INSERT INTO messages (name, email, subject, body) VALUES (?, ?, ?, ?)')
    .run(name, email, subject, body);
  res.json({ ok: true });
});

// ---- Admin API -----------------------------------------------------------
app.get('/api/admin/summary', requireAdmin, (req, res) => {
  const count = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
  res.json({
    students: db.prepare("SELECT COUNT(*) AS n FROM users WHERE role='student'").get().n,
    applications: count('applications'),
    messages: count('messages'),
  });
});
app.get('/api/admin/applications', requireAdmin, (req, res) => {
  res.json({ applications: db.prepare('SELECT * FROM applications ORDER BY created_at DESC').all() });
});
app.get('/api/admin/messages', requireAdmin, (req, res) => {
  res.json({ messages: db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all() });
});
app.get('/api/admin/students', requireAdmin, (req, res) => {
  res.json({ students: db.prepare("SELECT id, name, email, created_at FROM users WHERE role='student' ORDER BY created_at DESC").all() });
});
app.post('/api/admin/applications/:id/status', requireAdmin, (req, res) => {
  const allowed = ['new', 'in-review', 'submitted', 'accepted', 'closed'];
  const status = (req.body.status || '').trim();
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

// ---- Static files & page routes -----------------------------------------
const PUBLIC = path.join(__dirname, '..', 'public');

// Protect the admin page at the route level (runs BEFORE static so it can't be bypassed).
app.get('/pages/admin.html', (req, res, next) => {
  if (!req.session || req.session.role !== 'admin') return res.redirect('/pages/login.html');
  res.sendFile(path.join(PUBLIC, 'pages', 'admin.html'));
});

app.use(express.static(PUBLIC));

app.use((req, res) => res.status(404).sendFile(path.join(PUBLIC, '404.html')));

app.listen(PORT, () => {
  console.log(`\n  Fayaz Khan Consultancy running → http://localhost:${PORT}\n`);
});
