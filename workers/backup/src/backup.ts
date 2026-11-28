// The daily cloud backup (ADR 0006): fetch the production dump from Turso, check it looks
// complete, encrypt it with the owner's public key, store it in R2. Kept small on purpose: a
// Workers Free cron run has 10 ms of CPU, and waiting on the network does not count.
import { encryptBackup } from '../../../src/server/backup/envelope.ts'

/** The slice of R2's bucket API the backup uses. */
export type BucketLike = {
  put(
    key: string,
    value: Uint8Array,
    options?: { customMetadata?: Record<string, string> },
  ): Promise<unknown>
}

export type BackupDeps = {
  /** The database's HTTPS URL (`turso db show moneyverse --http-url`). */
  databaseUrl: string
  /** A read-only database token. */
  token: string
  /** The owner's public key as JSON (a JWK from `pnpm backup:keygen`). */
  publicKey: string
  bucket: BucketLike
  fetch: typeof fetch
  now: Date
}

const decoder = new TextDecoder()

export async function runBackup(
  deps: BackupDeps,
): Promise<{ key: string; bytes: number }> {
  const response = await deps.fetch(new URL('/dump', deps.databaseUrl), {
    headers: { authorization: `Bearer ${deps.token}` },
  })
  if (!response.ok)
    throw new Error(`Turso answered ${response.status} for /dump`)
  const dump = new Uint8Array(await response.arrayBuffer())
  // Only the start and the end are read: enough to tell a whole dump from an error or a cut one.
  const head = decoder.decode(dump.subarray(0, 200))
  const tail = decoder.decode(dump.subarray(Math.max(0, dump.length - 64)))
  if (!head.includes('BEGIN TRANSACTION') || !tail.includes('COMMIT;')) {
    throw new Error(`The dump looks incomplete (${dump.length} bytes)`)
  }
  const sealed = await encryptBackup(
    dump,
    JSON.parse(deps.publicKey) as JsonWebKey,
  )
  const key = `moneyverse-${deps.now.toISOString().slice(0, 16).replace(':', '-')}.sql.enc`
  await deps.bucket.put(key, sealed, {
    customMetadata: { plainBytes: String(dump.length) },
  })
  return { key, bytes: sealed.length }
}
