import { unstable_rethrow } from 'next/navigation'
import { Suspense, type ReactNode } from 'react'
import { cs } from '@/ui/messages.ts'
import styles from './AppShell.module.scss'
import { quickAddData } from '../../_lib/money.ts'
import { requireUser } from '../../_lib/session.ts'
import {
  ProvideQuickAddData,
  QuickAddProvider,
} from '../_quickadd/QuickAddProvider.tsx'
import { CurrentNav, NavBar } from './Nav.tsx'

export const MAIN_ID = 'obsah'

/** Phone: screen above a bottom bar. From 760 px: a sidebar and the screen beside it. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <QuickAddProvider>
      <div className={styles.shell}>
        <a className={styles.skip} href={`#${MAIN_ID}`}>
          {cs.shell.skipToContent}
        </a>
        <Suspense fallback={<NavBar pathname={null} />}>
          <CurrentNav />
        </Suspense>
        <div className={styles.main} id={MAIN_ID} tabIndex={-1}>
          {children}
        </div>
      </div>
      <Suspense fallback={null}>
        <QuickAddLoader />
      </Suspense>
    </QuickAddProvider>
  )
}

/**
 * Loads the signed-in user's accounts and categories for the quick add sheet. It runs on every
 * app page, so a failure here must not take the page down: the + button stays disabled and the
 * error goes to the server log (2026-11-28: a missing table broke every screen through this).
 */
async function QuickAddLoader() {
  const user = await requireUser()
  let data
  try {
    data = await quickAddData(user.id)
  } catch (error) {
    unstable_rethrow(error)
    console.error('Quick add data failed to load:', error)
    return null
  }
  return <ProvideQuickAddData data={data} />
}
