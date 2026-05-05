const db = require('../db/db');

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
let cache = null;
let cacheTime = 0;

function escapeXml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function generateSitemap() {
  const now = Date.now();
  if (cache && now - cacheTime < CACHE_TTL) return cache;

  const SITE_URL = process.env.SITE_URL || '';
  const articles = db.prepare(
    'SELECT id, is_original, published_at FROM enriched_articles ORDER BY published_at DESC'
  ).all();

  const urls = articles.map(a => {
    const priority = (() => {
      const ageDays = (now - new Date(a.published_at).getTime()) / (1000 * 60 * 60 * 24);
      if (a.is_original) return '0.8';
      if (ageDays < 7) return '0.9';
      return '0.7';
    })();
    return `  <url>
    <loc>${escapeXml(SITE_URL)}/article/${a.id}</loc>
    <lastmod>${new Date(a.published_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('\n');

  cache = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  cacheTime = now;
  return cache;
}

function invalidateCache() {
  cache = null;
  cacheTime = 0;
}

module.exports = { generateSitemap, invalidateCache };
