import type { ReactNode } from 'react'
import { Brand } from '@/ui/brand/Brand.tsx'
import { Card } from '@/ui/kit/Card.tsx'
import styles from './AuthPanel.module.scss'

type Props = {
  title: string
  lead: string
  foot?: ReactNode
  children: ReactNode
}

/** The centred card for sign-in and invites, outside the app shell. */
export function AuthPanel({ title, lead, foot, children }: Props) {
  return (
    <main className={styles.page}>
      <div className={styles.panel}>
        <Brand />
        <Card className={styles.card}>
          <h1>{title}</h1>
          <p className={styles.lead}>{lead}</p>
          {children}
        </Card>
        {foot && <p className={styles.foot}>{foot}</p>}
      </div>
    </main>
  )
}
