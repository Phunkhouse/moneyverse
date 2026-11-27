import type { ReactNode } from 'react'
import styles from './Screen.module.scss'
import { ThemeToggle } from './ThemeToggle.tsx'

type Props = {
  title: string
  subtitle?: ReactNode
  /** Extra top bar buttons, shown before the theme toggle. */
  actions?: ReactNode
  children: ReactNode
}

/** A screen inside the app shell: the top bar with its title, then the content. */
export function Screen({ title, subtitle, actions, children }: Props) {
  return (
    <>
      <header className={styles.top}>
        <div className={styles.titles}>
          <h1>{title}</h1>
          {subtitle && <div className={styles.sub}>{subtitle}</div>}
        </div>
        <div className={styles.actions}>
          {actions}
          <ThemeToggle />
        </div>
      </header>
      <main className={styles.body}>{children}</main>
    </>
  )
}
