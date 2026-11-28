// Operator script: the restore drill (docs/runbook.md). Restores a backup into a temporary Turso
// database the way a real restore would, compares every table's row count with the file, and
// destroys the temporary database again.
//
//   pnpm db:restore-drill <path/to/moneyverse-….sql>
//
// Uses the logged-in Turso CLI. Prints row counts only. Owner only.
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { sql } from 'drizzle-orm'
import { checkDump, countDifferences } from '../src/server/db/backup.ts'
import { createDb } from '../src/server/db/client.ts'
import { EXPECTED_TABLES } from '../src/server/db/target.ts'

const DRILL_DATABASE = 'moneyverse-restore-drill'
const file = process.argv[2]
if (!file) {
  console.error('Usage: pnpm db:restore-drill <backup.sql>')
  process.exit(2)
}

const turso = (args: string[], input?: string) =>
  execFileSync('turso', args, {
    encoding: 'utf8',
    input,
    maxBuffer: 512 * 1024 * 1024,
    stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
  }).trim()

const dump = await readFile(file, 'utf8')
const repository = path.resolve(import.meta.dirname, '..')
const journal = JSON.parse(
  await readFile(path.join(repository, 'drizzle/meta/_journal.json'), 'utf8'),
) as { entries: unknown[] }
const expected = await checkDump(dump, journal.entries.length)
console.log(`✓ The file restores locally (${expected.migrations} migrations).`)

try {
  // Fails if a database with this name already exists, so nothing unrelated is touched.
  turso(['db', 'create', DRILL_DATABASE])
} catch (error) {
  console.error(
    `✗ Could not create ${DRILL_DATABASE}:`,
    (error as { stderr?: string }).stderr?.trim(),
  )
  process.exit(2)
}

let failed = false
try {
  // The restore route that keeps every row: an empty database, then the dump through the shell.
  // (`turso db create --from-dump` lost the user and passkey rows in the 2026-11-28 drill.)
  turso(['db', 'shell', DRILL_DATABASE], dump)
  const db = createDb(
    turso(['db', 'show', DRILL_DATABASE, '--url']),
    turso(['db', 'tokens', 'create', DRILL_DATABASE, '--expiration', '1d']),
  )
  const actual: Record<string, number> = {}
  for (const table of EXPECTED_TABLES) {
    const [row] = await db.all<{ n: number }>(
      sql.raw(`select count(*) as n from "${table}"`),
    )
    actual[table] = Number(row.n)
  }
  const [migrations] = await db.all<{ n: number }>(
    sql`select count(*) as n from __drizzle_migrations`,
  )
  const differences = countDifferences(
    { ...expected.rows, __drizzle_migrations: expected.migrations },
    { ...actual, __drizzle_migrations: Number(migrations.n) },
  )
  if (differences.length) {
    failed = true
    console.error('✗ The Turso restore lost rows:')
    for (const line of differences) console.error(`  ${line}`)
  } else {
    console.log(
      `✓ Restored into Turso with every row: ${Object.values(actual).reduce((a, b) => a + b, 0)} rows in ${EXPECTED_TABLES.length} tables.`,
    )
  }
} catch (error) {
  failed = true
  console.error(
    '✗ The drill failed:',
    (error as { stderr?: string }).stderr?.trim() || (error as Error).message,
  )
} finally {
  turso(['db', 'destroy', DRILL_DATABASE, '--yes'])
  console.log(`Destroyed ${DRILL_DATABASE}.`)
}
process.exit(failed ? 1 : 0)
