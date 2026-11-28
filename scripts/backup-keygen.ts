// Owner, once: creates the key pair for cloud backups (ADR 0006).
//
//   pnpm backup:keygen
//
// Writes the PRIVATE key to ~/Documents/moneyverse-backups/backup-private-key.jwk (readable by
// you only) and refuses to overwrite one. Store a copy in your password manager: without it no
// cloud backup can be opened. Prints the PUBLIC key, which goes to the Worker as a secret.
import { access, mkdir, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import { generateBackupKeys } from '../src/server/backup/envelope.ts'

const directory = path.join(homedir(), 'Documents', 'moneyverse-backups')
const privateFile = path.join(directory, 'backup-private-key.jwk')
const publicFile = path.join(directory, 'backup-public-key.jwk')

try {
  await access(privateFile)
  console.error(
    `✗ ${privateFile} already exists. A new key pair would not open the existing backups.`,
  )
  process.exit(2)
} catch {
  // No key yet: create one.
}

const { publicKey, privateKey } = await generateBackupKeys()
await mkdir(directory, { recursive: true, mode: 0o700 })
await writeFile(privateFile, JSON.stringify(privateKey), { mode: 0o600 })
await writeFile(publicFile, JSON.stringify(publicKey), { mode: 0o644 })
console.log(
  `Private key: ${privateFile} — copy it into your password manager now.`,
)
console.log(
  `Public key:  ${publicFile} — give it to the Worker (runbook, "Cloud backups").`,
)
