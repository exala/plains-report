require('dotenv').config({
  path: require('path').join(__dirname, '../.env')
});


const required = ['ANTHROPIC_API_KEY', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('./db/db');
const { generateSitemap } = require('./services/sitemap');
const { startRssPoller } = require('./workers/rssPoller');
const { startEnrichmentWorker } = require('./workers/enrichmentWorker');
const { startTier5Worker } = require('./workers/tier5Worker');
const { startTrendWorker } = require('./workers/trendWorker');

const app = express();
const PORT = process.env.PORT || 3001;
const SITE_URL = process.env.SITE_URL || '';
const IS_PROD = process.env.NODE_ENV === 'production';

if (IS_PROD && !SITE_URL) {
  console.warn('WARNING: SITE_URL is not set. Open Graph meta tags will have broken URLs. Set SITE_URL in .env.');
}

app.use(express.json());

// ── PHASE 2: SEO META INJECTION ───────────────────────────────────────────────
// Must be registered BEFORE static file serving and API routes.
// Only runs in production — in development Vite serves the frontend.
// TO TEST LOCALLY: npm run build --workspace=client, then NODE_ENV=production node index.js
if (IS_PROD) {
  const distIndex = path.join(__dirname, '../client/dist/index.html');

  app.get('/article/:id', (req, res) => {
    const article = db.prepare('SELECT * FROM enriched_articles WHERE id = ?').get(req.params.id);

    if (!article) {
      // Serve index.html with default meta tags — React handles 404 rendering
      return res.sendFile(distIndex);
    }

    let html = fs.readFileSync(distIndex, 'utf8');
    const url = `${SITE_URL}/article/${article.id}`;
    const ogImage = `${SITE_URL}/og-image.png`;
    const brief = (article.earl_brief || '').replace(/"/g, '&quot;');
    const headline = (article.headline || '').replace(/"/g, '&quot;');
    const published = new Date(article.published_at).toISOString();

    const injection = `
    <title>${headline} | The Plains Report</title>
    <meta name="description" content="${brief}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:title" content="${headline}" />
    <meta property="og:description" content="${brief}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="og:site_name" content="The Plains Report" />
    <meta property="og:image" content="${ogImage}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${headline}" />
    <meta name="twitter:description" content="${brief}" />
    <meta name="twitter:image" content="${ogImage}" />
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"NewsArticle","headline":"${headline}","description":"${brief}","author":{"@type":"Person","name":"Easy Earl"},"publisher":{"@type":"Organization","name":"The Plains Report"},"datePublished":"${published}","url":"${url}"}</script>`;

    html = html.replace('</head>', `${injection}\n  </head>`);
    res.set('Content-Type', 'text/html');
    res.send(html);
  });

  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// ── PHASE 2: SITEMAP ─────────────────────────────────────────────────────────
app.get('/sitemap.xml', (req, res) => {
  res.set('Content-Type', 'application/xml');
  res.send(generateSitemap());
});

// ── API ROUTES ────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/feed', require('./routes/feed'));
app.use('/api/saved', require('./routes/saved'));
app.use('/api/admin', require('./routes/admin'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── CATCH-ALL: serve React app for all other routes in production ─────────────
if (IS_PROD) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// ── START WORKERS ─────────────────────────────────────────────────────────────
async function startServer() {
  await db.initDb();

  startEnrichmentWorker();
  startRssPoller();
  startTier5Worker();
  startTrendWorker();

// ── START TELEGRAM BOT (optional) ─────────────────────────────────────────────
  if (process.env.TELEGRAM_BOT_TOKEN) {
  // Bot runs as separate PM2 process — see ecosystem.config.js
  // Only log that it should be running
  console.log('Telegram bot configured — ensure plains-telegram PM2 process is running');
  }

  app.listen(PORT, () => {
    console.log(`The Plains Report server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('FATAL: Failed to start server:', err);
  process.exit(1);
});
