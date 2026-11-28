// Prepares the end-to-end run: a fresh migrated database, an invented user with a session (the
// passkey ceremony itself cannot run headless), and a few invented accounts and categories.
import { createHmac } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { createAuth } from '../src/server/auth/auth.ts'
import { createDb } from '../src/server/db/client.ts'
import {
  createAccount,
  createCategory,
  createTransaction,
} from '../src/server/money/ledger.ts'
import { todayInPrague } from '../src/server/money/calendar.ts'
import { E2E_DB_FILE, E2E_ENV, E2E_STATE, E2E_URL } from './env.ts'

export default async function globalSetup() {
  await mkdir('.data', { recursive: true })
  await rm(E2E_DB_FILE, { force: true })
  const db = createDb(E2E_ENV.DATABASE_URL)
  await migrate(db, { migrationsFolder: 'drizzle' })

  const auth = createAuth({
    db,
    baseURL: E2E_URL,
    secret: E2E_ENV.BETTER_AUTH_SECRET,
    rateLimit: false,
  })
  const { internalAdapter } = await auth.$context
  const user = await internalAdapter.createUser(
    {
      email: 'e2e@example.test',
      name: 'Testovací uživatel',
      emailVerified: false,
    },
    { method: 'e2e-setup' },
  )
  const session = await internalAdapter.createSession(user.id)
  // Better Auth signs the cookie as `${token}.${base64(HMAC-SHA256(secret, token))}`.
  const signature = createHmac('sha256', E2E_ENV.BETTER_AUTH_SECRET)
    .update(session.token)
    .digest('base64')
  const cookie = encodeURIComponent(`${session.token}.${signature}`)
  const check = await auth.api.getSession({
    headers: new Headers({ cookie: `better-auth.session_token=${cookie}` }),
  })
  if (!check) throw new Error('e2e session cookie is not accepted')

  const today = todayInPrague()
  const bank = await createAccount(db, user.id, {
    name: 'Běžný účet',
    type: 'checking',
    currency: 'CZK',
    openingBalanceMinor: 5_000_000,
    openedOn: '2026-01-01',
  })
  const card = await createAccount(db, user.id, {
    name: 'Karta',
    type: 'credit_card',
    currency: 'CZK',
    openedOn: '2026-01-01',
  })
  await createAccount(db, user.id, {
    name: 'Fond',
    type: 'managed_fund',
    currency: 'CZK',
    openingBalanceMinor: 1_000_000,
    openedOn: '2026-01-01',
  })
  const food = await createCategory(db, user.id, {
    kind: 'expense',
    name: 'Jídlo',
  })
  await createCategory(db, user.id, { kind: 'expense', name: 'Doprava' })
  await createCategory(db, user.id, { kind: 'income', name: 'Mzda' })
  // The card was used last, so quick add pre-fills it (AC-1).
  await createTransaction(db, user.id, crypto.randomUUID(), {
    kind: 'expense',
    date: today,
    accountId: bank.id,
    amountMinor: 5_000,
    categoryId: food.id,
    what: 'Pečivo',
  })
  // Deliberate: created_at has millisecond precision, so the pause keeps the card's entry the
  // newest and makes it the last used account that quick add pre-fills.
  await new Promise((resolve) => setTimeout(resolve, 5))
  await createTransaction(db, user.id, crypto.randomUUID(), {
    kind: 'expense',
    date: today,
    accountId: card.id,
    amountMinor: 25_000,
    categoryId: food.id,
    what: 'Oběd',
  })

  await writeFile(
    E2E_STATE,
    JSON.stringify({
      cookies: [
        {
          name: 'better-auth.session_token',
          value: cookie,
          domain: 'localhost',
          path: '/',
          expires: -1,
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
        },
      ],
      origins: [],
    }),
  )
}
