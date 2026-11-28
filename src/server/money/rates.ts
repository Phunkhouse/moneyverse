// ČNB exchange rates: fetching, storing and looking up (ADR 0003, ADR 0005).
// Source, read 2026-11-27 (assumption O-12): the ČNB JSON API, documented at
// https://api.cnb.cz/cnbapi/api-docs.
//   GET https://api.cnb.cz/cnbapi/exrates/daily?date=YYYY-MM-DD&lang=EN
//     → { rates: [{ validFor, order, country, currency, amount, currencyCode, rate }] }
//     For a weekend the previous business day's list comes back, with that day in `validFor`.
//   GET https://api.cnb.cz/cnbapi/exrates/daily-year?year=YYYY
//     → { rates: [{ validFor, amount, currencyCode, rate }] }
// `rate` is CZK for `amount` units, with three decimals.
import { lt, max } from 'drizzle-orm'
import type { Db } from '../db/client.ts'
import { exchangeRate, exchangeRateDay } from '../db/schema.ts'
import type { Rate } from './arithmetic.ts'
import { addDays, isDay } from './calendar.ts'
import { MoneyError, type Currency, type Day } from './types.ts'

export const RATE_CURRENCIES = ['EUR', 'USD'] as const
type RateCurrency = (typeof RATE_CURRENCIES)[number]

const CNB_API = 'https://api.cnb.cz/cnbapi/exrates'

export type StoredRate = Rate & { validFor: Day; currency: RateCurrency }

export type RateLookup = Rate & {
  /** The ČNB list the rate comes from. */
  validFor: Day
  /** True when the day's own list was not available and the last known rate was used. */
  estimated: boolean
}

/**
 * All known rates in memory; reports load it once and convert many amounts. A rate is exact for
 * a day recorded in `exchange_rate_day`; any other day uses the latest list on or before it (or,
 * before the first list, the earliest one) and is marked estimated.
 */
export class RateBook {
  private readonly byCurrency = new Map<RateCurrency, StoredRate[]>()
  private readonly days: Map<Day, Day>

  constructor(rates: StoredRate[], days: Map<Day, Day>) {
    for (const currency of RATE_CURRENCIES) {
      this.byCurrency.set(
        currency,
        rates
          .filter((r) => r.currency === currency)
          .sort((a, b) => (a.validFor < b.validFor ? -1 : 1)),
      )
    }
    this.days = days
  }

  /** The rate for converting `currency` on `day`, or null if no rate is known at all. */
  lookup(currency: Currency, day: Day): RateLookup | null {
    if (currency === 'CZK') {
      return { amount: 1, rateMilli: 1000, validFor: day, estimated: false }
    }
    const list = this.byCurrency.get(currency) ?? []
    if (list.length === 0) return null
    const covered = this.days.get(day)
    if (covered) {
      const exact = list.find((r) => r.validFor === covered)
      if (exact) return { ...pick(exact), estimated: false }
    }
    let chosen = list[0]
    for (const rate of list) {
      if (rate.validFor <= day) chosen = rate
      else break
    }
    return { ...pick(chosen), estimated: true }
  }
}

const pick = (r: StoredRate) => ({
  amount: r.amount,
  rateMilli: r.rateMilli,
  validFor: r.validFor,
})

export async function loadRateBook(db: Db): Promise<RateBook> {
  const [rates, days] = await Promise.all([
    db.select().from(exchangeRate),
    db.select().from(exchangeRateDay),
  ])
  return new RateBook(
    rates as StoredRate[],
    new Map(days.map((d) => [d.day, d.validFor])),
  )
}

// ---- Parsing ČNB responses ----

function parseRateMilli(rate: unknown): number {
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    throw new MoneyError('INVALID', 'ČNB rate is not a positive number')
  }
  const milli = Math.round(rate * 1000)
  // ČNB publishes three decimals; anything finer means the format changed.
  if (Math.abs(rate * 1000 - milli) > 1e-6) {
    throw new MoneyError(
      'INVALID',
      `ČNB rate ${rate} has more than three decimals`,
    )
  }
  return milli
}

/** Picks EUR and USD from a ČNB `{ rates: [...] }` response and validates them. */
export function parseCnbRates(body: unknown): StoredRate[] {
  const rates = (body as { rates?: unknown })?.rates
  if (!Array.isArray(rates)) {
    throw new MoneyError('INVALID', 'ČNB response has no rates list')
  }
  const parsed: StoredRate[] = []
  for (const item of rates as Record<string, unknown>[]) {
    const currency = item?.currencyCode
    if (currency !== 'EUR' && currency !== 'USD') continue
    if (!isDay(item.validFor)) {
      throw new MoneyError('INVALID', 'ČNB rate has no valid date')
    }
    const amount = item.amount
    if (
      typeof amount !== 'number' ||
      !Number.isSafeInteger(amount) ||
      amount <= 0
    ) {
      throw new MoneyError('INVALID', 'ČNB rate has no valid amount')
    }
    parsed.push({
      validFor: item.validFor,
      currency,
      amount,
      rateMilli: parseRateMilli(item.rate),
    })
  }
  return parsed
}

