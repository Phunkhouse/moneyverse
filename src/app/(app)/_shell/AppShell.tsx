import type { ReactNode } from 'react'
import { cs } from '@/ui/messages.ts'
import styles from './AppShell.module.scss'
import { Nav } from './Nav.tsx'

export const MAIN_ID = 'obsah'

/** Phone: screen above a bottom bar. From 760 px: a sidebar and the screen beside it. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <a className={styles.skip} href={`#${MAIN_ID}`}>
        {cs.shell.skipToContent}
      </a>
      <Nav />
      <div className={styles.main} id={MAIN_ID} tabIndex={-1}>
        {children}
      </div>
    </div>
  )
}
