'use client'

import { useState, useTransition } from 'react'
import type { MonthValuesData } from '@/app/_lib/money.ts'
import { formatMoney, formatMonthName } from '@/ui/format.ts'
import {
  Banner,
  Button,
  Chip,
  Chips,
  Sheet,
  TextField,
} from '@/ui/kit/index.ts'
import { cs } from '@/ui/messages.ts'
import {
  saveMonthValuesAction,
  undoMonthValuesAction,
  type ValuesUndo,
} from './actions.ts'
import { useQuickAdd } from '../_quickadd/QuickAddProvider.tsx'
import styles from './values.module.scss'

type Props = {
  data: MonthValuesData
  label?: string
  variant?: 'primary' | 'ghost'
  /** Which month the sheet opens on; last month by default (its values are due first). */
  month?: string
}

/** A button that opens the monthly values sheet (W-5, AC-6), with Undo after saving. */
export function MonthValuesButton({
  data,
  label = cs.values.enter,
  variant = 'ghost',
  month,
}: Props) {
  const [open, setOpen] = useState(false)
  const { notify } = useQuickAdd()
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title={cs.values.title}>
        <MonthValuesForm
          data={data}
          initialMonth={month ?? data.months[0]}
          onSaved={({ message, undo }) => {
            setOpen(false)
            notify({
              message,
              undo: undo
                ? async () => {
                    const result = await undoMonthValuesAction(undo)
                    return result.status === 'ok'
                      ? cs.quickAdd.undone
                      : result.message
                  }
                : undefined,
            })
          }}
        />
      </Sheet>
    </>
  )
}

function plain(minor: number) {
  // The value as the field shows it: "312 500" or "1 400,50", without the currency.
  const whole = Math.trunc(minor / 100)
  const cents = Math.abs(minor % 100)
  const grouped = new Intl.NumberFormat('cs-CZ').format(whole)
  return cents ? `${grouped},${String(cents).padStart(2, '0')}` : grouped
}

function MonthValuesForm({
  data,
  initialMonth,
  onSaved,
}: {
  data: MonthValuesData
  initialMonth: string
  onSaved: (notice: { message: string; undo?: ValuesUndo }) => void
}) {
  const [month, setMonth] = useState(initialMonth)
  const [typed, setTyped] = useState<Record<string, Record<string, string>>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (data.accounts.length === 0)
    return <p className={styles.muted}>{cs.values.none}</p>

  const monthName = formatMonthName(month)
  const accounts = data.accounts.filter((a) => a.values[month] !== undefined)
  const valueOf = (accountId: string) => typed[month]?.[accountId] ?? ''

  function save() {
    const entries = accounts.map((a) => ({
      accountId: a.id,
      value: valueOf(a.id),
    }))
    setMessage(null)
    startTransition(async () => {
      const result = await saveMonthValuesAction(month, entries)
      if (result.status === 'error') {
        setErrors(result.fields ?? {})
        setMessage(result.fields ? null : result.message)
        return
      }
      onSaved({
        message: cs.values.saved(result.saved, monthName),
        undo: result.saved > 0 ? result.undo : undefined,
      })
    })
  }

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
    >
      <p className={styles.muted}>{cs.values.intro}</p>
      <Chips label={cs.values.month}>
        {data.months.map((m) => (
          <Chip key={m} pressed={m === month} onClick={() => setMonth(m)}>
            {formatMonthName(m)}
          </Chip>
        ))}
      </Chips>
      {accounts.map((account, index) => {
        const value = account.values[month]
        const shown = formatMoney(value.shown, account.currency)
        return (
          <TextField
            key={`${month}-${account.id}`}
            label={`${account.name} (${account.currency})`}
            hint={
              value.stored !== null
                ? cs.values.stored(shown)
                : cs.values.carried(shown)
            }
            error={errors[account.id]}
            inputMode="decimal"
            autoComplete="off"
            placeholder={plain(value.shown)}
            value={valueOf(account.id)}
            onChange={(event) =>
              setTyped((all) => ({
                ...all,
                [month]: { ...all[month], [account.id]: event.target.value },
              }))
            }
            data-autofocus={index === 0 ? '' : undefined}
          />
        )
      })}
      {message && <Banner tone="error">{message}</Banner>}
      <div className={styles.foot}>
        <Button type="submit" size="large" block busy={pending}>
          {cs.values.save(monthName)}
        </Button>
      </div>
    </form>
  )
}
