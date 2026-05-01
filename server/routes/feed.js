const express = require('express');
const { getDbWrapper } = require('../db/db');

const router = express.Router();

function parseArticle(row) {
  if (!row) return null;
  return {
    ...row,
    metadata: (() => { try { return JSON.parse(row.metadata || '{}'); } catch { return {}; } })()
  };
}

// IMPORTANT: /digest and /trend are registered BEFORE /:id
router.get('/digest', async (req, res) => {
  const db = await getDbWrapper();
  const reportCard = db.prepare(`
    SELECT * FROM enriched_articles
    WHERE original_type = 'REPORT_CARD'
    ORDER BY published_at DESC
    LIMIT 1
  `).get();

  if (reportCard) {
    return res.json(parseArticle(reportCard));
  }

  // Fallback: top 5 highest-impact articles from last 7 days
  const fallback = db.prepare(`
    SELECT * FROM enriched_articles
    WHERE published_at > datetime('now', '-7 days')
    ORDER BY impact_score DESC, published_at DESC
    LIMIT 5
  `).all();

  res.json({ type: 'fallback', articles: fallback.map(parseArticle) });
});

router.get('/trend', async (req, res) => {
  const db = await getDbWrapper();
  const alert = db.prepare(
    'SELECT * FROM trend_alerts WHERE active = 1 ORDER BY created_at DESC LIMIT 1'
  ).get();
  res.json(alert || null);
});

router.get('/', async (req, res) => {
  const db = await getDbWrapper();
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

  res.json({
    articles: articles.map(parseArticle),
    total,
    page,
    pages: Math.ceil(total / limit)
  });
});

router.get('/:id', async (req, res) => {
  const db = await getDbWrapper();
  const article = db.prepare('SELECT * FROM enriched_articles WHERE id = ?').get(req.params.id);
  if (!article) return res.status(404).json({ error: 'Article not found' });
  res.json(parseArticle(article));
});

module.exports = router;
