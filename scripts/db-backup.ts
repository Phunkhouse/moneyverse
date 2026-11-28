// Operator script: backs up the production database to a dated SQL dump on this computer, then
// restores it into a throwaway local database to prove it works (docs/runbook.md).
//
//   pnpm db:backup
//
// Uses the logged-in Turso CLI (`turso db shell moneyverse .dump`); no variables to set. Live
// sessions, challenges and rate-limit counters are left out; everyone signs in again after a restore. Writes to
// $MONEYVERSE_BACKUP_DIR, or ~/Documents/moneyverse-backups, never inside this repository (it is
// public) and never through GitHub. Prints the file, its size and row counts only. Owner only.
import { execFileSync } from 'node:child_process'
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import { checkDump, stripTransientRows } from '../src/server/db/backup.ts'
import { PRODUCTION_DATABASE } from '../src/server/db/target.ts'

const repository = path.resolve(import.meta.dirname, '..')
const directory = path.resolve(
  process.env.MONEYVERSE_BACKUP_DIR?.trim() ||
    path.join(homedir(), 'Documents', 'moneyverse-backups'),
)
const relative = path.relative(repository, directory)
if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
  console.error(
    `✗ ${directory} is inside the repository, which is public. Choose another folder.`,
  )
  process.exit(2)
}

let dump: string
try {
  const raw = execFileSync(
    'turso',
    ['db', 'shell', PRODUCTION_DATABASE, '.dump'],
    {
      encoding: 'utf8',
      maxBuffer: 512 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  // Sessions, challenges and rate limits stay out of the file (see TRANSIENT_TABLES).
  dump = stripTransientRows(raw)
} catch (error) {
  console.error(
    '✗ The Turso CLI could not dump the database. Check `turso auth login`.',
    (error as { stderr?: string }).stderr?.trim() ?? '',
  )
  process.exit(2)
}

await mkdir(directory, { recursive: true, mode: 0o700 })
const stamp = new Date().toISOString().slice(0, 16).replace(':', '-')
const file = path.join(directory, `moneyverse-${stamp}.sql`)
await writeFile(file, dump, { mode: 0o600 })
await chmod(file, 0o600)
console.log(
  `Saved ${file} (${(Buffer.byteLength(dump) / 1024).toFixed(0)} kB).`,
)

const journal = JSON.parse(
  await readFile(path.join(repository, 'drizzle/meta/_journal.json'), 'utf8'),
) as { entries: unknown[] }
try {
  const result = await checkDump(dump, journal.entries.length)
  console.log(
    `✓ Restore check passed: ${result.migrations} migrations, all tables present.`,
  )
  for (const [table, rows] of Object.entries(result.rows))
    console.log(`  ${table}: ${rows}`)
} catch (error) {
  console.error(`✗ Restore check failed: ${(error as Error).message}`)
  console.error(
    '  The file is kept for inspection, but it does not count as a backup.',
  )
  process.exit(1)
}
