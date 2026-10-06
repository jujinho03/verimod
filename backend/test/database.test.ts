import { randomUUID } from 'node:crypto'
import { rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { openDatabase, TABLES, transaction } from '../src/database.js'

describe('API-01 SQLite migration', () => {
  it('creates exactly the seven W3 domain tables', () => {
    const database = openDatabase()
    try {
      const rows = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as { name: string }[]
      expect(rows.map((row) => row.name)).toEqual([...TABLES])
      expect(database.prepare('PRAGMA user_version').get()).toEqual({ user_version: 1 })
    } finally {
      database.close()
    }
  })

  it('rolls a failed transaction back', () => {
    const database = openDatabase()
    try {
      expect(() => transaction(database, () => {
        database.prepare(
          'INSERT INTO idempotency_records (principal, operation, idempotency_key, request_hash, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ).run('owner', 'test', 'key', 'hash', 'IN_PROGRESS', 'now', 'now')
        throw new Error('injected failure')
      })).toThrow('injected failure')
      expect(database.prepare('SELECT COUNT(*) AS count FROM idempotency_records').get()).toEqual({ count: 0 })
    } finally {
      database.close()
    }
  })

  it('persists committed rows across restart and releases abandoned work', () => {
    const path = join(tmpdir(), `verimod-w3-${randomUUID()}.sqlite`)
    try {
      const first = openDatabase(path)
      first.prepare(
        "INSERT INTO receipts (receipt_id, issuer_seq, canonical_body, receipt_hash, event_kind, owner_principal, created_at) VALUES ('r1', 1, '{}', 'h1', 'DECISION', 'owner', 'now')",
      ).run()
      first.prepare(
        "INSERT INTO idempotency_records (principal, operation, idempotency_key, request_hash, status, created_at, updated_at) VALUES ('owner', 'op', 'key', 'hash', 'IN_PROGRESS', 'now', 'now')",
      ).run()
      first.close()

      const reopened = openDatabase(path)
      expect(reopened.prepare('SELECT receipt_id FROM receipts').get()).toEqual({ receipt_id: 'r1' })
      expect(reopened.prepare('SELECT COUNT(*) AS count FROM idempotency_records').get()).toEqual({ count: 0 })
      reopened.close()
    } finally {
      rmSync(path, { force: true })
    }
  })
})
