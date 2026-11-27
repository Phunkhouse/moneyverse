// Operator script: loads ČNB rates for whole years, for conversions of past entries.
//
//   pnpm rates:backfill --year 2025 [--year 2026]
//
// Reads DATABASE_URL and DATABASE_AUTH_TOKEN from the environment or .env.local. Against
// production, only the owner runs it (docs/runbook.md). Safe to repeat: rates are upserted.
import { parseArgs } from 'node:util'
import { createDb } from '../src/server/db/client.ts'
import { todayInPrague } from '../src/server/money/calendar.ts'
import { backfillYear } from '../src/server/money/rates.ts'

const { values } = parseArgs({
  options: { year: { type: 'string', multiple: true } },
})
const years = (values.year ?? []).map(Number)
const today = todayInPrague()
const thisYear = Number(today.slice(0, 4))
if (
  years.length === 0 ||
  years.some((y) => !Number.isInteger(y) || y < 1991 || y > thisYear)
) {
  console.error(
    `Usage: pnpm rates:backfill --year <1991..${thisYear}> [--year ...]`,
  )
  process.exit(2)
}
const url = process.env.DATABASE_URL?.trim()
if (!url) {
  console.error('Missing environment variable DATABASE_URL')
  process.exit(2)
}
const db = createDb(url, process.env.DATABASE_AUTH_TOKEN)
for (const year of years.sort()) {
  const result = await backfillYear(db, year, today)
  console.log(`${year}: ${result.lists} ČNB lists, ${result.days} days covered`)
}
