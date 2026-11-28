import type { Metadata } from 'next'
import buttonStyles from '@/ui/kit/Button.module.scss'
import { Card } from '@/ui/kit/index.ts'
import { cs } from '@/ui/messages.ts'
import { Screen } from '../_shell/Screen.tsx'
import styles from './data.module.scss'
import { ImportForm } from './ImportForm.tsx'

export const metadata: Metadata = { title: cs.data.title }

// The import action runs here; a large file may take a while against Turso.
export const maxDuration = 60

// Static: the download route and the import action each check the session themselves.
export default function DataPage() {
  return (
    <Screen title={cs.data.title} subtitle={cs.data.subtitle}>
      <Card title={cs.data.exportTitle}>
        <div className={styles.stack}>
          <p className={styles.muted}>{cs.data.exportBody}</p>
          <a
            href="/api/export"
            download
            className={`${buttonStyles.button} ${buttonStyles.primary} ${styles.start}`}
          >
            {cs.data.exportButton}
          </a>
        </div>
      </Card>
      <Card title={cs.data.importTitle}>
        <ImportForm />
      </Card>
    </Screen>
  )
}
