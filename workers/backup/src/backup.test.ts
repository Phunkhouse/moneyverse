import { describe, expect, it } from 'vitest'
import {
  decryptBackup,
  generateBackupKeys,
} from '../../../src/server/backup/envelope.ts'
import { runBackup, type BucketLike } from './backup.ts'

// Invented data only.
const keys = await generateBackupKeys()
const dump =
  'PRAGMA foreign_keys=OFF;\nBEGIN TRANSACTION;\nCREATE TABLE x (a);\nINSERT INTO x VALUES(1);\nCOMMIT;\n'

function fakeBucket() {
  const stored = new Map<
    string,
    { value: Uint8Array; meta?: Record<string, string> }
  >()
  const bucket: BucketLike = {
    async put(key, value, options) {
      stored.set(key, { value, meta: options?.customMetadata })
    },
  }
  return { bucket, stored }
}

const deps = (fetchImpl: typeof fetch, bucket: BucketLike) => ({
  databaseUrl: 'https://moneyverse-example.turso.io',
  token: 'invented-read-only-token',
  publicKey: JSON.stringify(keys.publicKey),
  bucket,
  fetch: fetchImpl,
  now: new Date('2026-11-29T02:30:00Z'),
})

describe('runBackup', () => {
  it('fetches the dump with the token and stores it encrypted', async () => {
    const { bucket, stored } = fakeBucket()
    let seen: { url: string; auth: string | null } | undefined
    const fetchImpl = (async (url: URL, init?: RequestInit) => {
      seen = {
        url: String(url),
        auth: new Headers(init?.headers).get('authorization'),
      }
      return new Response(dump)
    }) as unknown as typeof fetch

    const result = await runBackup(deps(fetchImpl, bucket))
    expect(seen).toEqual({
      url: 'https://moneyverse-example.turso.io/dump',
      auth: 'Bearer invented-read-only-token',
    })
    expect(result.key).toBe('moneyverse-2026-11-29T02-30.sql.enc')
    const object = stored.get(result.key)!
    expect(new TextDecoder().decode(object.value)).not.toContain('INSERT INTO')
    expect(object.meta).toEqual({
      plainBytes: String(new TextEncoder().encode(dump).length),
    })
    const opened = await decryptBackup(
      object.value as Uint8Array<ArrayBuffer>,
      keys.privateKey,
    )
    expect(new TextDecoder().decode(opened)).toBe(dump)
  })

  it('stores nothing when Turso refuses or the dump is cut off', async () => {
    const { bucket, stored } = fakeBucket()
    const refused = (async () =>
      new Response('no', { status: 401 })) as unknown as typeof fetch
    await expect(runBackup(deps(refused, bucket))).rejects.toThrow('401')
    const cut = (async () =>
      new Response(dump.slice(0, 40))) as unknown as typeof fetch
    await expect(runBackup(deps(cut, bucket))).rejects.toThrow('incomplete')
    expect(stored.size).toBe(0)
  })
})
