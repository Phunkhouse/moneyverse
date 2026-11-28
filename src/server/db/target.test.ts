import { describe, expect, it } from 'vitest'
import {
  LOCAL_DEFAULT_URL,
  migrationTarget,
  productionTarget,
} from './target.ts'

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

describe('productionTarget', () => {
  const fakeTurso = (calls: string[][]) => (args: string[]) => {
    calls.push(args)
    return args.includes('--url') ? turso : 'invented-token'
  }

  it('asks the Turso CLI for the URL and a one-day token when the terminal has neither', () => {
    const calls: string[][] = []
    expect(productionTarget({}, fakeTurso(calls))).toEqual({
      url: turso,
      authToken: 'invented-token',
      source: 'turso-cli',
    })
    expect(calls).toEqual([
      ['db', 'show', 'moneyverse', '--url'],
      ['db', 'tokens', 'create', 'moneyverse', '--expiration', '1d'],
    ])
  })

  it('prefers variables set in the terminal and refuses a half-set terminal', () => {
    const calls: string[][] = []
    expect(
      productionTarget(
        { DATABASE_URL: turso, DATABASE_AUTH_TOKEN: 'mine' },
        fakeTurso(calls),
      ),
    ).toEqual({ url: turso, authToken: 'mine', source: 'terminal' })
    expect(() =>
      productionTarget({ DATABASE_URL: turso }, fakeTurso(calls)),
    ).toThrow('DATABASE_AUTH_TOKEN')
    expect(() =>
      productionTarget({ DATABASE_AUTH_TOKEN: 'x' }, fakeTurso(calls)),
    ).toThrow('not set')
    expect(calls).toEqual([])
  })

  it('stops when the CLI fails or answers something unexpected', () => {
    expect(() =>
      productionTarget({}, () => {
        throw new Error('not logged in')
      }),
    ).toThrow('turso auth login')
    expect(() => productionTarget({}, () => 'file:.data/dev.db')).toThrow(
      'unexpected',
    )
  })
})
