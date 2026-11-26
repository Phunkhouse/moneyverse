import 'server-only'
import { createAuth, type Auth } from '@/server/auth/auth.ts'
import { createDb } from '@/server/db/client.ts'
import { readServerEnv } from '@/server/env.ts'

let auth: Auth | undefined

/** The app's Better Auth instance, created on first use so builds need no secrets. */
export function getAuth(): Auth {
  if (!auth) {
    const env = readServerEnv()
    auth = createAuth({
      db: createDb(env.databaseUrl, env.databaseAuthToken),
      baseURL: env.baseURL,
      secret: env.authSecret,
    })
  }
  return auth
}
