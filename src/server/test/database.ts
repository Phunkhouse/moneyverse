import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { createAuth } from '../auth/auth.ts'
import { createDb } from '../db/client.ts'

export const TEST_BASE_URL = 'http://localhost:3000'

/** A fresh, migrated libSQL file and an auth instance on it. Call `cleanup` after the test. */
export async function createTestAuth(options: { rateLimit?: boolean } = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), 'moneyverse-test-'))
  const db = createDb(`file:${path.join(dir, 'test.db')}`)
  await migrate(db, { migrationsFolder: 'drizzle' })
  const auth = createAuth({
    db,
    baseURL: TEST_BASE_URL,
    secret: 'test-secret-that-is-at-least-32-characters-long',
    rateLimit: options.rateLimit ?? false,
  })
  const { internalAdapter } = await auth.$context
  return {
    db,
    auth,
    internalAdapter,
    cleanup: () => rm(dir, { recursive: true, force: true }),
  }
}

/** A request to the auth API as a browser on the app's origin would send it. */
export function authRequest(
  pathAndQuery: string,
  init: { method?: string; body?: unknown; ip?: string } = {},
) {
  const headers = new Headers({ origin: TEST_BASE_URL })
  if (init.body !== undefined) headers.set('content-type', 'application/json')
  if (init.ip) headers.set('x-forwarded-for', init.ip)
  return new Request(`${TEST_BASE_URL}/api/auth${pathAndQuery}`, {
    method: init.method ?? 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
}