export type FetchJson = (url: string) => Promise<unknown>

export const fetchJson: FetchJson = async (url) => {
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    // With at most 7 days a run, the cron stays within its 60-second limit (route maxDuration).
    signal: AbortSignal.timeout(8_000),
  })
  if (!response.ok) {
    throw new Error(`ČNB answered ${response.status} for ${url}`)
  }
  return response.json()
}

// ---- Storing ----

async function storeRates(db: Db, rates: StoredRate[]) {
  for (const rate of rates) {
    await db
      .insert(exchangeRate)
      .values(rate)
      .onConflictDoUpdate({
        target: [exchangeRate.validFor, exchangeRate.currency],
        set: { amount: rate.amount, rateMilli: rate.rateMilli },
      })
  }
}

async function storeDay(db: Db, day: Day, validFor: Day) {
  await db
    .insert(exchangeRateDay)
    .values({ day, validFor })
    .onConflictDoUpdate({ target: exchangeRateDay.day, set: { validFor } })
}

/**
 * Fetches the lists for the days not yet covered, up to `today`, and records which list applies
 * to each day. Today counts as covered only once its own list exists: before publication (or on
 * a holiday) ČNB returns an older list, and today stays estimated until the next run.
 * Run daily by the cron route; at most `maxDays` requests per run.
 */
export async function syncRates(
  db: Db,
  today: Day,
  { fetch = fetchJson, maxDays = 7 } = {},
): Promise<{ days: Day[] }> {
  const [{ last }] = await db
    .select({ last: max(exchangeRateDay.day) })
    .from(exchangeRateDay)
  let day = last ? addDays(last, 1) : addDays(today, -(maxDays - 1))
  if (day < addDays(today, -(maxDays - 1))) day = addDays(today, -(maxDays - 1))
  const covered: Day[] = []
  for (; day <= today; day = addDays(day, 1)) {
    const rates = parseCnbRates(
      await fetch(`${CNB_API}/daily?date=${day}&lang=EN`),
    )
    const validFor = commonValidFor(rates)
    if (validFor > day) {
      throw new MoneyError('INVALID', `ČNB returned ${validFor} for ${day}`)
    }
    await storeRates(db, rates)
    if (validFor === day || day < today) {
      await storeDay(db, day, validFor)
      covered.push(day)
    }
  }
  return { days: covered }
}

function commonValidFor(rates: StoredRate[]): Day {
  const currencies = new Set(rates.map((r) => r.currency))
  const dates = new Set(rates.map((r) => r.validFor))
  if (currencies.size !== RATE_CURRENCIES.length || dates.size !== 1) {
    throw new MoneyError('INVALID', 'ČNB list lacks EUR or USD')
  }
  return [...dates][0]
}

/**
 * Loads a whole year from ČNB (`pnpm rates:backfill`), and maps every day from the year's first
 * list to its last (or to `today`) onto the list valid that day.
 */
export async function backfillYear(
  db: Db,
  year: number,
  today: Day,
  { fetch = fetchJson } = {},
): Promise<{ lists: number; days: number }> {
  const rates = parseCnbRates(await fetch(`${CNB_API}/daily-year?year=${year}`))
  await storeRates(db, rates)
  const listDays = [...new Set(rates.map((r) => r.validFor))].sort()
  if (listDays.length === 0) return { lists: 0, days: 0 }
  // Days before the year's first list (1 January, a holiday) take the previous year's last list,
  // when it is stored (back-fill years in order).
  const [{ previous }] = await db
    .select({ previous: max(exchangeRate.validFor) })
    .from(exchangeRate)
    .where(lt(exchangeRate.validFor, `${year}-01-01`))
  const start = previous ? `${year}-01-01` : listDays[0]
  const end = `${year}-12-31` < today ? `${year}-12-31` : addDays(today, -1)
  let days = 0
  let index = -1
  for (let day = start; day <= end; day = addDays(day, 1)) {
    while (index + 1 < listDays.length && listDays[index + 1] <= day) index++
    await storeDay(db, day, index >= 0 ? listDays[index] : previous!)
    days++
  }
  return { lists: listDays.length, days }
}
