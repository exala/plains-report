const express = require('express');
const { getDbWrapper } = require('../db/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

function parseArticle(row) {
  if (!row) return null;
  return {
    ...row,
    metadata: (() => { try { return JSON.parse(row.metadata || '{}'); } catch { return {}; } })()
  };
}

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const db = await getDbWrapper();
  const articles = db.prepare(`
    SELECT ea.*, sa.saved_at
    FROM enriched_articles ea
    JOIN saved_articles sa ON ea.id = sa.article_id
    WHERE sa.user_id = ?
    ORDER BY sa.saved_at DESC
  `).all(req.user.id);
  res.json(articles.map(parseArticle));
});

router.post('/:id', async (req, res) => {
  const db = await getDbWrapper();
  const articleId = parseInt(req.params.id);
  const article = db.prepare('SELECT id FROM enriched_articles WHERE id = ?').get(articleId);
  if (!article) return res.status(404).json({ error: 'Article not found' });

  try {
    db.prepare(
      'INSERT OR IGNORE INTO saved_articles (user_id, article_id) VALUES (?, ?)'
    ).run(req.user.id, articleId);
    res.json({ saved: true, article_id: articleId });
  } catch {
    res.json({ saved: true, article_id: articleId });
  }
});

router.delete('/:id', async (req, res) => {
  const db = await getDbWrapper();
  const articleId = parseInt(req.params.id);
  db.prepare(
    'DELETE FROM saved_articles WHERE user_id = ? AND article_id = ?'
  ).run(req.user.id, articleId);
  res.json({ removed: true, article_id: articleId });
});

module.exports = router;
