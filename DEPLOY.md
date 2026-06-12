# Putting Fayaz Khan Consultancy online (free)

This guide takes your site from your computer to a live `https://` link using **Render**, which is free and needs no credit card. Total time: about 10 minutes.

You'll do three things: put your code on GitHub, connect it to Render, and set your admin login.

---

## Before you start

You need two free accounts (sign up if you don't have them):

- **GitHub** — https://github.com  (stores your code)
- **Render** — https://render.com  (runs your site). Sign up with your GitHub account to make linking easier.

---

## Step 1 — Put your code on GitHub

The easiest way is **GitHub Desktop** (no command line needed):

1. Download and install GitHub Desktop: https://desktop.github.com
2. Open it and sign in with your GitHub account.
3. Click **File → Add Local Repository**, then choose your `fkc` folder.
4. It will say the folder isn't a repository yet — click **create a repository**.
5. Leave the defaults and click **Create Repository**.
6. Click **Publish repository** (top right). Untick "Keep this code private" if you want, then **Publish**.

Your code is now on GitHub. (The `.gitignore` already keeps `node_modules` and your local database out of it — that's correct.)

> Prefer the command line? From inside the `fkc` folder:
> ```bash
> git init
> git add .
> git commit -m "Fayaz Khan Consultancy"
> git branch -M main
> git remote add origin https://github.com/YOUR_USERNAME/fkc.git
> git push -u origin main
> ```

---

## Step 2 — Deploy on Render

1. Go to https://dashboard.render.com and log in.
2. Click **New +** → **Web Service**.
3. Connect your GitHub account if asked, then **select your `fkc` repository**.
4. Render reads the included `render.yaml` and fills most settings in. Confirm these:
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Plan:** Free
5. Open the **Environment / Environment Variables** section and add your admin login:
   - `ADMIN_EMAIL` = `khanfayazmahar31@gmail.com`
   - `ADMIN_PASSWORD` = `MehakFayaz`  *(or any strong password you like)*
   
   `NODE_ENV`, `DATA_DIR`, and `SESSION_SECRET` are already set for you by the blueprint — leave them.
6. Click **Create Web Service** (or **Deploy**).

Render now builds and starts your site. The first build takes 1–3 minutes. When it finishes you'll see a green **Live** badge and a URL like:

```
https://fayaz-khan-consultancy.onrender.com
```

That's your live website. Open it, then log in at `/pages/login.html` with the admin email and password you set.

---

## Good to know

- **Free tier "sleeps."** After 15 minutes with no visitors, the free service goes to sleep, and the next visit takes 30–60 seconds to wake it up. That's normal. Upgrading to Render's paid plan (about $7/month) removes the sleep if you want it always instant.
- **Your data is safe across updates.** The `render.yaml` attaches a 1 GB persistent disk and points the database at it, so students, applications, and messages are **not** lost when you redeploy.
- **Updating the site later.** Just push your changes to GitHub (in GitHub Desktop: **Commit**, then **Push**). Render auto-deploys the new version.
- **Changing the admin password later.** Edit `ADMIN_PASSWORD` in Render's Environment settings. Note it only re-seeds on a fresh database — to apply a new password to an existing live database, use the reset approach described in `README.md` (or ask for the optional `reset-admin` script).
- **A custom domain** (like `fayazkhanconsultancy.com`) can be added later in Render under **Settings → Custom Domains** once you buy the domain name.

---

## Other free options

If you ever want alternatives: **Railway** and **Fly.io** also run Node apps but now use trial/usage-based pricing. For a simple always-free start, Render is the easiest fit for this project.
