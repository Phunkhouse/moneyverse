// Shared Czech formatters (R-25, AC-16). Every amount and date on screen goes through these;
// never build such strings by hand. Output uses the non-breaking spaces cs-CZ prescribes.

export const CURRENCIES = ['CZK', 'EUR', 'USD'] as const
export type Currency = (typeof CURRENCIES)[number]

const LOCALE = 'cs-CZ'
// Minor units per major unit; all three currencies use cents (ADR 0003).
const MINOR_DIGITS = 2

type MoneyOptions = {
  /** `auto` (default) drops ",00" for whole CZK amounts, as in the prototype; EUR and USD keep cents. */
  decimals?: 'auto' | 'always' | 'never'
  /** Show "+" before positive amounts, for income and deltas. */
  signed?: boolean
}

const moneyFormats = new Map<string, Intl.NumberFormat>()

function moneyFormat(currency: Currency, digits: number, signed: boolean) {
  const key = `${currency}:${digits}:${signed}`
  let format = moneyFormats.get(key)
  if (!format) {
    format = new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      roundingMode: 'halfExpand',
      signDisplay: signed ? 'exceptZero' : 'auto',
    })
    moneyFormats.set(key, format)
  }
  return format
}

/** Minor units as an exact decimal string ("-1234.50"), so no float ever touches the amount. */
function minorToDecimal(minor: bigint): `${number}` {
  const negative = minor < 0n
  const abs = negative ? -minor : minor
  const scale = 10n ** BigInt(MINOR_DIGITS)
  const whole = abs / scale
  const fraction = (abs % scale).toString().padStart(MINOR_DIGITS, '0')
  return `${negative ? '-' : ''}${whole}.${fraction}` as `${number}`
}

/**
 * Formats integer minor units in their currency: `formatMoney(123450, 'CZK')` → "1 234,50 Kč".
 */
export function formatMoney(
  minor: number | bigint,
  currency: Currency,
  { decimals = 'auto', signed = false }: MoneyOptions = {},
): string {
  if (typeof minor === 'number' && !Number.isSafeInteger(minor)) {
    throw new RangeError('Money must be an integer number of minor units.')
  }
  const value = BigInt(minor)
  const whole = value % 10n ** BigInt(MINOR_DIGITS) === 0n
  const digits =
    decimals === 'never' || (decimals === 'auto' && currency === 'CZK' && whole)
      ? 0
      : MINOR_DIGITS
  // Intl formats decimal strings exactly (ECMA-402 "Intl.NumberFormat v3").
  return moneyFormat(currency, digits, signed).format(minorToDecimal(value))
}

/** A calendar day as ISO `YYYY-MM-DD`; days carry no time zone. */
export type IsoDate = `${number}-${number}-${number}`

function parseIsoDate(day: IsoDate): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!match) throw new RangeError(`Not an ISO date: ${day}`)
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  )
  if (date.toISOString().slice(0, 10) !== day) {
    throw new RangeError(`Not a calendar day: ${day}`)
  }
  return date
}

const dateNumeric = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})
const dateLong = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})
const monthYear = new Intl.DateTimeFormat(LOCALE, {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

/** `2026-11-26` → "26. 11. 2026". */
export function formatDate(day: IsoDate): string {
  return dateNumeric.format(parseIsoDate(day))
}

/** `2026-11-26` → "Čtvrtek 26. listopadu", for screen subtitles. */
export function formatDayLong(day: IsoDate): string {
  const text = dateLong.format(parseIsoDate(day))
  return text.charAt(0).toLocaleUpperCase(LOCALE) + text.slice(1)
}

/** `2026-11-26` → "listopad 2026". */
export function formatMonth(day: IsoDate): string {
  return monthYear.format(parseIsoDate(day))
}

/** Today in Czech time (Europe/Prague) as an ISO day; the app is Czech only (R-25). */
export function todayInPrague(now: Date = new Date()): IsoDate {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Prague',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now) as IsoDate
}
