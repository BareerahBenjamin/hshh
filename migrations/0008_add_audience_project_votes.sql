CREATE TABLE IF NOT EXISTS audience_project_votes (
  id TEXT PRIMARY KEY,
  audience_id TEXT NOT NULL,
  candidate_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'valid',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (audience_id) REFERENCES registrations(id) ON DELETE RESTRICT,
  UNIQUE (audience_id)
);

CREATE INDEX IF NOT EXISTS idx_audience_project_votes_candidate_status
  ON audience_project_votes (candidate_key, status);

INSERT OR IGNORE INTO audience_project_votes (id, audience_id, candidate_key, status, created_at, updated_at)
SELECT v.id, v.audience_id, COALESCE(p.team_key, v.project_id), v.status, v.created_at, v.updated_at
FROM votes v
LEFT JOIN projects p ON p.id = v.project_id;
