// Applies the migrations in drizzle/ and then checks that every expected table exists.
//
//   pnpm db:migrate          the local file (DATABASE_URL may only be a file: URL)
//   pnpm db:migrate:prod     Turso; refuses to run unless DATABASE_URL and DATABASE_AUTH_TOKEN
//                            are set in this terminal (docs/runbook.md). Owner only.
//
// Prints the database host and table names, never the token.
import { sql } from 'drizzle-orm'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { createDb } from '../src/server/db/client.ts'
import {
  EXPECTED_TABLES,
  migrationTarget,
  type MigrationMode,
} from '../src/server/db/target.ts'

const mode: MigrationMode = process.argv.includes('--production')
  ? 'production'
  : 'local'

let target
try {
  target = migrationTarget(mode, process.env)
} catch (error) {
  console.error(`✗ ${(error as Error).message}`)
  process.exit(2)
}

const where = target.url.startsWith('file:')
  ? target.url
  : new URL(target.url).host
console.log(
  `Migrating ${mode === 'production' ? 'PRODUCTION' : 'local'} database: ${where}`,
)
const db = createDb(target.url, target.authToken)
await migrate(db, { migrationsFolder: 'drizzle' })

const tables = new Set(
  (
    await db.all<{ name: string }>(
      sql`select name from sqlite_master where type = 'table' and name not like 'sqlite_%'`,
    )
  ).map((row) => row.name),
)
const [{ count }] = await db.all<{ count: number }>(
  sql`select count(*) as count from __drizzle_migrations`,
)
const missing = EXPECTED_TABLES.filter((table) => !tables.has(table))
if (missing.length > 0) {
  console.error(`✗ Missing tables after migrating: ${missing.join(', ')}`)
  process.exit(1)
}
console.log(
  `✓ ${count} migrations applied; all ${EXPECTED_TABLES.length} tables present.`,
)
