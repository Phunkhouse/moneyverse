import { timingSafeEqual } from 'node:crypto'
import { connection } from 'next/server'
import { todayInPrague } from '@/server/money/calendar.ts'
import { syncRates } from '@/server/money/rates.ts'
import { getDb } from '../../../_lib/db.ts'

/**
 * Daily ČNB rates, called by Vercel Cron (vercel.json) with `Authorization: Bearer $CRON_SECRET`.
 * Safe to run twice: rates are upserted. Public data only; returns no user data.
 */
export async function GET(request: Request) {
  await connection()
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return new Response('Cron is not configured', { status: 503 })
  if (!matches(request.headers.get('authorization'), `Bearer ${secret}`)) {
    return new Response('Unauthorized', { status: 401 })
  }
  try {
    const result = await syncRates(getDb(), todayInPrague())
    return Response.json({ covered: result.days })
  } catch (error) {
    console.error(
      'ČNB rate sync failed:',
      error instanceof Error ? error.message : error,
    )
    return new Response('Rate sync failed', { status: 502 })
  }
}

function matches(given: string | null, expected: string) {
  const a = Buffer.from(given ?? '')
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
