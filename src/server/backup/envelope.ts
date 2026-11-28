// Encryption for cloud backups (ADR 0006). The backup Worker holds only the public key, so it can
// encrypt but never read a backup; the owner keeps the private key offline.
//
// File format: "MVB1" | key length (2 bytes, big endian) | RSA-OAEP-wrapped AES key | IV (12) |
// AES-256-GCM ciphertext with its tag. WebCrypto only, so the same code runs in the Worker and Node.

const MAGIC = new TextEncoder().encode('MVB1')
const RSA = { name: 'RSA-OAEP', hash: 'SHA-256' } as const

export type BackupKeys = { publicKey: JsonWebKey; privateKey: JsonWebKey }

export async function generateBackupKeys(): Promise<BackupKeys> {
  const pair = await crypto.subtle.generateKey(
    { ...RSA, modulusLength: 4096, publicExponent: new Uint8Array([1, 0, 1]) },
    true,
    ['encrypt', 'decrypt'],
  )
  return {
    publicKey: await crypto.subtle.exportKey('jwk', pair.publicKey),
    privateKey: await crypto.subtle.exportKey('jwk', pair.privateKey),
  }
}

export async function encryptBackup(
  plain: Uint8Array<ArrayBuffer>,
  publicJwk: JsonWebKey,
): Promise<Uint8Array<ArrayBuffer>> {
  const publicKey = await crypto.subtle.importKey(
    'jwk',
    publicJwk,
    RSA,
    false,
    ['encrypt'],
  )
  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt'],
  )
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const wrapped = new Uint8Array(
    await crypto.subtle.encrypt(
      RSA,
      publicKey,
      await crypto.subtle.exportKey('raw', aesKey),
    ),
  )
  const body = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, plain),
  )
  const out = new Uint8Array(
    MAGIC.length + 2 + wrapped.length + iv.length + body.length,
  )
  let at = 0
  out.set(MAGIC, at)
  at += MAGIC.length
  new DataView(out.buffer).setUint16(at, wrapped.length)
  at += 2
  out.set(wrapped, at)
  at += wrapped.length
  out.set(iv, at)
  at += iv.length
  out.set(body, at)
  return out
}

/** Decrypts a backup file; throws if it is not one, or if it was changed (GCM tag). */
export async function decryptBackup(
  data: Uint8Array<ArrayBuffer>,
  privateJwk: JsonWebKey,
): Promise<Uint8Array<ArrayBuffer>> {
  const magic = new TextDecoder().decode(data.subarray(0, MAGIC.length))
  if (magic !== 'MVB1')
    throw new Error('Not an encrypted moneyverse backup (wrong header).')
  const keyLength = new DataView(data.buffer, data.byteOffset).getUint16(
    MAGIC.length,
  )
  let at = MAGIC.length + 2
  const wrapped = data.subarray(at, at + keyLength)
  at += keyLength
  const iv = data.subarray(at, at + 12)
  at += 12
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    privateJwk,
    RSA,
    false,
    ['decrypt'],
  )
  let rawKey: ArrayBuffer
  try {
    rawKey = await crypto.subtle.decrypt(RSA, privateKey, wrapped)
  } catch {
    throw new Error('This private key does not open this backup.')
  }
  const aesKey = await crypto.subtle.importKey(
    'raw',
    rawKey,
    'AES-GCM',
    false,
    ['decrypt'],
  )
  try {
    return new Uint8Array(
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        data.subarray(at),
      ),
    )
  } catch {
    throw new Error(
      'The backup is damaged or was changed (integrity check failed).',
    )
  }
}
