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

/**
 * The navigation with the current tab marked. Reading the URL waits for the request on dynamic
 * routes such as /ucty/[id], so AppShell renders it inside <Suspense> with NavBar as fallback.
 */
export function CurrentNav() {
  return <NavBar pathname={usePathname()} />
}

/** Bottom bar with a raised add button on phones; a sidebar from 760 px. */
export function NavBar({ pathname }: { pathname: string | null }) {
  const link = (item: Item) => (
    <Link
      key={item.href}
      href={item.href}
      className={styles.link}
      aria-current={
        pathname && isCurrent(pathname, item.href) ? 'page' : undefined
      }
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
      </button>
      {/* Outside the button, so it describes the button without joining its name. */}
      <span id="nav-add-soon" hidden>
        {cs.nav.addSoon}
      </span>
      {after.map(link)}
    </nav>
  )
}
