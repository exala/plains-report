const cron = require('node-cron');
const { getDbWrapper } = require('../db/db');
const { generateOriginal, ORIGINAL_TYPE_MAP } = require('../services/claude');

function getDateString() {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

async function runOriginal(type) {
  const date = getDateString();
  console.log(`Generating Tier 5 original: ${type}`);

  try {
    const result = await generateOriginal(type, date);
    const originalType = ORIGINAL_TYPE_MAP[type];
    const metadata = result.metadata || {};
    const headline = metadata.headline || `${type} — ${date}`;

    const db = await getDbWrapper();
    db.prepare(`
      INSERT INTO enriched_articles
        (raw_article_id, headline, earl_brief, earl_take, impact_score, impact_label,
         topic_tag, source_name, source_url, is_original, original_type, metadata)
      VALUES (NULL, ?, ?, ?, ?, ?, ?, 'Easy Earl', NULL, 1, ?, ?)
    `).run(
      headline,
      result.earl_brief,
      result.earl_take,
      result.impact_score,
      result.impact_label,
      result.topic_tag,
      originalType,
      JSON.stringify(metadata)
    );

    console.log(`Tier 5 original published: ${headline}`);
  } catch (err) {
    console.error(`Tier 5 generation failed for ${type}: ${err.message}`);
  }
}

function startTier5Worker() {
  // Auburn History — daily at 7am CT
  cron.schedule('0 7 * * *', () => runOriginal('history'), { timezone: 'America/Chicago' });

  // Film Room — Mon/Wed/Fri at 9am CT
  cron.schedule('0 9 * * 1,3,5', () => runOriginal('film_room'), { timezone: 'America/Chicago' });

  // SEC Report Card — Monday at 8am CT
  cron.schedule('0 8 * * 1', () => runOriginal('report_card'), { timezone: 'America/Chicago' });

  // Recruiting Board — Wednesday at 8am CT
  cron.schedule('0 8 * * 3', () => runOriginal('recruiting_board'), { timezone: 'America/Chicago' });

  // Earl vs The Internet — Friday at 8am CT
  cron.schedule('0 8 * * 5', () => runOriginal('earl_vs_internet'), { timezone: 'America/Chicago' });

  console.log('Tier 5 worker started (5 scheduled formats)');
}

module.exports = { startTier5Worker, runOriginal };
