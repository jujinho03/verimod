import { DatabaseSync } from 'node:sqlite'

export const TABLES = [
  'appeals',
  'content_store',
  'epoch_members',
  'epochs',
  'idempotency_records',
  'receipts',
  'reviews',
] as const

const MIGRATION_001 = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS receipts (
  receipt_id TEXT PRIMARY KEY,
  issuer_seq INTEGER NOT NULL UNIQUE CHECK (issuer_seq >= 1),
  canonical_body TEXT NOT NULL,
  receipt_hash TEXT NOT NULL UNIQUE,
  event_kind TEXT NOT NULL CHECK (event_kind IN ('DECISION', 'APPEAL', 'REVIEW')),
  subject_receipt_hash TEXT,
  previous_receipt_hash TEXT,
  owner_principal TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS content_store (
  receipt_id TEXT PRIMARY KEY REFERENCES receipts(receipt_id),
  original_text TEXT NOT NULL,
  content_salt TEXT NOT NULL CHECK (length(content_salt) = 64),
  content_commitment TEXT NOT NULL UNIQUE,
  owner_principal TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS epochs (
  epoch_id TEXT PRIMARY KEY,
  merkle_root TEXT NOT NULL,
  receipt_count INTEGER NOT NULL CHECK (receipt_count > 0),
  protocol_version INTEGER NOT NULL DEFAULT 1 CHECK (protocol_version >= 1 AND protocol_version <= 65535),
  status TEXT NOT NULL CHECK (status IN ('FROZEN', 'SUBMITTING', 'SUBMITTED', 'CONFIRMED', 'FAILED')),
  signed_tx TEXT,
  tx_hash TEXT,
  nonce TEXT,
  chain_id TEXT,
  contract_address TEXT,
  block_number TEXT,
  block_hash TEXT,
  fail_reason TEXT,
  created_at TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS epoch_members (
  epoch_id TEXT NOT NULL REFERENCES epochs(epoch_id),
  receipt_hash TEXT NOT NULL UNIQUE REFERENCES receipts(receipt_hash),
  leaf_index INTEGER NOT NULL CHECK (leaf_index >= 0),
  PRIMARY KEY (epoch_id, leaf_index)
);

CREATE TABLE IF NOT EXISTS appeals (
  appeal_id TEXT PRIMARY KEY,
  original_receipt_hash TEXT NOT NULL UNIQUE REFERENCES receipts(receipt_hash),
  appeal_text TEXT NOT NULL,
  appeal_commitment TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  review_id TEXT PRIMARY KEY,
  target_receipt_hash TEXT NOT NULL UNIQUE REFERENCES receipts(receipt_hash),
  outcome TEXT NOT NULL,
  resulting_action TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  reviewer_principal TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS idempotency_records (
  principal TEXT NOT NULL,
  operation TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('IN_PROGRESS', 'COMPLETED')),
  response_status INTEGER,
  response_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (principal, operation, idempotency_key)
);

`

const EPOCH_V2_COLUMNS = [
  ['protocol_version', "INTEGER NOT NULL DEFAULT 1 CHECK (protocol_version >= 1 AND protocol_version <= 65535)"],
  ['chain_id', 'TEXT'],
  ['contract_address', 'TEXT'],
  ['created_at', "TEXT NOT NULL DEFAULT ''"],
  ['updated_at', "TEXT NOT NULL DEFAULT ''"],
] as const

export function openDatabase(path = ':memory:'): DatabaseSync {
  const database = new DatabaseSync(path)
  database.exec(MIGRATION_001)
  const epochColumns = new Set((database.prepare('PRAGMA table_info(epochs)').all() as { name: string }[]).map((column) => column.name))
  for (const [name, definition] of EPOCH_V2_COLUMNS) {
    if (!epochColumns.has(name)) database.exec(`ALTER TABLE epochs ADD COLUMN ${name} ${definition}`)
  }
  database.exec('PRAGMA user_version = 2')
  // A process that died before the issuance transaction committed created no
  // receipt. Its key is safe to claim again after restart.
  database.prepare("DELETE FROM idempotency_records WHERE status = 'IN_PROGRESS'").run()
  return database
}

export function transaction<T>(database: DatabaseSync, operation: () => T): T {
  database.exec('BEGIN IMMEDIATE')
  try {
    const result = operation()
    database.exec('COMMIT')
    return result
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  }
}
