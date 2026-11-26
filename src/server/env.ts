export type ServerEnv = {
  databaseUrl: string
  databaseAuthToken: string | undefined
  authSecret: string
  baseURL: string
}

/** Reads the server's environment. Throws on a missing or unsafe value, naming the variable only. */
export function readServerEnv(
  env: Record<string, string | undefined> = process.env,
): ServerEnv {
  const required = (name: string) => {
    const value = env[name]?.trim()
    if (!value) throw new Error(`Missing environment variable ${name}`)
    return value
  }
  const authSecret = required('BETTER_AUTH_SECRET')
  if (authSecret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must be at least 32 characters')
  }
  const baseURL = required('BETTER_AUTH_URL')
  if (!URL.canParse(baseURL)) {
    throw new Error('BETTER_AUTH_URL must be an absolute URL')
  }
  return {
    databaseUrl: required('DATABASE_URL'),
    databaseAuthToken: env.DATABASE_AUTH_TOKEN?.trim() || undefined,
    authSecret,
    baseURL,
  }
}
