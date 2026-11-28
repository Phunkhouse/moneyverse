import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import type { Db } from './client.ts'
import { createAccount } from '../money/ledger.ts'
import { createTestDb, createTestUser } from '../test/database.ts'
import { checkDump, stripTransientRows } from './backup.ts'
import { sql } from 'drizzle-orm'

// A small stand-in for SQLite's `.dump` (which `turso db shell <db> .dump` produces): the schema
// from sqlite_master and one INSERT per row. Invented data only.
async function dump(db: Db): Promise<string> {
  const objects = await db.all<{
    type: string
    name: string
    sql: string | null
  }>(
    sql`select type, name, sql from sqlite_master where sql is not null and name not like 'sqlite_%' order by type = 'index', name`,
  )
  const lines = ['PRAGMA foreign_keys=OFF;', 'BEGIN TRANSACTION;']
  for (const o of objects) lines.push(`${o.sql};`)
  for (const o of objects.filter((x) => x.type === 'table')) {
    const rows = await db.all<Record<string, unknown>>(
      sql.raw(`select * from "${o.name}"`),
    )
    for (const row of rows) {
      const values = Object.values(row).map((v) =>
        v === null
          ? 'NULL'
          : typeof v === 'number'
            ? String(v)
            : `'${String(v).replace(/'/g, "''")}'`,
      )
      lines.push(`INSERT INTO "${o.name}" VALUES(${values.join(',')});`)
    }
  }
  lines.push('COMMIT;')
  return lines.join('\n')
}

const migrationCount = async () =>
  (
    JSON.parse(await readFile('drizzle/meta/_journal.json', 'utf8')) as {
      entries: unknown[]
    }
  ).entries.length

let db: Db
let cleanup: () => Promise<void>
beforeEach(async () => ({ db, cleanup } = await createTestDb()))
afterEach(() => cleanup())

describe('stripTransientRows', () => {
  it('drops sessions, challenges and rate limits but keeps everything else', async () => {
    const me = await createTestUser(db)
    await db.run(
      sql`insert into session (id, expires_at, token, user_id) values ('s1', 0, 'invented-token', ${me})`,
    )
    await db.run(
      sql`insert into rate_limit (id, key, count, last_request) values ('r1', 'k', 1, 0)`,
    )
    const stripped = stripTransientRows(await dump(db))
    expect(stripped).not.toContain('invented-token')
    const result = await checkDump(stripped, await migrationCount())
    expect(result.rows).toMatchObject({ session: 0, rate_limit: 0, user: 1 })
  })

  it('also matches the unquoted form SQLite writes', () => {
    const dump = [
      'INSERT INTO session VALUES(1);',
      'INSERT INTO sessions_x VALUES(2);',
      'INSERT INTO "user" VALUES(3);',
    ].join('\n')
    expect(stripTransientRows(dump).split('\n')).toEqual([
      'INSERT INTO sessions_x VALUES(2);',
      'INSERT INTO "user" VALUES(3);',
    ])
  })
})

describe('checkDump', () => {
  it('restores a dump and counts the rows of every table', async () => {
    const me = await createTestUser(db)
    await createAccount(db, me, {
      name: 'Běžný účet',
      type: 'checking',
      currency: 'CZK',
      openedOn: '2026-01-01',
    })
    const result = await checkDump(await dump(db), await migrationCount())
    expect(result.rows.user).toBe(1)
    expect(result.rows.money_account).toBe(1)
    expect(result.rows.money_transaction).toBe(0)
    expect(result.migrations).toBe(await migrationCount())
  })

  it('refuses a dump that is missing a table or is behind the code', async () => {
    const full = await dump(db)
    await expect(checkDump(full, (await migrationCount()) + 1)).rejects.toThrow(
      'migrations',
    )
    await db.run(sql`drop table month_value`)
    await expect(
      checkDump(await dump(db), await migrationCount()),
    ).rejects.toThrow('month_value')
  })

  it('refuses something that is not a dump', async () => {
    await expect(checkDump('hello', 3)).rejects.toThrow('not an SQL dump')
    await expect(checkDump('CREATE TABLE x (', 3)).rejects.toThrow(
      'does not restore',
    )
  })
})
