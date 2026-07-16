import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS projection_meta (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  projection_instance_id TEXT NOT NULL,
  projection_version INTEGER NOT NULL CHECK (projection_version >= 0)
);

CREATE TABLE IF NOT EXISTS attempt_events (
  attempt_id TEXT PRIMARY KEY,
  payload_hash TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  question_id TEXT NOT NULL,
  accuracy REAL NOT NULL,
  duration_ms INTEGER NOT NULL,
  replay_count INTEGER NOT NULL,
  completed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS attempt_events_question_completed
ON attempt_events(question_id, completed_at DESC);

CREATE TABLE IF NOT EXISTS attempt_errors (
  attempt_id TEXT NOT NULL REFERENCES attempt_events(attempt_id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  expected TEXT NOT NULL,
  actual TEXT NOT NULL,
  error_type TEXT NOT NULL,
  PRIMARY KEY (attempt_id, ordinal)
);

CREATE INDEX IF NOT EXISTS attempt_errors_expected
ON attempt_errors(expected);

CREATE TABLE IF NOT EXISTS batch_receipts (
  batch_id TEXT PRIMARY KEY,
  request_hash TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pairing_codes (
  code_hash TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL,
  consumed_at TEXT
);

CREATE TABLE IF NOT EXISTS bearer_tokens (
  token_hash TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS memory_sync_state (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  target_version INTEGER NOT NULL CHECK (target_version >= 0),
  synced_version INTEGER NOT NULL CHECK (synced_version >= 0)
);
`;

export function openGatewayDatabase(path: string): Database.Database {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }

  const database = new Database(path);
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  if (path !== ":memory:") {
    database.pragma("journal_mode = WAL");
    database.pragma("synchronous = NORMAL");
  }
  database.exec(SCHEMA);
  database
    .prepare(
      `INSERT OR IGNORE INTO projection_meta(
        singleton, projection_instance_id, projection_version
      ) VALUES (1, ?, 0)`,
    )
    .run(randomUUID());
  database
    .prepare(
      `INSERT OR IGNORE INTO memory_sync_state(
        singleton, target_version, synced_version
      ) VALUES (1, 0, 0)`,
    )
    .run();
  return database;
}
