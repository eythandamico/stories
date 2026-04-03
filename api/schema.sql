-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  photo_url TEXT,
  hearts INTEGER DEFAULT 5,
  perks_freeze INTEGER DEFAULT 2,
  perks_hint INTEGER DEFAULT 2,
  perks_rewind INTEGER DEFAULT 1,
  streak_current INTEGER DEFAULT 0,
  streak_best INTEGER DEFAULT 0,
  streak_last_play TEXT,
  last_heart_loss TEXT,
  push_token TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Stories
CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT,
  cover_url TEXT,
  preview_url TEXT,
  poster_url TEXT,
  trending INTEGER DEFAULT 0,
  available INTEGER DEFAULT 0,
  price REAL DEFAULT 0,
  series_price REAL DEFAULT 0,
  total_endings INTEGER DEFAULT 0,
  start_node_id TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Story nodes (scenes)
CREATE TABLE IF NOT EXISTS nodes (
  id TEXT NOT NULL,
  story_id TEXT NOT NULL,
  title TEXT,
  description TEXT,
  video_url TEXT,
  poster_url TEXT,
  is_ending INTEGER DEFAULT 0,
  ending_title TEXT,
  ending_description TEXT,
  timed INTEGER DEFAULT 0,
  timer_seconds INTEGER DEFAULT 10,
  PRIMARY KEY (story_id, id),
  FOREIGN KEY (story_id) REFERENCES stories(id)
);

-- Node choices
CREATE TABLE IF NOT EXISTS choices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  label TEXT NOT NULL,
  next_node_id TEXT NOT NULL,
  positive INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  choice_type TEXT DEFAULT 'button',
  prompt TEXT,
  FOREIGN KEY (story_id) REFERENCES stories(id)
);

-- User endings discovered
CREATE TABLE IF NOT EXISTS user_endings (
  user_id TEXT NOT NULL,
  story_id TEXT NOT NULL,
  ending_id TEXT NOT NULL,
  ending_title TEXT,
  found_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, story_id, ending_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User purchases
CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  item_id TEXT,
  amount REAL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Choice stats (community percentages)
CREATE TABLE IF NOT EXISTS choice_stats (
  story_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  choice_index INTEGER NOT NULL,
  count INTEGER DEFAULT 0,
  PRIMARY KEY (story_id, node_id, choice_index)
);

-- Feed order
CREATE TABLE IF NOT EXISTS feed (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (story_id) REFERENCES stories(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nodes_story ON nodes(story_id);
CREATE INDEX IF NOT EXISTS idx_choices_story_node ON choices(story_id, node_id);
CREATE INDEX IF NOT EXISTS idx_stats_story_node ON choice_stats(story_id, node_id);
CREATE INDEX IF NOT EXISTS idx_endings_user ON user_endings(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_story ON feed(story_id);
