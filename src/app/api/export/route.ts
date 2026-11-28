import { connection } from 'next/server'
import { todayInPrague } from '@/server/money/calendar.ts'
import { exportLedger } from '@/server/money/transfer-file.ts'
import { getAuth } from '../../_lib/auth.ts'
import { getDb } from '../../_lib/db.ts'

/**
 * Downloads the signed-in user's whole ledger as JSON (R-18, AC-13). The session is checked
 * here, not only by the proxy; only that user's rows are read.
 */
export async function GET(request: Request) {
  await connection()
  const session = await getAuth().api.getSession({ headers: request.headers })
  if (!session) return new Response('Unauthorized', { status: 401 })
  const file = await exportLedger(getDb(), session.user.id)
  return new Response(JSON.stringify(file, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="moneyverse-${todayInPrague()}.json"`,
      'cache-control': 'no-store',
    },
  })
}
