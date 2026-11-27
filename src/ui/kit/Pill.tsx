import type { ReactNode } from 'react'
import styles from './Pill.module.scss'

type Props = {
  tone?: 'neutral' | 'accent' | 'positive' | 'warn' | 'negative'
  children: ReactNode
}

export function Pill({ tone = 'neutral', children }: Props) {
  return <span className={`${styles.pill} ${styles[tone]}`}>{children}</span>
}
