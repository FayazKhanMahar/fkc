# Fayaz Khan Consultancy — Website + Backend

A complete consultancy website for guiding students into funded **Master's (ME)** and **Ph.D.** programmes abroad. Modern responsive frontend plus a real Node.js + SQLite backend with accounts, applications, a contact inbox, and an admin dashboard.

## What's inside

```
fkc/
├── public/              # the website (served as static files)
│   ├── index.html       # homepage
│   ├── 404.html
│   ├── css/style.css    # full design system
│   ├── js/main.js       # shared frontend logic + API helper
│   ├── img/             # your images (logo, QR, photos)
│   ├── favicon/
│   └── pages/           # apply, login, register, services, about, contact, admin
├── src/
│   ├── server.js        # Express server + all API routes
│   ├── db.js            # SQLite schema + seeded admin
│   └── session.js       # signed-cookie sessions (no native deps)
├── data/                # SQLite database file is created here automatically
└── package.json
```

## Requirements

- **Node.js 22 or newer** (uses the built-in `node:sqlite` module — no native build needed).

## Run it

```bash
cd fkc
npm install          # installs express + bcryptjs only
npm start            # starts on http://localhost:3000
```

Then open **http://localhost:3000**.

## Admin login

An admin account is created automatically on first run. The defaults are:

- **Email:** `admin@fayazkhan.consultancy`
- **Password:** `admin123`

**Change these** by setting environment variables before the first run (so they get used when the admin is seeded):

```bash
ADMIN_EMAIL="khanfayazmahar31@gmail.com" ADMIN_PASSWORD="your-strong-password" npm start
```

> If you already ran the app once, the admin is already saved with the old credentials.
> To re-seed, delete `data/fkc.db` and start again.

Log in at `/pages/login.html` with the admin account — you'll be taken to the **admin dashboard** (`/pages/admin.html`) where you can see every application, message, and registered student, and change each application's status.

## How it works

- **Register / Login** — passwords are hashed with bcrypt; sessions are stored in a signed, HttpOnly cookie.
- **Apply** — the application form saves to the database. Logged-in students are linked to their applications.
- **Contact** — messages are stored and shown in the admin inbox.
- **Admin** — protected by role; students get a 403 if they try to reach admin APIs.

## Configuration (optional)

Set these environment variables to customise:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Port to listen on |
| `ADMIN_EMAIL` | `admin@fayazkhan.consultancy` | Seeded admin email |
| `ADMIN_PASSWORD` | `admin123` | Seeded admin password |
| `SESSION_SECRET` | dev default | **Change in production** — signs session cookies |

Example for production:

```bash
PORT=8080 SESSION_SECRET="a-long-random-string" \
ADMIN_EMAIL="khanfayazmahar31@gmail.com" ADMIN_PASSWORD="strong-pass" \
npm start
```

## Notes for going live

- Put this behind a host that runs Node (Render, Railway, a VPS, etc.). The `data/` folder must be writable and persistent.
- Set a real `SESSION_SECRET` and a strong admin password.
- To actually email contact submissions instead of only storing them, plug an SMTP library (e.g. nodemailer) into the `/api/contact` route in `src/server.js`.
