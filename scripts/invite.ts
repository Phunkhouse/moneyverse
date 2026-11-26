// Operator script: creates a single-use invite and prints its link once.
//
//   pnpm invite:create --email jana@example.test --name "Jana"
//   pnpm invite:create --email jana@example.test --existing   (new passkey for an existing user)
//
// Reads DATABASE_URL, DATABASE_AUTH_TOKEN, BETTER_AUTH_SECRET and BETTER_AUTH_URL from the
// environment or .env.local. Against production, only the owner runs it (docs/runbook.md).
import { parseArgs } from 'node:util'
import { createAuth } from '../src/server/auth/auth.ts'
import { createInvite, normalizeEmail } from '../src/server/auth/invites.ts'
import { createDb } from '../src/server/db/client.ts'
import { readServerEnv } from '../src/server/env.ts'

const { values } = parseArgs({
  options: {
    email: { type: 'string' },
    name: { type: 'string' },
    existing: { type: 'boolean', default: false },
  },
})

if (!values.email) {
  console.error(
    'Usage: pnpm invite:create --email <email> [--name <name> | --existing]',
  )
  process.exit(2)
}

const env = readServerEnv()
const auth = createAuth({
  db: createDb(env.databaseUrl, env.databaseAuthToken),
  baseURL: env.baseURL,
  secret: env.authSecret,
})
const { internalAdapter } = await auth.$context
const email = normalizeEmail(values.email)
const existing = await internalAdapter.findUserByEmail(email)

if (values.existing && !existing) {
  console.error('No user with that email.')
  process.exit(1)
}
if (!values.existing && existing) {
  console.error(
    'A user with that email exists. Use --existing to add a passkey.',
  )
  process.exit(1)
}
if (!values.existing && !values.name) {
  console.error('--name is required for a new user.')
  process.exit(2)
}

const { token, expiresAt } = await createInvite(internalAdapter, {
  email,
  name: existing?.user.name ?? values.name ?? '',
  existingUserId: existing?.user.id,
})

// The token travels in the URL fragment, which browsers never send to the server.
console.log(`Invite link (single use, valid until ${expiresAt.toISOString()}):`)
console.log(`${new URL('/pozvanka', env.baseURL)}#${token}`)
