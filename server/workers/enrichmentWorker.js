const cron = require('node-cron');
const { getDbWrapper } = require('../db/db');
const { enrichStory } = require('../services/claude');

const MAX_BATCH = parseInt(process.env.MAX_ENRICHMENT_BATCH || '10');

async function recoverStuckArticles() {
  const db = await getDbWrapper();
  const result = db.prepare(
    "UPDATE raw_articles SET status = 'pending' WHERE status = 'processing'"
  ).run();
  if (result.changes > 0) {
    console.log(`Recovered ${result.changes} stuck articles from processing state`);
  }
}

async function processQueue() {
  const db = await getDbWrapper();
  const articles = db.prepare(`
    SELECT * FROM raw_articles
    WHERE status = 'pending'
    ORDER BY published_at DESC
    LIMIT ?
  `).all(MAX_BATCH);

  if (articles.length === 0) return;

  for (const article of articles) {
    db.prepare("UPDATE raw_articles SET status = 'processing' WHERE id = ?").run(article.id);

    try {
      const result = await enrichStory(article.headline, article.description, article.source_name);

      db.prepare(`
        INSERT INTO enriched_articles
          (raw_article_id, headline, earl_brief, earl_take, impact_score, impact_label,
           topic_tag, source_name, source_url, raw_description, is_original, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        article.id,
        article.headline,
        result.earl_brief,
        result.earl_take,
        result.impact_score,
        result.impact_label,
        result.topic_tag,
        article.source_name,
        article.url,
        article.description || null,
        JSON.stringify(result.metadata || {})
      );

      db.prepare("UPDATE raw_articles SET status = 'published' WHERE id = ?").run(article.id);
    } catch (err) {
      console.error(`Enrichment failed for article ${article.id}: ${err.message}`);
      const newCount = article.retry_count + 1;
      if (newCount >= 3) {
        db.prepare("UPDATE raw_articles SET status = 'dead', retry_count = ? WHERE id = ?").run(newCount, article.id);
        console.log(`Article ${article.id} marked dead after 3 failures`);
      } else {
        db.prepare("UPDATE raw_articles SET status = 'pending', retry_count = ? WHERE id = ?").run(newCount, article.id);
      }
    }
  }
}

function startEnrichmentWorker() {
  recoverStuckArticles();
  cron.schedule('*/5 * * * *', processQueue);
  console.log('Enrichment worker started (every 5 min)');
}

module.exports = { startEnrichmentWorker, processQueue, recoverStuckArticles };
