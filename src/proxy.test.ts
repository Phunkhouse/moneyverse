import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { proxy } from './proxy.ts'

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
