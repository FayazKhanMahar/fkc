// src/session.js — minimal signed-cookie sessions, no native dependencies.
const crypto = require('crypto');

const SECRET = process.env.SESSION_SECRET || 'fkc-dev-secret-change-me';
const COOKIE = 'fkc_session';
const MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days

function sign(value) {
  const sig = crypto.createHmac('sha256', SECRET).update(value).digest('base64url');
  return `${value}.${sig}`;
}

function unsign(signed) {
  if (!signed) return null;
  const idx = signed.lastIndexOf('.');
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto.createHmac('sha256', SECRET).update(value).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return value;
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return Object.fromEntries(
    header.split(';').map((c) => {
      const i = c.indexOf('=');
      return [decodeURIComponent(c.slice(0, i).trim()), decodeURIComponent(c.slice(i + 1).trim())];
    }).filter((p) => p[0])
  );
}

const isProd = process.env.NODE_ENV === 'production';
const secure = isProd ? ' Secure;' : '';

// Middleware: attaches req.session (read) and res.setSession / res.clearSession.
function sessionMiddleware(req, res, next) {
  const cookies = parseCookies(req);
  const raw = unsign(cookies[COOKIE]);
  let data = null;
  if (raw) {
    try {
      const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
      if (parsed.exp && parsed.exp > Date.now()) data = parsed.user;
    } catch { /* ignore malformed */ }
  }
  req.session = data; // null or { id, name, email, role }

  res.setSession = (user) => {
    const payload = Buffer.from(
      JSON.stringify({ user, exp: Date.now() + MAX_AGE })
    ).toString('base64url');
    const cookie = `${COOKIE}=${encodeURIComponent(sign(payload))}; HttpOnly;${secure} Path=/; Max-Age=${MAX_AGE / 1000}; SameSite=Lax`;
    res.setHeader('Set-Cookie', cookie);
  };
  res.clearSession = () => {
    res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly;${secure} Path=/; Max-Age=0; SameSite=Lax`);
  };
  next();
}

module.exports = { sessionMiddleware };
