import { MoneyError, type Day, type Month } from './types.ts'

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/
const MONTH = /^(\d{4})-(\d{2})$/

export function isDay(value: unknown): value is Day {
  if (typeof value !== 'string') return false
  const m = DAY.exec(value)
  if (!m) return false
  const date = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  return date.toISOString().slice(0, 10) === value
}

export function isMonth(value: unknown): value is Month {
  if (typeof value !== 'string') return false
  const m = MONTH.exec(value)
  return !!m && +m[2] >= 1 && +m[2] <= 12
}

export function assertDay(value: unknown, field: string): Day {
  if (!isDay(value))
    throw new MoneyError('INVALID', `${field} must be a YYYY-MM-DD day`)
  return value
}

export function assertMonth(value: unknown, field: string): Month {
  if (!isMonth(value))
    throw new MoneyError('INVALID', `${field} must be a YYYY-MM month`)
  return value
}

export const monthOf = (day: Day): Month => day.slice(0, 7)

export function lastDayOf(month: Month): Day {
  const [y, m] = month.split('-').map(Number)
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return `${month}-${String(last).padStart(2, '0')}`
}

export function addMonths(month: Month, count: number): Month {
  const [y, m] = month.split('-').map(Number)
  const total = y * 12 + (m - 1) + count
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`
}

export function addDays(day: Day, count: number): Day {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + count)).toISOString().slice(0, 10)
}

/** Months from `from` to `to`, both included. */
export function monthsBetween(from: Month, to: Month): Month[] {
  const months: Month[] = []
  for (let month = from; month <= to; month = addMonths(month, 1))
    months.push(month)
  return months
}

/** Today in Czech time, the app's calendar (R-25). */
export function todayInPrague(now: Date = new Date()): Day {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Prague',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}
