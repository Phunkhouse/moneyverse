import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Db } from '../db/client.ts'
import { exchangeRateDay } from '../db/schema.ts'
import { createTestDb } from '../test/database.ts'
import {
  backfillYear,
  loadRateBook,
  parseCnbRates,
  RateBook,
  syncRates,
  type StoredRate,
} from './rates.ts'

// Rate values are invented for the tests; the shape follows the ČNB API (read 2026-11-27).
const list = (validFor: string, eur: number, usd: number, extra = {}) => ({
  rates: [
    {
      validFor,
      order: 1,
      country: 'Austrálie',
      currency: 'dolar',
      amount: 1,
      currencyCode: 'AUD',
      rate: 14.5,
    },
    {
      validFor,
      order: 1,
      country: 'EMU',
      currency: 'euro',
      amount: 1,
      currencyCode: 'EUR',
      rate: eur,
      ...extra,
    },
    {
      validFor,
      order: 1,
      country: 'USA',
      currency: 'dolar',
      amount: 1,
      currencyCode: 'USD',
      rate: usd,
    },
  ],
})

describe('parseCnbRates', () => {
  it('keeps EUR and USD as integer thousandths', () => {
    expect(parseCnbRates(list('2026-11-26', 24.455, 22.283))).toEqual([
      { validFor: '2026-11-26', currency: 'EUR', amount: 1, rateMilli: 24_455 },
      { validFor: '2026-11-26', currency: 'USD', amount: 1, rateMilli: 22_283 },
    ])
  })

  it('rejects a changed format instead of guessing', () => {
    expect(() => parseCnbRates({})).toThrow('no rates list')
    expect(() => parseCnbRates(list('2026-11-26', 24.4551, 22.283))).toThrow(
      'three decimals',
    )
    expect(() => parseCnbRates(list('2026-11-26', -1, 22.283))).toThrow(
      'positive',
    )
    expect(() => parseCnbRates(list('26.11.2026', 24.455, 22.283))).toThrow(
      'date',
    )
    expect(() =>
      parseCnbRates(list('2026-11-26', 24.455, 22.283, { amount: 0 })),
    ).toThrow('amount')
  })
})

describe('RateBook', () => {
  const rates: StoredRate[] = [
    { validFor: '2026-11-20', currency: 'EUR', amount: 1, rateMilli: 24_000 },
    { validFor: '2026-11-23', currency: 'EUR', amount: 1, rateMilli: 24_300 },
  ]
  const days = new Map([
    ['2026-11-20', '2026-11-20'],
    ['2026-11-21', '2026-11-20'],
    ['2026-11-22', '2026-11-20'],
    ['2026-11-23', '2026-11-23'],
  ])
  const book = new RateBook(rates, days)

  it('uses the day’s own list, and Friday’s for a weekend, as exact', () => {
    expect(book.lookup('EUR', '2026-11-23')).toMatchObject({
      rateMilli: 24_300,
      estimated: false,
    })
    expect(book.lookup('EUR', '2026-11-22')).toMatchObject({
      rateMilli: 24_000,
      estimated: false,
    })
  })

  it('marks the last known rate as estimated for a day not yet covered', () => {
    expect(book.lookup('EUR', '2026-11-25')).toEqual({
      amount: 1,
      rateMilli: 24_300,
      validFor: '2026-11-23',
      estimated: true,
    })
  })

  it('falls back to the earliest list before the first one, marked', () => {
    expect(book.lookup('EUR', '2026-01-05')).toMatchObject({
      rateMilli: 24_000,
      estimated: true,
    })
  })

  it('converts CZK at 1 and knows when it has no rate at all', () => {
    expect(book.lookup('CZK', '2026-11-25')).toMatchObject({
      rateMilli: 1000,
      amount: 1,
      estimated: false,
    })
    expect(book.lookup('USD', '2026-11-25')).toBeNull()
  })
})

