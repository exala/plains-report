# The Plains Report

Auburn football intelligence, delivered by Easy Earl — the most analytically dangerous fan alive. RSS feeds from across the SEC are ingested automatically, processed through Claude AI, and published in Earl's voice every day of the year.

---

## Prerequisites

- Node.js 18+
- npm 8+
- An Anthropic API key (console.anthropic.com)

---

## Setup

**1. Clone and install**
```bash
git clone <repo-url>
cd plains-report
npm install
```
This installs dependencies for both server and client workspaces.

**2. Configure environment**
```bash
cp .env.example .env
```
Open `.env` and fill in:
- `ANTHROPIC_API_KEY` — required, from console.anthropic.com
- `JWT_SECRET` — required, generate with `openssl rand -hex 32`

All other variables are optional with sensible defaults.

**3. Initialize database**
```bash
npm run db:init
```
Creates `db/plains.db`, applies the schema, and seeds all RSS sources.

**4. Run in development**
```bash
npm run dev
```
- Server: http://localhost:3001
- Client: http://localhost:5173

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| ANTHROPIC_API_KEY | Yes | — | Anthropic API key for Claude |
| JWT_SECRET | Yes | — | Secret for signing JWT tokens |
| PORT | No | 3001 | Express server port |
| DB_PATH | No | ./db/plains.db | SQLite database path |
| NODE_ENV | No | development | Controls error verbosity |
| POLL_INTERVAL_MINUTES | No | 30 | RSS poll frequency |
| MAX_ENRICHMENT_BATCH | No | 10 | Articles enriched per worker cycle |

---

## Admin Operations

**Create an admin user** (after registering an account at /register):
```bash
sqlite3 db/plains.db "UPDATE users SET is_admin = 1 WHERE email = 'your@email.com';"
```

**Manually trigger an RSS poll:**
```bash
curl -X POST http://localhost:3001/api/admin/poll \
  -H 'Authorization: Bearer <your-token>'
```

**Manually trigger a Tier 5 Earl Original:**
```bash
# Types: history, film_room, report_card, recruiting_board, earl_vs_internet
curl -X POST http://localhost:3001/api/admin/tier5/history \
  -H 'Authorization: Bearer <your-token>'
```

**Check enrichment queue status:**
```bash
curl http://localhost:3001/api/admin/queue \
  -H 'Authorization: Bearer <your-token>'
```

---

## Tech Stack

Node.js, Express, better-sqlite3, bcrypt, jsonwebtoken, node-cron, rss-parser, @anthropic-ai/sdk, React, React Router, Axios, Vite, concurrently

---

## How It Works

1. RSS feeds are polled every 30 minutes across 18 sources (Auburn football, transfer portal, NIL, SEC)
2. New articles are queued and enriched by Claude every 5 minutes — Earl's brief, take, impact score, and topic tag
3. Five Tier 5 Earl Originals publish automatically on schedule (Auburn History daily, Film Room 3x/week, SEC Report Card, Recruiting Board, Earl vs. The Internet)
4. Trend detection runs hourly — when 3+ articles share a topic tag in 48 hours, Earl writes a trend alert
5. Everything surfaces in the feed, organized by topic, sortable by impact
