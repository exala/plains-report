# The Plains Report

Auburn football intelligence, delivered by Easy Earl, the most analytically dangerous fan alive. RSS feeds from across the SEC are ingested automatically, processed through Claude AI, and published in Earl's voice every day of the year.

---

## Prerequisites

- Node.js 18+
- npm 8+
- An Anthropic API key from console.anthropic.com

---

## Setup

**1. Clone and install**
```bash
git clone <repo-url>
cd plains-report
npm install
```

This installs dependencies for both the server and client workspaces.

**2. Configure environment**
```bash
cp .env.example .env
```

Open `.env` and fill in:

- `ANTHROPIC_API_KEY` - required, from console.anthropic.com
- `JWT_SECRET` - required, generate with `openssl rand -hex 32`

All other variables are optional with sensible defaults.

**3. Initialize database**
```bash
npm run db:init
```

Creates `db/plains.db`, applies the schema, and seeds all RSS sources. The app uses `sql.js`, which stores the SQLite-compatible database as a file, so the `sqlite3` command-line tool is not required.

**4. Run in development**
```bash
npm run dev
```

- Server: http://localhost:3001
- Client: http://localhost:5173
- Health check: http://localhost:3001/api/health

On Windows PowerShell, if `npm` is blocked by execution policy, run:

```powershell
npm.cmd run dev
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| ANTHROPIC_API_KEY | Yes | - | Anthropic API key for Claude |
| JWT_SECRET | Yes | - | Secret for signing JWT tokens |
| PORT | No | 3001 | Express server port |
| DB_PATH | No | ./db/plains.db | `sql.js` database file path |
| NODE_ENV | No | development | Controls error verbosity |
| POLL_INTERVAL_MINUTES | No | 30 | RSS poll frequency |
| MAX_ENRICHMENT_BATCH | No | 10 | Articles enriched per worker cycle |

---

## Database

The project uses `sql.js` instead of native `sqlite3` or `better-sqlite3`. Data is loaded from `db/plains.db` into memory and written back to that file after mutations.

Because of that, direct database edits should be made while the dev server is stopped. If the server is running, it may overwrite external changes the next time it saves the in-memory database.

---

## Admin Operations

Admin API routes require a valid JWT for a user whose `is_admin` value is `1`.

**Create an admin user**

1. Start the app and register an account through the client, or call `/api/auth/register`.
2. Stop the dev server.
3. Promote the registered user with `sql.js`:

```bash
node -e "const initSqlJs=require('sql.js');const fs=require('fs');const dbPath=process.env.DB_PATH||'./db/plains.db';(async()=>{const SQL=await initSqlJs();const db=new SQL.Database(fs.readFileSync(dbPath));db.run('UPDATE users SET is_admin = 1 WHERE email = ?', ['your@email.com']);fs.writeFileSync(dbPath, Buffer.from(db.export()));db.close();console.log('Admin user updated');})().catch(err=>{console.error(err);process.exit(1);});"
```

4. Restart the dev server and log in again to receive a token with admin privileges.

**Manually trigger an RSS poll**
```bash
curl -X POST http://localhost:3001/api/admin/poll \
  -H "Authorization: Bearer <your-token>"
```

**Manually process the enrichment queue**
```bash
curl -X POST http://localhost:3001/api/admin/enrich \
  -H "Authorization: Bearer <your-token>"
```

**Run trend detection**
```bash
curl -X POST http://localhost:3001/api/admin/trends \
  -H "Authorization: Bearer <your-token>"
```

**Manually trigger a Tier 5 Earl Original**
```bash
# Types: history, film_room, report_card, recruiting_board, earl_vs_internet
curl -X POST http://localhost:3001/api/admin/tier5/history \
  -H "Authorization: Bearer <your-token>"
```

**Check enrichment queue status**
```bash
curl http://localhost:3001/api/admin/queue \
  -H "Authorization: Bearer <your-token>"
```

**List RSS sources**
```bash
curl http://localhost:3001/api/admin/sources \
  -H "Authorization: Bearer <your-token>"
```

**Enable or disable an RSS source**
```bash
curl -X PATCH http://localhost:3001/api/admin/sources/1 \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d "{\"active\":0}"
```

Use `{"active":1}` to enable the source again.

---

## Tech Stack

Node.js, Express, sql.js, bcrypt, jsonwebtoken, node-cron, rss-parser, @anthropic-ai/sdk, React, React Router, Axios, Vite, concurrently

---

## How It Works

1. RSS feeds are polled every 30 minutes across Auburn football, transfer portal, NIL, and SEC sources.
2. New articles are queued and enriched by Claude every 5 minutes: Earl's brief, take, impact score, and topic tag.
3. Five Tier 5 Earl Originals publish automatically on schedule: Auburn History, Film Room, SEC Report Card, Recruiting Board, and Earl vs. The Internet.
4. Trend detection runs hourly. When 3 or more articles share a topic tag in 48 hours, Earl writes a trend alert.
5. Everything surfaces in the feed, organized by topic and sortable by impact.
