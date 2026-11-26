import { passkey } from '@better-auth/passkey'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError } from 'better-auth/api'
import type { Db } from '../db/client.ts'
import * as schema from '../db/schema.ts'
import { acceptInvite, findInvite } from './invites.ts'

export type AuthConfig = {
  db: Db
  baseURL: string
  secret: string
  /** Off only in tests that do not exercise it. */
  rateLimit?: boolean
}

export type Auth = ReturnType<typeof createAuth>

export const INVITE_ERROR = 'INVALID_INVITE'

/**
 * Sign-in is passkey-only and invite-only (R-17, ADR 0004). There is no email, password or social
 * sign-up endpoint. A user is created only when a valid invite is accepted with a new passkey;
 * the invite, the user, the passkey and the session are written in one transaction.
 */
export function createAuth({
  db,
  baseURL,
  secret,
  rateLimit = true,
}: AuthConfig) {
  const origin = new URL(baseURL)
  return betterAuth({
    appName: 'moneyverse',
    baseURL,
    secret,
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema,
      transaction: true,
    }),
    emailAndPassword: { enabled: false },
    verification: { storeIdentifier: 'hashed' },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    rateLimit: {
      enabled: rateLimit,
      storage: 'database',
      window: 60,
      max: 30,
      customRules: {
        '/passkey/*': { window: 60, max: 10 },
      },
    },
    advanced: {
      // Vercel sets x-forwarded-for to the client's address. A self-hosted install needs a
      // reverse proxy that does the same (R-21).
      ipAddress: { ipAddressHeaders: ['x-forwarded-for'] },
    },
    plugins: [
      passkey({
        rpID: origin.hostname,
        rpName: 'moneyverse',
        origin: origin.origin,
        authenticatorSelection: {
          residentKey: 'required',
          userVerification: 'preferred',
        },
        registration: {
          requireSession: false,
          resolveUser: async ({ ctx, context }) => {
            const invite = await findInvite(
              ctx.context.internalAdapter,
              context,
            )
            if (!invite) {
              throw new APIError('BAD_REQUEST', { message: INVITE_ERROR })
            }
            return {
              id: invite.userId,
              name: invite.email,
              displayName: invite.name,
            }
          },
          // Every passkey registration needs an invite, also for a signed-in user adding a
          // device: the invite is the only way in, so there is one path to test.
          afterVerification: async ({ ctx, context, user }) => {
            // Without createSession the plugin skips its transaction; refuse rather than
            // consume the invite outside one.
            if (ctx.body?.createSession !== true) {
              throw new APIError('BAD_REQUEST', { message: INVITE_ERROR })
            }
            const userId = await acceptInvite(
              ctx.context.internalAdapter,
              context,
              user.id,
            )
            if (!userId) {
              throw new APIError('BAD_REQUEST', { message: INVITE_ERROR })
            }
            return { userId }
          },
        },
      }),
    ],
  })
}
