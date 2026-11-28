// Which database a migration may run against. The production migration once went to the local
// file because DATABASE_URL was not set in the terminal (2026-11-28); these checks make that
// mistake fail loudly instead of succeeding against the wrong database.

export type MigrationMode = 'local' | 'production'

export const LOCAL_DEFAULT_URL = 'file:.data/dev.db'

/** Returns the URL to migrate, or throws a message that says what to do instead. */
export function migrationTarget(
  mode: MigrationMode,
  env: Record<string, string | undefined>,
): { url: string; authToken: string | undefined } {
  const url = env.DATABASE_URL?.trim() || undefined
  const authToken = env.DATABASE_AUTH_TOKEN?.trim() || undefined
  if (mode === 'local') {
    if (url && !url.startsWith('file:')) {
      throw new Error(
        'DATABASE_URL points to a remote database. `pnpm db:migrate` is for the local file only; ' +
          'for production use `pnpm db:migrate:prod` (docs/runbook.md).',
      )
    }
    return { url: url ?? LOCAL_DEFAULT_URL, authToken: undefined }
  }
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set in this terminal, so nothing was migrated. Set the production ' +
        'variables first (docs/runbook.md, first deploy step 3).',
    )
  }
  if (!url.startsWith('libsql://')) {
    throw new Error(
      `DATABASE_URL is not a Turso URL (it starts with "${url.split(':')[0]}:"). ` +
        'Nothing was migrated.',
    )
  }
  if (!authToken) {
    throw new Error(
      'DATABASE_AUTH_TOKEN is not set in this terminal. Nothing was migrated.',
    )
  }
  return { url, authToken }
}

/** The tables the current schema expects, for the check after migrating. */
export const EXPECTED_TABLES = [
  'user',
  'session',
  'account',
  'verification',
  'passkey',
  'rate_limit',
  'money_account',
  'category',
  'money_transaction',
  'month_value',
  'exchange_rate',
  'exchange_rate_day',
] as const
