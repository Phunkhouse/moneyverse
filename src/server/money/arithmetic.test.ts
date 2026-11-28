import { describe, expect, it } from 'vitest'
import { divideRounded, fromCzk, toCzk } from './arithmetic.ts'
import {
  addDays,
  addMonths,
  isDay,
  isMonth,
  lastDayOf,
  todayInPrague,
} from './calendar.ts'

describe('divideRounded', () => {
  it.each([
    [5n, 2n, 3n],
    [-5n, 2n, -3n],
    [5n, -2n, -3n],
    [7n, 2n, 4n],
    [1n, 3n, 0n],
    [2n, 3n, 1n],
    [-2n, 3n, -1n],
    [4n, 2n, 2n],
    [0n, 7n, 0n],
  ])('%i / %i rounds half away from zero to %i', (n, d, expected) => {
    expect(divideRounded(n, d)).toBe(expected)
  })

  it('refuses division by zero', () => {
    expect(() => divideRounded(1n, 0n)).toThrow(RangeError)
  })
})

describe('conversion', () => {
  const eur = { amount: 1, rateMilli: 24_455 } // 24,455 Kč za 1 EUR

  it('converts cents to haléře at the rate, rounding once', () => {
    // 10,01 EUR × 24,455 = 244,79455 Kč → 244,79 Kč
    expect(toCzk(1001, eur)).toBe(24_479)
    expect(toCzk(-1001, eur)).toBe(-24_479)
  })

  it('rounds an exact half away from zero', () => {
    const rate = { amount: 1, rateMilli: 25_250 }
    // 0,02 EUR × 25,25 = 0,505 Kč
    expect(toCzk(2, rate)).toBe(51)
    expect(toCzk(-2, rate)).toBe(-51)
  })

  it('honours the amount a rate is quoted for', () => {
    // 100 units for 15,123 Kč: 250,00 units → 37,8075 Kč → 37,81 Kč
    expect(toCzk(25_000, { amount: 100, rateMilli: 15_123 })).toBe(3_781)
  })

  it('converts CZK totals back to the display currency', () => {
    // 2 445,50 Kč / 24,455 = 100,00 EUR
    expect(fromCzk(244_550, eur)).toBe(10_000)
    // 1 Kč / 24,455 = 0,0409 EUR → 0,04 EUR
    expect(fromCzk(100, eur)).toBe(4)
  })

  it('stays exact for amounts whose product exceeds the float range', () => {
    // 90 billion EUR in cents times the rate is beyond 2^53 before the division.
    expect(toCzk(9_000_000_000_000, eur)).toBe(220_095_000_000_000)
  })
})

describe('calendar', () => {
  it('knows month lengths and leap years', () => {
    expect(lastDayOf('2026-02')).toBe('2026-02-28')
    expect(lastDayOf('2028-02')).toBe('2028-02-29')
    expect(lastDayOf('2026-12')).toBe('2026-12-31')
  })

  it('moves across year ends', () => {
    expect(addMonths('2026-11', 2)).toBe('2027-01')
    expect(addMonths('2027-01', -1)).toBe('2026-12')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('validates days and months', () => {
    expect(isDay('2026-02-29')).toBe(false)
    expect(isDay('2026-11-27')).toBe(true)
    expect(isMonth('2026-13')).toBe(false)
    expect(isMonth('2026-11')).toBe(true)
  })

  it('takes today from Czech time', () => {
    expect(todayInPrague(new Date('2026-11-26T23:30:00Z'))).toBe('2026-11-27')
  })
})
