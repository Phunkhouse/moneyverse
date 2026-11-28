// Environment for the end-to-end tests: a separate database file and a test-only secret.
// Never production values. Invented data only (public repository).
export const E2E_PORT = 3100
export const E2E_URL = `http://localhost:${E2E_PORT}`
export const E2E_DB_FILE = '.data/e2e.db'
export const E2E_STATE = '.data/e2e-state.json'
/** A second invented user with an empty ledger, for importing an export (AC-13). */
export const E2E_STATE_EMPTY = '.data/e2e-state-empty.json'
export const E2E_ENV = {
  DATABASE_URL: `file:${E2E_DB_FILE}`,
  DATABASE_AUTH_TOKEN: '',
  BETTER_AUTH_SECRET: 'e2e-only-secret-not-used-anywhere-else-0123456789',
  BETTER_AUTH_URL: E2E_URL,
}
