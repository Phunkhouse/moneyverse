import { describe, expect, it } from 'vitest'
import { LOCAL_DEFAULT_URL, migrationTarget } from './target.ts'

// Invented URLs and tokens only.
const turso = 'libsql://example-db.turso.io'

describe('migrationTarget', () => {
  it('migrates the local file by default and refuses a remote URL locally', () => {
    expect(migrationTarget('local', {})).toEqual({
      url: LOCAL_DEFAULT_URL,
      authToken: undefined,
    })
    expect(
      migrationTarget('local', { DATABASE_URL: 'file:.data/e2e.db' }).url,
    ).toBe('file:.data/e2e.db')
    expect(() => migrationTarget('local', { DATABASE_URL: turso })).toThrow(
      'db:migrate:prod',
    )
  })

  it('refuses production without the Turso URL and token set in this terminal', () => {
    expect(() => migrationTarget('production', {})).toThrow(
      'not set in this terminal',
    )
    expect(() => migrationTarget('production', { DATABASE_URL: '  ' })).toThrow(
      'not set',
    )
    expect(() =>
      migrationTarget('production', {
        DATABASE_URL: 'file:.data/dev.db',
        DATABASE_AUTH_TOKEN: 'x',
      }),
    ).toThrow('not a Turso URL')
    expect(() =>
      migrationTarget('production', { DATABASE_URL: turso }),
    ).toThrow('DATABASE_AUTH_TOKEN')
    expect(
      migrationTarget('production', {
        DATABASE_URL: turso,
        DATABASE_AUTH_TOKEN: 'invented',
      }),
    ).toEqual({ url: turso, authToken: 'invented' })
  })
})
