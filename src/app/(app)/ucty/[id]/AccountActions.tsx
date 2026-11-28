'use client'

import { useState, useTransition } from 'react'
import { Button, Sheet } from '@/ui/kit/index.ts'
import { cs } from '@/ui/messages.ts'
import styles from '../accounts.module.scss'
import { AccountForm } from '../AccountForm.tsx'
import { setAccountArchivedAction, updateAccountAction } from '../actions.ts'

type Props = {
  today: string
  account: {
    id: string
    name: string
    type:
      | 'checking'
      | 'credit_card'
      | 'savings'
      | 'brokerage'
      | 'crypto'
      | 'managed_fund'
      | 'retirement'
    currency: string
    opening: string
    openedOn: string
    archived: boolean
  }
}

export function AccountActions({ today, account }: Props) {
  const [editing, setEditing] = useState(false)
  const [archiving, startArchiving] = useTransition()
  return (
    <div className={styles.actions}>
      <Button variant="ghost" onClick={() => setEditing(true)}>
        {cs.common.edit}
      </Button>
      <Button
        variant="ghost"
        busy={archiving}
        onClick={() =>
          startArchiving(() =>
            setAccountArchivedAction(account.id, !account.archived),
          )
        }
      >
        {account.archived ? cs.common.unarchive : cs.common.archive}
      </Button>
      <Sheet
        open={editing}
        onClose={() => setEditing(false)}
        title={cs.accounts.editTitle}
      >
        <AccountForm
          action={updateAccountAction}
          account={account}
          today={today}
          onDone={() => setEditing(false)}
        />
      </Sheet>
    </div>
  )
}
