const express = require('express');
const db = require('../db/db');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { pollFeeds } = require('../workers/rssPoller');
const { processQueue } = require('../workers/enrichmentWorker');
const { runOriginal } = require('../workers/tier5Worker');
const { detectTrends } = require('../workers/trendWorker');
const { generateMailbag } = require('../services/claude');
const { invalidateCache } = require('../services/sitemap');

const router = express.Router();
const VALID_TYPES = ['history', 'film_room', 'report_card', 'recruiting_board', 'earl_vs_internet'];

router.use(authMiddleware, adminMiddleware);

function parseArticle(row) {
  if (!row) return null;
  return { ...row, metadata: (() => { try { return JSON.parse(row.metadata || '{}'); } catch { return {}; } })() };
}

router.post('/poll', async (req, res) => {
  try {
    const sources = db.prepare('SELECT COUNT(*) as count FROM rss_sources WHERE active = 1').get();
    await pollFeeds();
    res.json({ triggered: true, sources_checked: sources.count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/enrich', async (req, res) => {
  try {
    await processQueue();
    res.json({ triggered: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/trends', async (req, res) => {
  try {
    await detectTrends();
    res.json({ triggered: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/queue', (req, res) => {
  const statuses = ['pending', 'processing', 'published', 'failed', 'dead'];
  const counts = {};
  for (const s of statuses) {
    counts[s] = db.prepare('SELECT COUNT(*) as count FROM raw_articles WHERE status = ?').get(s).count;
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
    const article = db.prepare(
      'SELECT * FROM enriched_articles WHERE is_original = 1 ORDER BY published_at DESC LIMIT 1'
    ).get();
    if (!article) return res.status(500).json({ error: 'Article was not created' });
    invalidateCache();
    res.json(parseArticle(article));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PHASE 2: MAILBAG ─────────────────────────────────────────────────────────
router.post('/mailbag', async (req, res) => {
  const { question } = req.body;
  if (!question || question.trim().length < 3) {
    return res.status(400).json({ error: 'question must be at least 3 characters' });
  }
  try {
    const result = await generateMailbag(question.trim());
    const metadata = result.metadata || {};
    const headline = metadata.headline || `Earl's Mailbag`;

    db.prepare(`
      INSERT INTO enriched_articles
        (raw_article_id, headline, earl_brief, earl_take, impact_score, impact_label,
         topic_tag, source_name, source_url, is_original, original_type, metadata)
      VALUES (NULL, ?, ?, ?, ?, ?, ?, 'Easy Earl', NULL, 1, 'MAILBAG', ?)
    `).run(
      headline,
      result.earl_brief,
      result.earl_take,
      result.impact_score,
      result.impact_label,
      result.topic_tag,
      JSON.stringify(metadata)
    );

    const article = db.prepare(
      "SELECT * FROM enriched_articles WHERE original_type = 'MAILBAG' ORDER BY published_at DESC LIMIT 1"
    ).get();
    invalidateCache();
    res.json(parseArticle(article));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/sources', (req, res) => {
  res.json(db.prepare('SELECT * FROM rss_sources ORDER BY tier, id').all());
});

router.patch('/sources/:id', (req, res) => {
  const { active } = req.body;
  if (active !== 0 && active !== 1) return res.status(400).json({ error: 'active must be 0 or 1' });
  db.prepare('UPDATE rss_sources SET active = ? WHERE id = ?').run(active, req.params.id);
  res.json(db.prepare('SELECT * FROM rss_sources WHERE id = ?').get(req.params.id));
});

module.exports = router;
