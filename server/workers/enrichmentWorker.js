const cron = require('node-cron');
const db = require('../db/db');
const { enrichStory } = require('../services/claude');
const { invalidateCache } = require('../services/sitemap');

const MAX_BATCH = parseInt(process.env.MAX_ENRICHMENT_BATCH || '10');

// ── TELEGRAM ALERT ────────────────────────────────────────────────────────────
// Send directly via Telegram HTTP API — do NOT require('../telegram/bot').
// Requiring bot.js from the main server process would start a second polling
// instance that conflicts with the dedicated PM2 plains-telegram process.
async function sendTelegramAlert(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const adminId = process.env.TELEGRAM_ADMIN_USER_ID;
  if (!token || !adminId) return;
  try {
    const axios = require('axios');
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: parseInt(adminId),
      text: message,
      parse_mode: 'Markdown'
    });
  } catch (err) {
    console.error('Telegram alert failed:', err.message);
  }
}

function recoverStuckArticles() {
  const result = db.prepare(
    "UPDATE raw_articles SET status = 'pending' WHERE status = 'processing'"
  ).run();
  if (result.changes > 0) {
    console.log(`Recovered ${result.changes} stuck articles`);
  }
}

async function processQueue() {
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
      invalidateCache();

      // ── PHASE 2: TELEGRAM BREAKING NEWS ALERT ────────────────────────────
      if (result.impact_score >= 9) {
        sendTelegramAlert(
          `🚨 *BREAKING — ${result.impact_label}*\n\n` +
          `*${article.headline}*\n\n` +
          `_${result.earl_take}_\n\n` +
          `Impact: ${result.impact_score}/10`
        );
      }

    } catch (err) {
      console.error(`Enrichment failed for article ${article.id}: ${err.message}`);
      const newCount = article.retry_count + 1;
      if (newCount >= 3) {
        db.prepare("UPDATE raw_articles SET status = 'dead', retry_count = ? WHERE id = ?").run(newCount, article.id);
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
