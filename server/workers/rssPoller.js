const cron = require('node-cron');
const { getDbWrapper } = require('../db/db');
const { fetchFeed } = require('../services/rssParser');
const { hashUrl } = require('../services/hash');

async function pollFeeds() {
  const db = await getDbWrapper();
  const sources = db.prepare('SELECT * FROM rss_sources WHERE active = 1').all();
  let inserted = 0;

  for (const source of sources) {
    try {
      const items = await fetchFeed(source.url);
      for (const item of items) {
        const hash = hashUrl(item.url);

        // DATE FILTER - skip articles older than 72 hours.
        const rawDate = item.pubDate || item.isoDate || null;
        if (!rawDate) {
          console.log(`Skipping article with no date: ${item.title || item.headline}`);
          continue;
        }
        const pubDate = new Date(rawDate);
        if (isNaN(pubDate.getTime())) {
          console.log(`Skipping article with unparseable date: ${item.title || item.headline}`);
          continue;
        }
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - 72);
        if (pubDate < cutoff) {
          console.log(`Skipping old article (${pubDate.toDateString()}): ${item.title || item.headline}`);
          continue;
        }

        // DUPLICATE CHECK - skip articles already in database.
        const existing = db.prepare('SELECT id FROM raw_articles WHERE url_hash = ?').get(hash);
        if (existing) continue;

        db.prepare(`
          INSERT INTO raw_articles (source_id, url_hash, url, headline, description, source_name, published_at, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        `).run(source.id, hash, item.url, item.headline, item.description, source.name, item.publishedAt);
        inserted++;
      }
      db.prepare('UPDATE rss_sources SET last_polled = CURRENT_TIMESTAMP WHERE id = ?').run(source.id);
    } catch (err) {
      console.error(`RSS poll failed for ${source.name}: ${err.message}`);
    }
  }

  if (inserted > 0) console.log(`RSS poll: inserted ${inserted} new articles`);
  return inserted;
}

function startRssPoller() {
  const interval = process.env.POLL_INTERVAL_MINUTES || '30';
  const cronExpression = `*/${interval} * * * *`;
  console.log(`RSS poller starting with cron: ${cronExpression}`);
  cron.schedule(cronExpression, pollFeeds);
}

module.exports = { startRssPoller, pollFeeds };
