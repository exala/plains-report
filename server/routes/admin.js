const express = require('express');
const { getDbWrapper } = require('../db/db');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { pollFeeds } = require('../workers/rssPoller');
const { processQueue } = require('../workers/enrichmentWorker');
const { runOriginal } = require('../workers/tier5Worker');
const { detectTrends } = require('../workers/trendWorker');

const router = express.Router();
const VALID_TYPES = ['history', 'film_room', 'report_card', 'recruiting_board', 'earl_vs_internet'];

router.use(authMiddleware, adminMiddleware);

router.post('/poll', async (req, res) => {
  try {
    const db = await getDbWrapper();
    const sources = db.prepare('SELECT COUNT(*) as count FROM rss_sources WHERE active = 1').get();
    await pollFeeds();
    res.json({ triggered: true, sources_checked: sources.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/enrich', async (req, res) => {
  try {
    await processQueue();
    res.json({ triggered: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/trends', async (req, res) => {
  try {
    await detectTrends();
    res.json({ triggered: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/queue', async (req, res) => {
  const db = await getDbWrapper();
  const statuses = ['pending', 'processing', 'published', 'failed', 'dead'];
  const counts = {};
  for (const status of statuses) {
    counts[status] = db.prepare(
      'SELECT COUNT(*) as count FROM raw_articles WHERE status = ?'
    ).get(status).count;
  }
  res.json(counts);
});

router.post('/tier5/:type', async (req, res) => {
  const type = req.params.type;
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` });
  }
  try {
    await runOriginal(type);
    const db = await getDbWrapper();
    const article = db.prepare(
      'SELECT * FROM enriched_articles WHERE is_original = 1 ORDER BY published_at DESC LIMIT 1'
    ).get();
    if (!article) return res.status(500).json({ error: 'Article was not created' });
    res.json({
      ...article,
      metadata: (() => { try { return JSON.parse(article.metadata || '{}'); } catch { return {}; } })()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sources', async (req, res) => {
  const db = await getDbWrapper();
  const sources = db.prepare('SELECT * FROM rss_sources ORDER BY tier, id').all();
  res.json(sources);
});

router.patch('/sources/:id', async (req, res) => {
  const db = await getDbWrapper();
  const { active } = req.body;
  if (active !== 0 && active !== 1) {
    return res.status(400).json({ error: 'active must be 0 or 1' });
  }
  db.prepare('UPDATE rss_sources SET active = ? WHERE id = ?').run(active, req.params.id);
  const source = db.prepare('SELECT * FROM rss_sources WHERE id = ?').get(req.params.id);
  res.json(source);
});

module.exports = router;
