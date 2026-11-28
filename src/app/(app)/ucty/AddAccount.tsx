'use client'

import { useState } from 'react'
import { Button, Sheet } from '@/ui/kit/index.ts'
import { PlusIcon } from '@/ui/kit/icons.tsx'
import { cs } from '@/ui/messages.ts'
import { AccountForm } from './AccountForm.tsx'
import { createAccountAction } from './actions.ts'

export function AddAccount({
  today,
  variant = 'primary',
}: {
  today: string
  variant?: 'primary' | 'ghost'
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <PlusIcon />
        {cs.accounts.add}
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={cs.accounts.addTitle}
      >
        {/* Success redirects to the new account, which closes the sheet. */}
        <AccountForm action={createAccountAction} today={today} />
      </Sheet>
    </>
  )
}
