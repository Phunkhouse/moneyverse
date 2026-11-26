import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAuth } from './auth.ts'

export type CurrentUser = { id: string; name: string; email: string }

/**
 * The signed-in user, checked against the database on every call. Every page and server action
 * that touches a user's data starts here; the proxy's cookie check is only a redirect shortcut.
 * Call it inside a <Suspense> boundary (Cache Components).
 */
export async function requireUser(): Promise<CurrentUser> {
  // Read the request first: it makes the caller dynamic, so prerendering stops here and never
  // reaches the auth instance, which needs runtime secrets.
  const requestHeaders = await headers()
  const session = await getAuth().api.getSession({ headers: requestHeaders })
  if (!session) redirect('/prihlaseni')
  const { id, name, email } = session.user
  return { id, name, email }
}
