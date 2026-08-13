CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'audience',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  wechat TEXT NOT NULL,
  city TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_email_phone
  ON registrations (email, phone);

CREATE INDEX IF NOT EXISTS idx_registrations_created_at
  ON registrations (created_at);

CREATE INDEX IF NOT EXISTS idx_registrations_email
  ON registrations (email);

CREATE INDEX IF NOT EXISTS idx_registrations_phone
  ON registrations (phone);

CREATE INDEX IF NOT EXISTS idx_registrations_wechat
  ON registrations (wechat);
