ALTER TABLE registrations ADD COLUMN checked_in_at TEXT;

CREATE INDEX IF NOT EXISTS idx_registrations_checked_in_at
  ON registrations (checked_in_at);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  project_number INTEGER NOT NULL UNIQUE,
  team_key TEXT NOT NULL UNIQUE,
  project_name TEXT NOT NULL,
  team_name TEXT NOT NULL,
  team_members_json TEXT NOT NULL,
  one_liner TEXT NOT NULL,
  target_users TEXT NOT NULL,
  application_scenarios TEXT NOT NULL,
  core_features TEXT NOT NULL,
  demo_url TEXT NOT NULL,
  demo_instructions TEXT NOT NULL,
  demo_video_url TEXT NOT NULL,
  pitch_source_url TEXT NOT NULL,
  pitch_pdf_url TEXT NOT NULL,
  poster_url TEXT NOT NULL,
  poster_print_confirmed INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'submitted',
  is_public INTEGER NOT NULL DEFAULT 1,
  voting_enabled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_public_updated
  ON projects (is_public, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_voting_enabled
  ON projects (voting_enabled, project_number);

CREATE TABLE IF NOT EXISTS voting_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  is_open INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT,
  ends_at TEXT,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO voting_config (id, is_open, starts_at, ends_at, updated_at)
VALUES (1, 0, NULL, NULL, CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  audience_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'valid',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (audience_id) REFERENCES registrations(id) ON DELETE RESTRICT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
  UNIQUE (audience_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_project_status
  ON votes (project_id, status);

CREATE TABLE IF NOT EXISTS vote_audit_log (
  id TEXT PRIMARY KEY,
  vote_id TEXT NOT NULL,
  action TEXT NOT NULL,
  note TEXT,
  actor_email TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (vote_id) REFERENCES votes(id) ON DELETE RESTRICT
);
