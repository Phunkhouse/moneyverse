'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { Brand } from '@/ui/brand/Brand.tsx'
import {
  AccountsIcon,
  ChartsIcon,
  HomeIcon,
  PlanIcon,
  PlusIcon,
} from '@/ui/kit/icons.tsx'
import { cs } from '@/ui/messages.ts'
import styles from './Nav.module.scss'

type Item = { href: string; label: string; icon: ReactNode }

const before: Item[] = [
  { href: '/', label: cs.nav.overview, icon: <HomeIcon /> },
  { href: '/ucty', label: cs.nav.accounts, icon: <AccountsIcon /> },
]
const after: Item[] = [
  { href: '/plan', label: cs.nav.plan, icon: <PlanIcon /> },
  { href: '/grafy', label: cs.nav.charts, icon: <ChartsIcon /> },
]

function isCurrent(pathname: string, href: string) {
  return href === '/'
    ? pathname === '/'
    : pathname === href || pathname.startsWith(`${href}/`)
}

/** Bottom bar with a raised add button on phones; a sidebar from 760 px. */
export function Nav() {
  const pathname = usePathname()
  const link = (item: Item) => (
    <Link
      key={item.href}
      href={item.href}
      className={styles.link}
      aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}
    >
      {item.icon}
      {item.label}
    </Link>
  )
  return (
    <nav className={styles.nav} aria-label={cs.nav.label}>
      <div className={styles.brand}>
        <Brand />
      </div>
      {before.map(link)}
      <button
        type="button"
        className={styles.add}
        aria-disabled="true"
        aria-describedby="nav-add-soon"
        title={cs.nav.addSoon}
      >
        <PlusIcon />
        <span className={styles.addLabel}>{cs.nav.add}</span>
        <span id="nav-add-soon" hidden>
          {cs.nav.addSoon}
        </span>
      </button>
      {after.map(link)}
    </nav>
  )
}
