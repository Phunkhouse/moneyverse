'use client'

import { useActionState, useId } from 'react'
import { Banner, Button } from '@/ui/kit/index.ts'
import fieldStyles from '@/ui/kit/TextField.module.scss'
import { cs } from '@/ui/messages.ts'
import { importAction, type ImportState } from './actions.ts'
import styles from './data.module.scss'

const idle: ImportState = { status: 'idle' }

export function ImportForm() {
  const [state, action, pending] = useActionState(importAction, idle)
  const id = useId()
  return (
    <form action={action} className={styles.stack}>
      <p className={styles.muted}>{cs.data.importBody}</p>
      <div className={fieldStyles.field}>
        <label htmlFor={id} className={fieldStyles.label}>
          {cs.data.fileLabel}
        </label>
        <input
          id={id}
          name="file"
          type="file"
          accept="application/json,.json"
          required
          className={styles.file}
        />
      </div>
      {state.status === 'error' && (
        <Banner tone="error">{state.message}</Banner>
      )}
      {state.status === 'ok' && <Banner>{state.message}</Banner>}
      <Button
        type="submit"
        variant="ghost"
        busy={pending}
        className={styles.start}
      >
        {cs.data.importButton}
      </Button>
    </form>
  )
}
