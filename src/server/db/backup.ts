// Checking a backup (an SQL dump of the production database) by restoring it into a throwaway
// local database. "A backup with a tested restore" (AGENTS.md, risk trigger "has real users")
// means every backup is restored once before it counts.
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createClient } from '@libsql/client'
import { EXPECTED_TABLES } from './target.ts'

/**
 * Tables whose rows a backup leaves out: live sign-in sessions (their tokens would let anyone with
 * the file sign in), short-lived WebAuthn challenges and invites, and rate-limit counters. After a
 * restore, everyone signs in again with their passkey; passkeys and all money data are kept.
 */
export const TRANSIENT_TABLES = [
  'session',
  'verification',
  'rate_limit',
] as const

/** Removes the transient tables' rows from an SQLite `.dump`, keeping their schema. */
export function stripTransientRows(dump: string): string {
  const pattern = new RegExp(
    `^INSERT INTO "?(${TRANSIENT_TABLES.join('|')})"?[ (]`,
  )
  return dump
    .split('\n')
    .filter((line) => !pattern.test(line))
    .join('\n')
}

export type DumpCheck = {
  /** Rows per table; counts only, never contents. */
  rows: Record<string, number>
  migrations: number
}

/**
 * Restores `dump` into a temporary SQLite file, checks that every expected table exists and that
 * the applied migrations match `expectedMigrations`, and returns the row counts. Throws with a
 * plain reason otherwise. The temporary file is always removed.
 */
export async function checkDump(
  dump: string,
  expectedMigrations: number,
): Promise<DumpCheck> {
  if (!/CREATE TABLE/i.test(dump))
    throw new Error('The file is not an SQL dump (no CREATE TABLE).')
  const dir = await mkdtemp(path.join(tmpdir(), 'moneyverse-restore-'))
  const client = createClient({ url: `file:${path.join(dir, 'restore.db')}` })
  try {
    try {
      await client.executeMultiple(dump)
    } catch (error) {
      throw new Error(`The dump does not restore: ${(error as Error).message}`)
    }
    const tables = new Set(
      (
        await client.execute(
          "select name from sqlite_master where type = 'table' and name not like 'sqlite_%'",
        )
      ).rows.map((row) => String(row.name)),
    )
    const missing = EXPECTED_TABLES.filter((table) => !tables.has(table))
    if (missing.length)
      throw new Error(`Missing tables after restore: ${missing.join(', ')}`)
    if (!tables.has('__drizzle_migrations'))
      throw new Error('Missing table __drizzle_migrations')

    const rows: Record<string, number> = {}
    for (const table of EXPECTED_TABLES) {
      const result = await client.execute(
        `select count(*) as n from "${table}"`,
      )
      rows[table] = Number(result.rows[0].n)
    }
    const migrations = Number(
      (await client.execute('select count(*) as n from __drizzle_migrations'))
        .rows[0].n,
    )
    if (migrations !== expectedMigrations) {
      throw new Error(
        `The dump has ${migrations} migrations applied; this code expects ${expectedMigrations}.`,
      )
    }
    return { rows, migrations }
  } finally {
    client.close()
    await rm(dir, { recursive: true, force: true })
  }
}