describe('storing rates', () => {
  let db: Db
  let cleanup: () => Promise<void>
  beforeEach(async () => ({ db, cleanup } = await createTestDb()))
  afterEach(() => cleanup())

  // A fake ČNB: Friday 2026-11-27 is the last list; the weekend returns it; Monday's list is
  // published only when `mondayPublished` is set.
  function fakeCnb(mondayPublished: boolean) {
    const requested: string[] = []
    const fetch = async (url: string) => {
      const day = new URL(url).searchParams.get('date')!
      requested.push(day)
      if (day === '2026-11-30' && mondayPublished) return list(day, 24.5, 22.5)
      if (day >= '2026-11-27') return list('2026-11-27', 24.4, 22.4)
      return list(day, 24.3, 22.3)
    }
    return { fetch, requested }
  }

  it('maps weekend days to Friday and leaves today open until its own list exists', async () => {
    const cnb = fakeCnb(false)
    const result = await syncRates(db, '2026-11-30', {
      fetch: cnb.fetch,
      maxDays: 4,
    })
    expect(cnb.requested).toEqual([
      '2026-11-27',
      '2026-11-28',
      '2026-11-29',
      '2026-11-30',
    ])
    expect(result.days).toEqual(['2026-11-27', '2026-11-28', '2026-11-29'])
    const book = await loadRateBook(db)
    expect(book.lookup('EUR', '2026-11-29')).toMatchObject({
      rateMilli: 24_400,
      estimated: false,
    })
    expect(book.lookup('EUR', '2026-11-30')).toMatchObject({
      rateMilli: 24_400,
      estimated: true,
    })
  })

  it('continues from the last covered day on the next run', async () => {
    await syncRates(db, '2026-11-30', {
      fetch: fakeCnb(false).fetch,
      maxDays: 4,
    })
    const cnb = fakeCnb(true)
    const result = await syncRates(db, '2026-11-30', {
      fetch: cnb.fetch,
      maxDays: 4,
    })
    expect(cnb.requested).toEqual(['2026-11-30'])
    expect(result.days).toEqual(['2026-11-30'])
    const book = await loadRateBook(db)
    expect(book.lookup('EUR', '2026-11-30')).toMatchObject({
      rateMilli: 24_500,
      estimated: false,
    })
  })

  it('refuses a list dated after the day asked for', async () => {
    const fetch = async () => list('2026-12-01', 24.4, 22.4)
    await expect(
      syncRates(db, '2026-11-30', { fetch, maxDays: 1 }),
    ).rejects.toThrow('returned')
  })

  it('starts a year on 1 January from the previous year’s last list', async () => {
    const year = (y: number, days: string[]) => ({
      rates: days.flatMap((validFor) => [
        {
          validFor,
          amount: 1,
          currencyCode: 'EUR',
          rate: y === 2025 ? 24.1 : 24.2,
        },
        { validFor, amount: 1, currencyCode: 'USD', rate: 21.1 },
      ]),
    })
    const fetch = async (url: string) =>
      url.endsWith('2025')
        ? year(2025, ['2025-12-31'])
        : year(2026, ['2026-01-02'])
    await backfillYear(db, 2025, '2026-01-03', { fetch })
    await backfillYear(db, 2026, '2026-01-03', { fetch })
    const book = await loadRateBook(db)
    expect(book.lookup('EUR', '2026-01-01')).toMatchObject({
      validFor: '2025-12-31',
      estimated: false,
    })
    expect(book.lookup('EUR', '2026-01-02')).toMatchObject({
      validFor: '2026-01-02',
      estimated: false,
    })
  })

  it('caps a first run at seven requests', async () => {
    const cnb = fakeCnb(true)
    await syncRates(db, '2026-11-30', { fetch: cnb.fetch })
    expect(cnb.requested).toHaveLength(7)
    expect(cnb.requested[0]).toBe('2026-11-24')
  })

  it('backfills a year and fills the days between lists', async () => {
    const fetch = async (url: string) => {
      expect(url).toContain('daily-year?year=2025')
      return {
        rates: [
          {
            validFor: '2025-12-30',
            amount: 1,
            currencyCode: 'EUR',
            rate: 24.1,
          },
          {
            validFor: '2025-12-30',
            amount: 1,
            currencyCode: 'USD',
            rate: 21.1,
          },
          {
            validFor: '2025-12-31',
            amount: 1,
            currencyCode: 'EUR',
            rate: 24.2,
          },
          {
            validFor: '2025-12-31',
            amount: 1,
            currencyCode: 'USD',
            rate: 21.2,
          },
        ],
      }
    }
    expect(await backfillYear(db, 2025, '2026-11-27', { fetch })).toEqual({
      lists: 2,
      days: 2,
    })
    const days = await db.select().from(exchangeRateDay)
    expect(days.map((d) => [d.day, d.validFor])).toEqual([
      ['2025-12-30', '2025-12-30'],
      ['2025-12-31', '2025-12-31'],
    ])
  })
})
