import { describe, expect, it } from 'vitest'
import { readServerEnv } from './env.ts'

const valid = {
  DATABASE_URL: 'file:.data/dev.db',
  BETTER_AUTH_SECRET: 'x'.repeat(32),
  BETTER_AUTH_URL: 'http://localhost:3000',
}

describe('readServerEnv', () => {
  it('reads a complete environment', () => {
    expect(readServerEnv(valid)).toEqual({
      databaseUrl: 'file:.data/dev.db',
      databaseAuthToken: undefined,
      authSecret: 'x'.repeat(32),
      baseURL: 'http://localhost:3000',
    })
  })

  it.each(['DATABASE_URL', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL'])(
    'names a missing %s',
    (name) => {
      expect(() => readServerEnv({ ...valid, [name]: ' ' })).toThrow(name)
    },
  )

  it('refuses a short secret without printing it', () => {
    const run = () => readServerEnv({ ...valid, BETTER_AUTH_SECRET: 'short' })
    expect(run).toThrow('at least 32 characters')
    expect(run).not.toThrow('short')
  })

  it('refuses a relative base URL', () => {
    expect(() =>
      readServerEnv({ ...valid, BETTER_AUTH_URL: 'localhost' }),
    ).toThrow('absolute URL')
  })
})
