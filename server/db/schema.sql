CREATE TABLE IF NOT EXISTS rss_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  tier INTEGER NOT NULL,
  category TEXT NOT NULL,
  active INTEGER DEFAULT 1,
  last_polled DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raw_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL,
  url_hash TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  headline TEXT NOT NULL,
  description TEXT,
  source_name TEXT,
  published_at DATETIME,
  fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  FOREIGN KEY (source_id) REFERENCES rss_sources(id)
);

CREATE TABLE IF NOT EXISTS enriched_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  raw_article_id INTEGER,
  headline TEXT NOT NULL,
  earl_brief TEXT NOT NULL,
  earl_take TEXT NOT NULL,
  impact_score INTEGER NOT NULL,
  impact_label TEXT NOT NULL,
  topic_tag TEXT NOT NULL,
  source_name TEXT,
  source_url TEXT,
  is_original INTEGER DEFAULT 0,
  original_type TEXT,
  metadata TEXT DEFAULT '{}',
  raw_description TEXT,
  trend_signal INTEGER DEFAULT 0,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (raw_article_id) REFERENCES raw_articles(id)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_admin INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  article_id INTEGER NOT NULL,
  saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, article_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (article_id) REFERENCES enriched_articles(id)
);

CREATE TABLE IF NOT EXISTS trend_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_tag TEXT NOT NULL,
  theme TEXT NOT NULL,
  article_ids TEXT NOT NULL,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
