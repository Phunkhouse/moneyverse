// Opens a cloud backup (ADR 0006) and checks it like a local one.
//
//   pnpm backup:decrypt <moneyverse-….sql.enc> [--key <private-key.jwk>]
//
// Writes <file>.sql next to it (readable by you only), without sessions, challenges or rate
// limits, then restores it into a throwaway local database and prints row counts. The key
// defaults to ~/Documents/moneyverse-backups/backup-private-key.jwk.
import { readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { decryptBackup } from '../src/server/backup/envelope.ts'
import { checkDump, stripTransientRows } from '../src/server/db/backup.ts'

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { key: { type: 'string' } },
})
const file = positionals[0]
if (!file) {
  console.error(
    'Usage: pnpm backup:decrypt <backup.sql.enc> [--key <private-key.jwk>]',
  )
  process.exit(2)
}
const keyFile =
  values.key ??
  path.join(
    homedir(),
    'Documents',
    'moneyverse-backups',
    'backup-private-key.jwk',
  )

try {
  const privateKey = JSON.parse(await readFile(keyFile, 'utf8')) as JsonWebKey
  const plain = await decryptBackup(
    new Uint8Array(await readFile(file)),
    privateKey,
  )
  const dump = stripTransientRows(new TextDecoder().decode(plain))
  const out =
    file.replace(/\.enc$/, '') === file
      ? `${file}.sql`
      : file.replace(/\.enc$/, '')
  await writeFile(out, dump, { mode: 0o600 })
  console.log(`Decrypted to ${out}.`)

  const repository = path.resolve(import.meta.dirname, '..')
  const journal = JSON.parse(
    await readFile(path.join(repository, 'drizzle/meta/_journal.json'), 'utf8'),
  ) as { entries: unknown[] }
  const result = await checkDump(dump, journal.entries.length)
  console.log(
    `✓ Restore check passed: ${result.migrations} migrations, all tables present.`,
  )
  for (const [table, rows] of Object.entries(result.rows))
    console.log(`  ${table}: ${rows}`)
} catch (error) {
  console.error(`✗ ${(error as Error).message}`)
  process.exit(1)
}
