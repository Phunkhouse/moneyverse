import { describe, expect, it } from 'vitest'
import { decryptBackup, encryptBackup, generateBackupKeys } from './envelope.ts'

// One key pair for the file: 4096-bit generation takes a moment.
const keys = await generateBackupKeys()
const text = (s: string) => new TextEncoder().encode(s)

describe('backup envelope', () => {
  it('round-trips a dump, and the public key alone cannot read it', async () => {
    const dump = text('PRAGMA foreign_keys=OFF;\nBEGIN TRANSACTION;\nCOMMIT;\n')
    const sealed = await encryptBackup(dump, keys.publicKey)
    expect(new TextDecoder().decode(sealed.subarray(0, 4))).toBe('MVB1')
    expect(new TextDecoder().decode(sealed)).not.toContain('BEGIN TRANSACTION')
    expect(await decryptBackup(sealed, keys.privateKey)).toEqual(dump)
    expect(keys.publicKey.d).toBeUndefined()
  })

  it('refuses another key, a changed byte and a file that is not a backup', async () => {
    const sealed = await encryptBackup(
      text('INSERT INTO x VALUES(1);'),
      keys.publicKey,
    )
    const other = await generateBackupKeys()
    await expect(decryptBackup(sealed, other.privateKey)).rejects.toThrow(
      'does not open',
    )
    const changed = sealed.slice()
    changed[changed.length - 1] ^= 1
    await expect(decryptBackup(changed, keys.privateKey)).rejects.toThrow(
      'damaged',
    )
    await expect(
      decryptBackup(text('PRAGMA'), keys.privateKey),
    ).rejects.toThrow('wrong header')
  }, 30_000)
})
