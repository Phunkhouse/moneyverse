import 'server-only'
import { createDb, type Db } from '@/server/db/client.ts'
import { readServerEnv } from '@/server/env.ts'

let db: Db | undefined

/** The app's database, opened on first use so builds need no secrets. */
export function getDb(): Db {
  if (!db) {
    const env = readServerEnv()
    db = createDb(env.databaseUrl, env.databaseAuthToken)
  }
  return db
}
