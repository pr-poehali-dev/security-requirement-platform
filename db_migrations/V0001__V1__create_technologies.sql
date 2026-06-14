CREATE TABLE IF NOT EXISTS technologies (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL DEFAULT '',
  version     INTEGER NOT NULL DEFAULT 1,
  owner       TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'active',
  description TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS tech_id_seq START 1;

CREATE TABLE IF NOT EXISTS tech_tags (
  id            SERIAL PRIMARY KEY,
  technology_id TEXT NOT NULL REFERENCES technologies(id),
  tag           TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tech_tags_tech_id ON tech_tags(technology_id);

CREATE TABLE IF NOT EXISTS tech_files (
  id            SERIAL PRIMARY KEY,
  technology_id TEXT NOT NULL REFERENCES technologies(id),
  filename      TEXT NOT NULL,
  s3_key        TEXT NOT NULL,
  content_type  TEXT NOT NULL DEFAULT 'application/octet-stream',
  size_bytes    BIGINT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tech_files_tech_id ON tech_files(technology_id);

CREATE TABLE IF NOT EXISTS tech_mermaid (
  id            SERIAL PRIMARY KEY,
  technology_id TEXT NOT NULL REFERENCES technologies(id),
  title         TEXT NOT NULL DEFAULT 'Схема',
  content       TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tech_mermaid_tech_id ON tech_mermaid(technology_id);