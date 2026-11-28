import type { Metadata } from 'next'
import { Suspense } from 'react'
import { categoriesOf } from '@/app/_lib/money.ts'
import { requireUser } from '@/app/_lib/session.ts'
import { cs } from '@/ui/messages.ts'
import { Screen } from '../_shell/Screen.tsx'
import { Categories } from './Categories.tsx'
import styles from './categories.module.scss'

export const metadata: Metadata = { title: cs.categories.title }

export default function CategoriesPage() {
  return (
    <Screen title={cs.categories.title} subtitle={cs.categories.subtitle}>
      <Suspense fallback={<p className={styles.muted}>{cs.common.loading}</p>}>
        <CategoriesData />
      </Suspense>
    </Screen>
  )
}

async function CategoriesData() {
  const user = await requireUser()
  const categories = await categoriesOf(user.id)
  return (
    <Categories
      categories={categories
        .map(({ id, kind, name, archived }) => ({ id, kind, name, archived }))
        .sort((a, b) => a.name.localeCompare(b.name, 'cs'))}
    />
  )
}
