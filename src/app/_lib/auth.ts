import 'server-only'
import { createAuth, type Auth } from '@/server/auth/auth.ts'
import { readServerEnv } from '@/server/env.ts'
import { getDb } from './db.ts'

let auth: Auth | undefined

/** The app's Better Auth instance, created on first use so builds need no secrets. */
export function getAuth(): Auth {
  if (!auth) {
    const env = readServerEnv()
    auth = createAuth({
      db: getDb(),
      baseURL: env.baseURL,
      secret: env.authSecret,
    })
  }
  return auth
}
