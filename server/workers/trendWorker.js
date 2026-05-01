const cron = require('node-cron');
const { getDbWrapper } = require('../db/db');
const { generateTrendTheme } = require('../services/claude');

async function detectTrends() {
  const db = await getDbWrapper();
  
  // Expire alerts older than 24 hours
  db.prepare(`
    UPDATE trend_alerts SET active = 0
    WHERE active = 1 AND created_at < datetime('now', '-24 hours')
  `).run();

  // Get articles from last 48 hours grouped by topic_tag
  const tagCounts = db.prepare(`
    SELECT topic_tag, COUNT(*) as count
    FROM enriched_articles
    WHERE published_at > datetime('now', '-48 hours')
    GROUP BY topic_tag
    HAVING count >= 3
  `).all();

  for (const row of tagCounts) {
    // Check if active alert already exists for this tag
    const existing = db.prepare(
      'SELECT id FROM trend_alerts WHERE topic_tag = ? AND active = 1'
    ).get(row.topic_tag);
    if (existing) continue;

    // Get the headlines that triggered the trend
    const articles = db.prepare(`
      SELECT id, headline FROM enriched_articles
      WHERE topic_tag = ? AND published_at > datetime('now', '-48 hours')
      ORDER BY published_at DESC
      LIMIT 10
    `).all(row.topic_tag);

    const headlines = articles.map(a => a.headline);
    const articleIds = articles.map(a => a.id);

    try {
      const theme = await generateTrendTheme(row.topic_tag, headlines);

      db.prepare(`
        INSERT INTO trend_alerts (topic_tag, theme, article_ids, active)
        VALUES (?, ?, ?, 1)
      `).run(row.topic_tag, theme, JSON.stringify(articleIds));

      // Mark contributing articles
      for (const id of articleIds) {
        db.prepare('UPDATE enriched_articles SET trend_signal = 1 WHERE id = ?').run(id);
      }

      console.log(`Trend alert created for ${row.topic_tag}: ${theme}`);
    } catch (err) {
      console.error(`Trend generation failed for ${row.topic_tag}: ${err.message}`);
    }
  }
}

function startTrendWorker() {
  cron.schedule('0 * * * *', detectTrends);
  console.log('Trend worker started (hourly)');
}

module.exports = { startTrendWorker, detectTrends };
