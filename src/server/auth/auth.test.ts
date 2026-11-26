// AC-12 (R-17): nobody gets in without an invite, and nothing is served without a session.
// Uses a real, migrated libSQL file per test.
import { count } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { user } from '../db/schema.ts'
import { authRequest, createTestAuth } from '../test/database.ts'
import {
  acceptInvite,
  consumeInvite,
  createInvite,
  findInvite,
  INVITE_TTL_MS,
} from './invites.ts'

type TestAuth = Awaited<ReturnType<typeof createTestAuth>>
let t: TestAuth

beforeEach(async () => {
  t = await createTestAuth()
})
afterEach(async () => {
  await t.cleanup()
})

const userCount = async () =>
  (await t.db.select({ n: count() }).from(user))[0].n

const jana = { email: 'Jana@Example.test', name: 'Jana' }

describe('sign-up', () => {
  it('has no email sign-up', async () => {
    const response = await t.auth.handler(
      authRequest('/sign-up/email', {
        method: 'POST',
        body: {
          email: 'eve@example.test',
          password: 'long-password-1',
          name: 'Eve',
        },
      }),
    )
    expect(response.ok).toBe(false)
    expect(await userCount()).toBe(0)
  })

  it('refuses passkey registration without an invite', async () => {
    const response = await t.auth.handler(
      authRequest('/passkey/generate-register-options'),
    )
    expect(response.status).toBe(400)
  })

  it('refuses passkey registration with an unknown invite', async () => {
    const response = await t.auth.handler(
      authRequest('/passkey/generate-register-options?context=not-an-invite'),
    )
    expect(response.status).toBe(400)
  })

  it('refuses passkey registration with an expired invite', async () => {
    const past = new Date(Date.now() - INVITE_TTL_MS - 60_000)
    const { token } = await createInvite(t.internalAdapter, jana, past)
    const response = await t.auth.handler(
      authRequest(`/passkey/generate-register-options?context=${token}`),
    )
    expect(response.status).toBe(400)
  })

  it('offers passkey registration for a valid invite', async () => {
    const { token } = await createInvite(t.internalAdapter, jana)
    const response = await t.auth.handler(
      authRequest(`/passkey/generate-register-options?context=${token}`),
    )
    expect(response.status).toBe(200)
    const options = await response.json()
    expect(options.user).toMatchObject({
      name: 'jana@example.test',
      displayName: 'Jana',
    })
    expect(options.rp).toMatchObject({ id: 'localhost', name: 'moneyverse' })
    // Asking for options neither uses the invite nor creates anyone.
    expect(await findInvite(t.internalAdapter, token)).not.toBeNull()
    expect(await userCount()).toBe(0)
  })

  it('refuses to verify a registration without its challenge', async () => {
    const response = await t.auth.handler(
      authRequest('/passkey/verify-registration', {
        method: 'POST',
        body: { response: {}, createSession: true },
      }),
    )
    expect(response.status).toBe(400)
    expect(await userCount()).toBe(0)
  })
})

describe('invites', () => {
  it('stores only a hash of the token', async () => {
    const { token } = await createInvite(t.internalAdapter, jana)
    const rows = await t.db.query.verification.findMany()
    expect(rows).toHaveLength(1)
    expect(rows[0].identifier).not.toContain(token)
    expect(rows[0].value).not.toContain(token)
  })

  it('can be used once', async () => {
    const { token } = await createInvite(t.internalAdapter, jana)
    expect(await consumeInvite(t.internalAdapter, token)).not.toBeNull()
    expect(await consumeInvite(t.internalAdapter, token)).toBeNull()
  })

  it('creates the invited user when accepted', async () => {
    const { token, invite } = await createInvite(t.internalAdapter, jana)
    const userId = await acceptInvite(t.internalAdapter, token, invite.userId)
    expect(userId).toBe(invite.userId)
    const created = await t.internalAdapter.findUserById(invite.userId)
    expect(created).toMatchObject({
      email: 'jana@example.test',
      name: 'Jana',
      emailVerified: true,
    })
    expect(
      await acceptInvite(t.internalAdapter, token, invite.userId),
    ).toBeNull()
    expect(await userCount()).toBe(1)
  })

  it('refuses an invite reserved for another user', async () => {
    const { token } = await createInvite(t.internalAdapter, jana)
    expect(
      await acceptInvite(t.internalAdapter, token, 'someone-else'),
    ).toBeNull()
    expect(await userCount()).toBe(0)
  })

  it('adds a passkey for an existing user without creating another', async () => {
    const first = await createInvite(t.internalAdapter, jana)
    await acceptInvite(t.internalAdapter, first.token, first.invite.userId)

    const again = await createInvite(t.internalAdapter, {
      ...jana,
      existingUserId: first.invite.userId,
    })
    expect(again.invite.newUser).toBe(false)
    expect(
      await acceptInvite(t.internalAdapter, again.token, first.invite.userId),
    ).toBe(first.invite.userId)
    expect(await userCount()).toBe(1)
  })
})

describe('sessions', () => {
  it('returns no session without a cookie', async () => {
    const response = await t.auth.handler(authRequest('/get-session'))
    expect(response.status).toBe(200)
    expect(await response.json()).toBeNull()
  })

  it('returns no session for a forged cookie', async () => {
    const request = authRequest('/get-session')
    request.headers.set('cookie', 'better-auth.session_token=forged.value')
    const response = await t.auth.handler(request)
    expect(await response.json()).toBeNull()
  })
})

describe('rate limiting', () => {
  it('limits passkey requests from one address', async () => {
    const limited = await createTestAuth({ rateLimit: true })
    try {
      const statuses: number[] = []
      for (let i = 0; i < 12; i++) {
        const response = await limited.auth.handler(
          authRequest('/passkey/generate-authenticate-options', {
            ip: '203.0.113.7',
          }),
        )
        statuses.push(response.status)
      }
      expect(statuses.slice(0, 10).every((status) => status === 200)).toBe(true)
      expect(statuses.at(-1)).toBe(429)

      // Another address is not affected.
      const other = await limited.auth.handler(
        authRequest('/passkey/generate-authenticate-options', {
          ip: '203.0.113.8',
        }),
      )
      expect(other.status).toBe(200)
    } finally {
      await limited.cleanup()
    }
  })
})
