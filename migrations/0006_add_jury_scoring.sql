CREATE TABLE IF NOT EXISTS jury_scores (
  id TEXT PRIMARY KEY,
  judge_name TEXT NOT NULL,
  team_key TEXT NOT NULL,
  human_impact REAL NOT NULL,
  innovation REAL NOT NULL,
  technical_execution REAL NOT NULL,
  product_experience REAL NOT NULL,
  productization REAL NOT NULL,
  storytelling REAL NOT NULL,
  total REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (judge_name, team_key)
);

CREATE INDEX IF NOT EXISTS idx_jury_scores_team_key
  ON jury_scores (team_key);

CREATE INDEX IF NOT EXISTS idx_jury_scores_judge_name
  ON jury_scores (judge_name);
