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
    .map(item => {
      const rawDate = item.pubDate || item.isoDate || null;
      const publishedDate = rawDate ? new Date(rawDate) : null;

      return {
        headline: (item.title || '').trim(),
        title: item.title,
        description: (item.contentSnippet || item.summary || item.content || '').replace(/<[^>]+>/g, '').trim().slice(0, 1000),
        url: item.link,
        pubDate: item.pubDate || null,
        isoDate: item.isoDate || null,
        publishedAt: publishedDate && !isNaN(publishedDate.getTime()) ? publishedDate.toISOString() : null
      };
    })
    .filter(item => item.headline && item.url);
}

module.exports = { fetchFeed };
