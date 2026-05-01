const Parser = require('rss-parser');
const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'The Plains Report RSS Reader 1.0' },
  customFields: { item: ['media:content', 'content:encoded'] }
});

async function fetchFeed(url) {
  const feed = await parser.parseURL(url);
  return feed.items
    .filter(item => item.link)
    .map(item => ({
      headline: (item.title || '').trim(),
      description: (item.contentSnippet || item.summary || item.content || '').replace(/<[^>]+>/g, '').trim().slice(0, 1000),
      url: item.link,
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
    }))
    .filter(item => item.headline && item.url);
}

module.exports = { fetchFeed };
