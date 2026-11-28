// Restores a backup file into a throwaway local database and checks it (docs/runbook.md).
//
//   pnpm db:restore-check <path/to/moneyverse-….sql>
//
// Prints row counts only, never contents. The temporary database is removed afterwards.
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { checkDump } from '../src/server/db/backup.ts'

const file = process.argv[2]
if (!file) {
  console.error('Usage: pnpm db:restore-check <backup.sql>')
  process.exit(2)
}
const repository = path.resolve(import.meta.dirname, '..')
const journal = JSON.parse(
  await readFile(path.join(repository, 'drizzle/meta/_journal.json'), 'utf8'),
) as { entries: unknown[] }
try {
  const result = await checkDump(
    await readFile(file, 'utf8'),
    journal.entries.length,
  )
  console.log(
    `✓ ${file} restores: ${result.migrations} migrations, all tables present.`,
  )
  for (const [table, rows] of Object.entries(result.rows))
    console.log(`  ${table}: ${rows}`)
} catch (error) {
  console.error(`✗ ${(error as Error).message}`)
  process.exit(1)
}
