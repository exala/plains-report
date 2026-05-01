const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { initDb } = require('./db/db');

// Validate required env vars before anything else
const required = ['ANTHROPIC_API_KEY', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key] || process.env[key] === 'your_key_here') {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    console.error('Copy .env.example to .env and fill in the required values.');
    process.exit(1);
  }
}

const express = require('express');
const { startRssPoller } = require('./workers/rssPoller');
const { startEnrichmentWorker } = require('./workers/enrichmentWorker');
const { startTier5Worker } = require('./workers/tier5Worker');
const { startTrendWorker } = require('./workers/trendWorker');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/feed', require('./routes/feed'));
app.use('/api/saved', require('./routes/saved'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Initialize database and start server
async function start() {
  try {
    await initDb();
    console.log('Database initialized');
    
    // Start workers
    startEnrichmentWorker(); // Also runs stuck-article recovery on startup
    startRssPoller();
    startTier5Worker();
    startTrendWorker();

    app.listen(PORT, () => {
      console.log(`The Plains Report server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
