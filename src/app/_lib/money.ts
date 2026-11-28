import 'server-only'
import { todayInPrague, monthOf } from '@/server/money/calendar.ts'
import { listCategories } from '@/server/money/ledger.ts'
import { monthEndBalances } from '@/server/money/reports.ts'
import { getDb } from './db.ts'

/**
 * Every account of the user with today's balance in its own currency and in CZK. The caller has
 * already called requireUser(); `userId` comes from it, never from the request.
 */
export async function accountsWithBalances(userId: string) {
  const today = todayInPrague()
  const month = monthOf(today)
  const series = await monthEndBalances(getDb(), userId, {
    from: month,
    to: month,
    today,
  })
  return series.map(({ account, months }) => ({
    account,
    // Accounts opened later than today have no balance yet; show their opening balance.
    balance: months[0] ?? {
      month,
      minor: account.openingBalanceMinor,
      czk: null,
      carried: false,
      estimated: false,
    },
  }))
}

export async function categoriesOf(userId: string) {
  return listCategories(getDb(), userId)
}

export { todayInPrague }
