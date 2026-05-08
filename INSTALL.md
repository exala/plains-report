# Phase 2 — Installation Guide

Phase 1 must be fully live before starting Phase 2.

## Step 1 — Create new directories in your plains-report project

These directories do not exist in Phase 1 and must be created before copying files:

```bash
mkdir -p server/telegram
mkdir -p server/scripts
mkdir -p client/src/services
```

---

## Step 2 — Copy new and updated files

Replace/add the following files from this package into your existing plains-report directory:

**New server files:**
- server/telegram/bot.js
- server/services/sitemap.js
- server/scripts/generate-og-image.js

**Updated server files (replace existing):**
- server/index.js
- server/routes/feed.js
- server/routes/admin.js
- server/workers/enrichmentWorker.js

**New root file (did not exist in Phase 1):**
- ecosystem.config.js

**Add to server/services/claude.js manually:**
- Copy the `generateMailbag` function from `server/services/claude_mailbag_addition.js`
- Add `mailbag: 'MAILBAG'` to `ORIGINAL_TYPE_MAP`
- Add `generateMailbag` to `module.exports`

**New client files:**
- client/src/pages/Article.jsx
- client/src/components/ShareButtons.jsx
- client/src/components/SearchBar.jsx
- client/src/components/EarlMeter.jsx
- client/src/services/hashtags.js
- client/public/robots.txt

**Updated client files (replace existing):**
- client/src/App.jsx
- client/src/components/StoryCard.jsx
- client/src/components/OriginalCard.jsx
- client/src/components/FilterBar.jsx
- client/src/pages/Feed.jsx
- client/index.html

**Updated root file:**
- .env.example (add Phase 2 vars to your existing .env)

---

## Step 3 — Install new npm packages

```bash
npm install node-telegram-bot-api axios --workspace=server
```

---

## Step 4 — Add Phase 2 env vars to .env

```
SITE_URL=https://yourdomain.com
VITE_SITE_URL=https://yourdomain.com
```

Telegram vars are optional — skip if not using.

---

## Step 5 — Generate the OG image

```bash
npm install canvas --workspace=server
node server/scripts/generate-og-image.js
```

Verify `client/public/og-image.png` exists.

---

## Step 6 — Update robots.txt

Open `client/public/robots.txt` and replace `REPLACE_WITH_SITE_URL` with your actual site URL.

---

## Step 7 — Restart the server

```bash
pm2 restart plains-report
```

---

## Step 8 — Start Telegram bot (if configured)

Open `ecosystem.config.js` and replace `/path/to/plains-report` on both `cwd` lines with the actual absolute path to your plains-report directory. Example: `/home/user/plains-report`.

```bash
pm2 start ecosystem.config.js --only plains-telegram
pm2 save
```

Send `/start` to your bot to verify it responds.

---

## Step 9 — Test meta injection locally

```bash
npm run build --workspace=client
NODE_ENV=production node server/index.js
```

Navigate to `/article/1` and view page source. Verify OG meta tags are present in the `<head>`.

---

## Verify all Phase 2 scope gates pass before signing off.

