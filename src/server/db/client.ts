import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema.ts'

export type Db = ReturnType<typeof createDb>

/**
 * Opens the database. `url` is a Turso `libsql://` URL in production and a `file:` path locally and
 * in tests. In-memory databases are not supported: libSQL opens a new connection per transaction.
 */
export function createDb(url: string, authToken?: string) {
  if (url.includes(':memory:')) {
    throw new Error('In-memory databases are not supported; use a file: URL')
  }
  const client = createClient({ url, authToken: authToken || undefined })
  return drizzle(client, { schema })
}
