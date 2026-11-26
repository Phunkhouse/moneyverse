import { randomBytes, randomUUID } from 'node:crypto'

/** The part of Better Auth's internal adapter that invites use. */
export type VerificationStore = {
  createVerificationValue(data: {
    identifier: string
    value: string
    expiresAt: Date
  }): Promise<unknown>
  findVerificationValue(
    identifier: string,
  ): Promise<{ value: string; expiresAt: Date } | null>
  consumeVerificationValue(
    identifier: string,
  ): Promise<{ value: string; expiresAt: Date } | null>
}

export type Invite = {
  /** The user the passkey will belong to: reserved for a new user, or an existing one. */
  userId: string
  email: string
  name: string
  /** True when accepting the invite creates the user. */
  newUser: boolean
}

export const INVITE_TTL_MS = 24 * 60 * 60 * 1000

const identifierFor = (token: string) => `invite:${token}`

function parseInvite(
  record: { value: string; expiresAt: Date } | null,
  now: Date,
): Invite | null {
  if (!record || record.expiresAt.getTime() <= now.getTime()) return null
  try {
    const value = JSON.parse(record.value) as Partial<Invite>
    if (
      typeof value.userId !== 'string' ||
      typeof value.email !== 'string' ||
      typeof value.name !== 'string' ||
      typeof value.newUser !== 'boolean'
    ) {
      return null
    }
    return value as Invite
  } catch {
    return null
  }
}

export function normalizeEmail(email: string) {
  const normalized = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('Invalid email address')
  }
  return normalized
}

/**
 * Creates a single-use invite and returns its secret token. Only the token's hash is stored
 * (Better Auth's `storeIdentifier: 'hashed'`). Pass `existingUserId` to let an existing user add
 * a passkey, for example on a new device or after losing the old one.
 */
export async function createInvite(
  store: VerificationStore,
  input: { email: string; name: string; existingUserId?: string },
  now = new Date(),
) {
  const name = input.name.trim()
  if (!name) throw new Error('Name is required')
  const invite: Invite = {
    userId: input.existingUserId ?? randomUUID(),
    email: normalizeEmail(input.email),
    name,
    newUser: !input.existingUserId,
  }
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(now.getTime() + INVITE_TTL_MS)
  await store.createVerificationValue({
    identifier: identifierFor(token),
    value: JSON.stringify(invite),
    expiresAt,
  })
  return { token, expiresAt, invite }
}

/** Looks an invite up without using it. */
export async function findInvite(
  store: VerificationStore,
  token: string | null | undefined,
  now = new Date(),
) {
  if (!token) return null
  return parseInvite(
    await store.findVerificationValue(identifierFor(token)),
    now,
  )
}

/** Uses an invite up. Returns null if it is missing, expired or already used. */
export async function consumeInvite(
  store: VerificationStore,
  token: string | null | undefined,
  now = new Date(),
) {
  if (!token) return null
  return parseInvite(
    await store.consumeVerificationValue(identifierFor(token)),
    now,
  )
}

/** What accepting an invite needs on top of the verification store. */
export type InviteAdapter = VerificationStore & {
  createUser(
    user: { id: string; email: string; name: string; emailVerified: boolean },
    source: { method: string },
  ): Promise<unknown>
}

/**
 * Accepts an invite for a verified passkey registration: uses the invite up and, for a new user,
 * creates the user. Runs inside the registration's transaction, so a failure (for example a
 * duplicate email) leaves the invite unused. Returns the user the passkey belongs to, or null when
 * the invite is missing, expired, used, or reserved for another user than the registration.
 */
export async function acceptInvite(
  adapter: InviteAdapter,
  token: string | null | undefined,
  registeringUserId: string,
  now = new Date(),
) {
  const invite = await consumeInvite(adapter, token, now)
  if (!invite || invite.userId !== registeringUserId) return null
  if (invite.newUser) {
    await adapter.createUser(
      {
        id: invite.userId,
        email: invite.email,
        name: invite.name,
        emailVerified: true,
      },
      { method: 'passkey-invite' },
    )
  }
  return invite.userId
}
