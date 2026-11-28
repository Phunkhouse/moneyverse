import { describe, expect, it } from 'vitest'
import { CURRENCIES as SERVER_CURRENCIES } from '../server/money/types.ts'
import {
  CURRENCIES,
  currencySymbol,
  formatAmount,
  formatDate,
  formatDayLong,
  formatDayShort,
  formatMonthName,
  formatMoney,
  formatMonth,
  todayInPrague,
} from './format.ts'

// cs-CZ separates thousands and the currency with non-breaking spaces; compare with plain ones.
const plain = (text: string) => text.replace(/[  ]/g, ' ')

describe('formatMoney', () => {
  it.each([
    [123450, 'CZK', '1 234,50 Kč'],
    [123400, 'CZK', '1 234 Kč'],
    [5, 'CZK', '0,05 Kč'],
    [0, 'CZK', '0 Kč'],
    [-250000, 'CZK', '-2 500 Kč'],
    [123400, 'EUR', '1 234,00 €'],
    [-199, 'USD', '-1,99 US$'],
    [123456789012, 'CZK', '1 234 567 890,12 Kč'],
  ] as const)('%i minor units of %s is %s', (minor, currency, expected) => {
    expect(plain(formatMoney(minor, currency))).toBe(expected)
  })

  it('formats amounts beyond the float range exactly from bigint', () => {
    expect(plain(formatMoney(900719925474099312n, 'CZK'))).toBe(
      '9 007 199 254 740 993,12 Kč',
    )
  })

  it('uses the non-breaking spaces cs-CZ prescribes', () => {
    expect(formatMoney(123450, 'CZK')).toMatch(/^1 234,50 Kč$/)
  })

  it('can always show cents, never show them, or sign the amount', () => {
    expect(plain(formatMoney(123400, 'CZK', { decimals: 'always' }))).toBe(
      '1 234,00 Kč',
    )
    expect(plain(formatMoney(123450, 'CZK', { decimals: 'never' }))).toBe(
      '1 235 Kč',
    )
    expect(plain(formatMoney(123449, 'CZK', { decimals: 'never' }))).toBe(
      '1 234 Kč',
    )
    expect(plain(formatMoney(5000, 'CZK', { signed: true }))).toBe('+50 Kč')
    expect(plain(formatMoney(-5000, 'CZK', { signed: true }))).toBe('-50 Kč')
    expect(plain(formatMoney(0, 'CZK', { signed: true }))).toBe('0 Kč')
  })

  it('rejects amounts that are not whole minor units', () => {
    expect(() => formatMoney(12.5, 'CZK')).toThrow(RangeError)
    expect(() => formatMoney(Number.MAX_SAFE_INTEGER + 1, 'CZK')).toThrow(
      RangeError,
    )
  })
})

describe('formatAmount', () => {
  it('shows a field value without the currency', () => {
    expect(plain(formatAmount(31_250_000))).toBe('312 500')
    expect(plain(formatAmount(140_050))).toBe('1 400,50')
    expect(plain(formatAmount(-5))).toBe('-0,05')
    expect(plain(formatAmount(0))).toBe('0')
  })
})

describe('dates', () => {
  it('formats a day as 26. 11. 2026', () => {
    expect(plain(formatDate('2026-11-26'))).toBe('26. 11. 2026')
    expect(plain(formatDate('2027-01-05'))).toBe('5. 1. 2027')
  })

  it('formats long days and months in Czech', () => {
    expect(formatDayLong('2026-11-26')).toBe('Čtvrtek 26. listopadu')
    expect(formatMonth('2026-11-26')).toBe('listopad 2026')
    expect(plain(formatDayShort('2026-11-26'))).toBe('čt 26. listopadu')
    expect(formatMonthName('2026-10')).toBe('Říjen')
  })

  it('rejects days that do not exist', () => {
    expect(() => formatDate('2026-02-30')).toThrow(RangeError)
    expect(() => formatDate('26.11.2026' as never)).toThrow(RangeError)
  })

  it('takes today from Czech time, not UTC', () => {
    // 23:30 UTC on 26 November is already 27 November in Prague (CET, UTC+1).
    expect(todayInPrague(new Date('2026-11-26T23:30:00Z'))).toBe('2026-11-27')
    // 21:30 UTC on 30 June is 23:30 in Prague (CEST, UTC+2): still the 30th.
    expect(todayInPrague(new Date('2026-06-30T21:30:00Z'))).toBe('2026-06-30')
  })
})

describe('currencies', () => {
  it('shows the same symbols as formatMoney', () => {
    for (const currency of CURRENCIES) {
      expect(plain(formatMoney(100, currency))).toContain(
        currencySymbol(currency),
      )
    }
  })

  it('matches the money rules in src/server', () => {
    expect([...CURRENCIES]).toEqual([...SERVER_CURRENCIES])
  })
})
