'use client'

import { useActionState, useEffect, useState } from 'react'
import type { FormState } from '@/app/_lib/forms.ts'
import { Banner, Button, Select, TextField } from '@/ui/kit/index.ts'
import { cs } from '@/ui/messages.ts'
import styles from './accounts.module.scss'

const TYPES = [
  'checking',
  'credit_card',
  'savings',
  'brokerage',
  'crypto',
  'managed_fund',
  'retirement',
] as const
type AccountType = (typeof TYPES)[number]
const VALUE_TRACKED = new Set<AccountType>([
  'brokerage',
  'crypto',
  'managed_fund',
  'retirement',
])

const idle: FormState = { status: 'idle' }

type Props = {
  action: (previous: FormState, formData: FormData) => Promise<FormState>
  /** Editing an existing account: type and currency are fixed. */
  account?: {
    id: string
    name: string
    type: AccountType
    currency: string
    opening: string
    openedOn: string
  }
  today: string
  onDone?: () => void
}

/** Create or edit an account. Amounts are typed in Czech form and parsed on the server. */
export function AccountForm({ action, account, today, onDone }: Props) {
  const [state, formAction, pending] = useActionState(action, idle)
  const [type, setType] = useState<AccountType>(account?.type ?? 'checking')
  const fields = state.status === 'error' ? state.fields : undefined
  const values = state.status === 'error' ? state.values : undefined

  useEffect(() => {
    if (state.status === 'ok') onDone?.()
  }, [state, onDone])

  const openingLabel =
    type === 'credit_card'
      ? cs.accounts.fields.openingDebt
      : VALUE_TRACKED.has(type)
        ? cs.accounts.fields.openingValue
        : cs.accounts.fields.opening
  const openingHint =
    type === 'credit_card'
      ? cs.accounts.fields.openingDebtHint
      : VALUE_TRACKED.has(type)
        ? cs.accounts.fields.openingValueHint
        : cs.accounts.fields.openingHint

  return (
    <form action={formAction} className={styles.form} noValidate>
      {account && <input type="hidden" name="id" value={account.id} />}
      <TextField
        label={cs.accounts.fields.name}
        name="name"
        data-autofocus
        defaultValue={values?.name ?? account?.name}
        placeholder={cs.accounts.fields.namePlaceholder}
        maxLength={80}
        required
        autoComplete="off"
        error={fields?.name}
      />
      {account ? (
        <>
          <input type="hidden" name="type" value={account.type} />
          <p className={styles.note}>
            {cs.accounts.types[account.type]} · {account.currency}.{' '}
            {cs.accounts.fields.fixedAfterCreate}
          </p>
        </>
      ) : (
        <div className={styles.pair}>
          <Select
            label={cs.accounts.fields.type}
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value as AccountType)}
            options={TYPES.map((value) => ({
              value,
              label: cs.accounts.types[value],
            }))}
          />
          <Select
            label={cs.accounts.fields.currency}
            name="currency"
            defaultValue={values?.currency ?? 'CZK'}
            options={[
              { value: 'CZK', label: 'CZK' },
              { value: 'EUR', label: 'EUR' },
              { value: 'USD', label: 'USD' },
            ]}
          />
        </div>
      )}
      <div className={styles.pair}>
        <TextField
          label={openingLabel}
          name="opening"
          inputMode="decimal"
          defaultValue={values?.opening ?? account?.opening ?? ''}
          placeholder="0"
          autoComplete="off"
          error={fields?.opening}
        />
        <TextField
          label={cs.accounts.fields.openedOn}
          name="openedOn"
          type="date"
          defaultValue={values?.openedOn ?? account?.openedOn ?? today}
          required
          error={fields?.openedOn}
        />
      </div>
      <p className={styles.note}>{openingHint}</p>
      {state.status === 'error' && !fields && (
        <Banner tone="error">{state.message}</Banner>
      )}
      <Button type="submit" size="large" block busy={pending}>
        {cs.common.save}
      </Button>
    </form>
  )
}
