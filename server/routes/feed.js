const express = require('express');
const db = require('../db/db');

const router = express.Router();

const ALL_TAGS = ['RECRUITING','TRANSFERS','NIL','DEPTH CHART','GAME DAY','COACHING','RANKINGS','SEC','HISTORY','MAILBAG'];

function parseArticle(row) {
  if (!row) return null;
  return {
    ...row,
    metadata: (() => { try { return JSON.parse(row.metadata || '{}'); } catch { return {}; } })()
  };
}

// IMPORTANT: /digest, /trend, /search, /pulse, /tag-counts all BEFORE /:id
router.get('/digest', (req, res) => {
  const reportCard = db.prepare(`
    SELECT * FROM enriched_articles
    WHERE original_type = 'REPORT_CARD'
    ORDER BY published_at DESC LIMIT 1
  `).get();
  if (reportCard) return res.json(parseArticle(reportCard));
  const fallback = db.prepare(`
    SELECT * FROM enriched_articles
    WHERE published_at > datetime('now', '-7 days')
    ORDER BY impact_score DESC, published_at DESC LIMIT 5
  `).all();
  res.json({ type: 'fallback', articles: fallback.map(parseArticle) });
});

router.get('/trend', (req, res) => {
  const alert = db.prepare(
    'SELECT * FROM trend_alerts WHERE active = 1 ORDER BY created_at DESC LIMIT 1'
  ).get();
  res.json(alert || null);
});

// ── PHASE 2: SEARCH ───────────────────────────────────────────────────────────
router.get('/search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 3) return res.json({ articles: [], query: q, total: 0 });
  const like = `%${q}%`;
  const articles = db.prepare(`
    SELECT * FROM enriched_articles
    WHERE headline LIKE ? OR earl_brief LIKE ? OR earl_take LIKE ?
    ORDER BY published_at DESC LIMIT 50
  `).all(like, like, like);
  res.json({ articles: articles.map(parseArticle), query: q, total: articles.length });
});

// ── PHASE 2: PULSE (EARL CONFIDENCE METER) ───────────────────────────────────
router.get('/pulse', (req, res) => {
  const thisWeek = db.prepare(`
    SELECT AVG(impact_score) as avg, COUNT(*) as count
    FROM enriched_articles
    WHERE published_at > datetime('now', '-7 days')
  `).get();
  const lastWeek = db.prepare(`
    SELECT AVG(impact_score) as avg, COUNT(*) as count
    FROM enriched_articles
    WHERE published_at BETWEEN datetime('now', '-14 days') AND datetime('now', '-7 days')
  `).get();

  const thisAvg = thisWeek.avg || 0;
  const lastAvg = lastWeek.avg || 0;
  const delta = parseFloat((thisAvg - lastAvg).toFixed(2));

  // Evaluate mood in strict order per spec
  let earl_mood;
  if (Math.abs(delta) < 0.3 && thisAvg < 5.5) {
    earl_mood = 'WATCHFUL';
  } else if (delta > 1.5) {
    earl_mood = 'UNHINGED';
  } else if (delta >= 0) {
    earl_mood = 'CAUTIOUSLY OPTIMISTIC';
  } else {
    earl_mood = 'CONCERNED';
  }

  res.json({
    this_week_avg: parseFloat(thisAvg.toFixed(2)),
    last_week_avg: parseFloat(lastAvg.toFixed(2)),
    delta,
    earl_mood,
    this_week_count: thisWeek.count,
    last_week_count: lastWeek.count
  });
});

// ── PHASE 2: TAG COUNTS ───────────────────────────────────────────────────────
router.get('/tag-counts', (req, res) => {
  const rows = db.prepare(`
    SELECT topic_tag, COUNT(*) as count
    FROM enriched_articles
    WHERE published_at > datetime('now', '-7 days')
    GROUP BY topic_tag
  `).all();

  // Zero-fill against hardcoded tag list — SQL only returns active tags
  const counts = {};
  ALL_TAGS.forEach(tag => { counts[tag] = 0; });
  rows.forEach(row => { counts[row.topic_tag] = row.count; });
  res.json(counts);
});

// ── EXISTING: FEED LIST ───────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const tag = req.query.tag;
  const sort = req.query.sort === 'impact' ? 'impact_score DESC, published_at DESC' : 'published_at DESC';

  let where = '';
  let params = [];
  if (tag && tag !== 'ALL') {
    where = 'WHERE topic_tag = ?';
    params.push(tag);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM enriched_articles ${where}`).get(...params).count;
  const articles = db.prepare(`
    SELECT * FROM enriched_articles ${where}
    ORDER BY ${sort}
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({ articles: articles.map(parseArticle), total, page, pages: Math.ceil(total / limit) });
});

// ── EXISTING: SINGLE ARTICLE — MUST BE LAST ───────────────────────────────────
router.get('/:id', (req, res) => {
  const article = db.prepare('SELECT * FROM enriched_articles WHERE id = ?').get(req.params.id);
  if (!article) return res.status(404).json({ error: 'Article not found' });
  res.json(parseArticle(article));
});

module.exports = router;
