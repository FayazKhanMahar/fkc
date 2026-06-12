// src/db.js — SQLite database layer using Node's built-in driver.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// DATA_DIR can be overridden (e.g. a Render persistent disk) via env var so
// the database survives redeploys. Falls back to the local ./data folder.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'fkc.db'));
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// --- Schema ---------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    email        TEXT    NOT NULL UNIQUE,
    password     TEXT    NOT NULL,
    role         TEXT    NOT NULL DEFAULT 'student',
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER,
    full_name     TEXT NOT NULL,
    email         TEXT NOT NULL,
    phone         TEXT,
    degree        TEXT NOT NULL,        -- 'ME / Master\\'s' or 'PhD'
    field         TEXT,                 -- field of study
    country       TEXT,                 -- target country
    gpa           TEXT,
    ielts         TEXT,
    statement     TEXT,                 -- why / background
    status        TEXT NOT NULL DEFAULT 'new',
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    subject     TEXT,
    body        TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// --- Seed a default admin so the owner can log in immediately -------------
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@fayazkhan.consultancy';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(ADMIN_EMAIL);
if (!existingAdmin) {
  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  db.prepare(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
  ).run('Fayaz Khan', ADMIN_EMAIL, hash, 'admin');
  console.log(`[db] Seeded admin account: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

module.exports = db;
