import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { config, proxy } from './proxy.ts'

const request = (cookie?: string) =>
  new NextRequest('http://localhost:3000/', {
    headers: cookie ? { cookie } : {},
  })

describe('proxy', () => {
  it('sends visitors without a session cookie to sign-in', () => {
    const response = proxy(request())
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/prihlaseni',
    )
  })

  it('lets a request with a session cookie through to the page, which validates it', () => {
    const response = proxy(request('better-auth.session_token=abc.def'))
    expect(response.headers.get('location')).toBeNull()
  })
})

describe('proxy matcher', () => {
  // Next compiles the matcher with path-to-regexp; for this pattern that is the same regex
  // anchored at both ends.
  const matches = (path: string) =>
    new RegExp(`^${config.matcher[0]}$`).test(path)

  it.each([
    '/',
    '/ucty',
    '/plan',
    '/dev/kit',
    '/prihlaseni-x',
    '/pozvankaXYZ',
    '/api/other',
    '/iconsX',
  ])('runs on %s', (path) => expect(matches(path)).toBe(true))

  it.each([
    '/prihlaseni',
    '/pozvanka',
    '/api/auth/get-session',
    '/_next/static/chunks/app.js',
    '/icon.svg',
    '/icons/icon-192.png',
    '/manifest.webmanifest',
  ])('skips %s', (path) => expect(matches(path)).toBe(false))
})
