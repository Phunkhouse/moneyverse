'use client'

import Link from 'next/link'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from 'react'
import type { QuickAddData, TransactionItem } from '@/app/_lib/money.ts'
import { currencySymbol, formatMoney, type Currency } from '@/ui/format.ts'
import {
  applyKey,
  Banner,
  Button,
  Chip,
  Chips,
  Keypad,
  Segmented,
  TextField,
} from '@/ui/kit/index.ts'
import { cs } from '@/ui/messages.ts'
import {
  createCategoryInlineAction,
  deleteTransactionAction,
  saveTransactionAction,
  type TransactionPayload,
  type UndoOp,
} from './actions.ts'
import styles from './quickadd.module.scss'

type Kind = 'expense' | 'income' | 'transfer'

const SHOWN_CATEGORIES = 6

function addDays(day: string, count: number) {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + count)).toISOString().slice(0, 10)
}

/** Minor units as keypad text: 12950 → "129,5", 12900 → "129". */
function minorToText(minor: number) {
  const whole = Math.floor(minor / 100)
  const cents = minor % 100
  if (!cents) return String(whole)
  return `${whole},${String(cents).padStart(2, '0').replace(/0$/, '')}`
}

/** Keypad text to minor units, for the save button's label only; the server parses again. */
function textToMinor(text: string) {
  if (!text) return 0
  const [whole, fraction = ''] = text.split(',')
  return Number(whole || '0') * 100 + Number(fraction.padEnd(2, '0'))
}

type Props = {
  data: QuickAddData
  edit?: TransactionItem
  onSaved: (notice: { message: string; undo: UndoOp }) => void
}

/** The quick add sheet (W-4): keypad first, recent categories, last account and today filled in. */
export function QuickAddForm({ data, edit, onSaved }: Props) {
  const cashAccounts = data.accounts.filter((a) => !a.valueTracked)
  const defaultAccount =
    cashAccounts.find((a) => a.id === data.lastAccountId)?.id ??
    cashAccounts[0]?.id ??
    ''

  const [id] = useState(() => edit?.id ?? crypto.randomUUID())
  const [kind, setKind] = useState<Kind>(edit?.kind ?? 'expense')
  const [amount, setAmount] = useState(
    edit ? minorToText(edit.amountMinor) : '',
  )
  const [categoryId, setCategoryId] = useState<string | null>(
    edit?.categoryId ?? null,
  )
  const [accountId, setAccountId] = useState(edit?.accountId ?? defaultAccount)
  const [toAccountId, setToAccountId] = useState(
    edit?.toAccountId ??
      data.accounts.find((a) => a.id !== (edit?.accountId ?? defaultAccount))
        ?.id ??
      '',
  )
  const [toAmount, setToAmount] = useState(
    edit?.toAmountMinor ? minorToText(edit.toAmountMinor) : '',
  )
  const [date, setDate] = useState(edit?.date ?? data.today)
  const [what, setWhat] = useState(edit?.what ?? '')
  const [note, setNote] = useState(edit?.note ?? '')
  const [showAll, setShowAll] = useState(false)
  const [newCategory, setNewCategory] = useState<string | null>(null)
  const [extraCategories, setExtraCategories] = useState<
    QuickAddData['categories']
  >([])
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const categories = useMemo(() => {
    const known = new Set(data.categories.map((c) => c.id))
    return [
      ...data.categories,
      ...extraCategories.filter((c) => !known.has(c.id)),
    ].filter((c) => kind !== 'transfer' && c.kind === kind)
  }, [data.categories, extraCategories, kind])
  const selected = categories.find((c) => c.id === categoryId)
  const top = showAll ? categories : categories.slice(0, SHOWN_CATEGORIES)
  // The selected category stays visible even when it is not among the top ones.
  const shown = selected && !top.includes(selected) ? [...top, selected] : top

  const account = data.accounts.find((a) => a.id === accountId)
  const toAccount = data.accounts.find((a) => a.id === toAccountId)
  const currency: Currency = account?.currency ?? 'CZK'
  const crossCurrency =
    kind === 'transfer' && !!toAccount && toAccount.currency !== currency
  const minor = textToMinor(amount)
  const valid =
    minor > 0 &&
    !!account &&
    (kind === 'transfer'
      ? !!toAccount &&
        toAccount.id !== account.id &&
        (!crossCurrency || textToMinor(toAmount) > 0)
      : !!selected)

  const verb = edit
    ? cs.quickAdd.saveChanges
    : kind === 'transfer'
      ? cs.quickAdd.saveTransfer
      : kind === 'income'
        ? cs.quickAdd.saveIncome
        : cs.quickAdd.saveExpense

  function save() {
    if (!valid || pending) return
    const payload: TransactionPayload = {
      id,
      mode: edit ? 'update' : 'create',
      kind,
      date,
      accountId,
      amount,
      categoryId: kind === 'transfer' ? null : categoryId,
      toAccountId: kind === 'transfer' ? toAccountId : null,
      toAmount: crossCurrency ? toAmount : null,
      what,
      note,
    }
    setError(null)
    startTransition(async () => {
      const result = await saveTransactionAction(payload)
      if (result.status === 'error') return setError(result.message)
      const label =
        what.trim() ||
        (kind === 'transfer'
          ? cs.transactions.transfer
          : (selected?.name ?? ''))
      onSaved({
        message: edit
          ? cs.quickAdd.changesSaved
          : cs.quickAdd.saved(result.amount, label),
        undo: result.undo,
      })
    })
  }

  function remove() {
    if (!edit || pending) return
    startTransition(async () => {
      const result = await deleteTransactionAction(edit.id)
      if (result.status === 'error') return setError(result.message)
      onSaved({
        message: cs.quickAdd.deleted(result.amount),
        undo: result.undo,
      })
    })
  }

  function addCategory() {
    const name = newCategory?.trim()
    if (!name || kind === 'transfer') return
    startTransition(async () => {
      const result = await createCategoryInlineAction(kind, name)
      if (result.status === 'error') return setError(result.message)
      setExtraCategories((list) => [...list, result.category])
      setCategoryId(result.category.id)
      setNewCategory(null)
      setError(null)
    })
  }

  // On a computer, digits typed anywhere outside a text field go to the amount; Enter saves.
  const saveRef = useRef(save)
  useEffect(() => {
    saveRef.current = save
  })
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement
      const inField = target.matches('input, textarea, select')
      if (event.key === 'Enter') {
        // Enter on a chip just tapped still saves (prototype); other buttons keep their own Enter.
        if (
          target.matches('button:not([aria-pressed])') ||
          target.dataset.newCategory !== undefined
        )
          return
        event.preventDefault()
        saveRef.current()
        return
      }
      if (inField) return
      if (
        /^\d$/.test(event.key) ||
        [',', '.', 'Backspace'].includes(event.key)
      ) {
        event.preventDefault()
        setAmount((current) => applyKey(current, event.key))
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  if (cashAccounts.length === 0) {
    return (
      <div className={styles.form}>
        <p>{cs.quickAdd.noAccounts}</p>
        <Link href="/ucty">{cs.quickAdd.goToAccounts}</Link>
      </div>
    )
  }

  const yesterday = addDays(data.today, -1)
  return (
    <div className={styles.form}>
      <div className={styles.kind}>
        <Segmented
          label={cs.quickAdd.kind}
          value={kind}
          onChange={(next) => {
            setKind(next)
            if (next !== 'transfer' && selected && selected.kind !== next)
              setCategoryId(null)
          }}
          options={[
            { value: 'expense', label: cs.quickAdd.expense },
            { value: 'income', label: cs.quickAdd.income },
            { value: 'transfer', label: cs.quickAdd.transfer },
          ]}
        />
      </div>

      {/* Read out as it changes; not a status role, which the toast uses. */}
      <p
        className={`${styles.amount} ${kind === 'income' ? styles.income : ''}`}
        aria-live="polite"
      >
        <span className="sr-only">{cs.quickAdd.amount}: </span>
        <span className={`num ${styles.digits}`}>{amount || '0'}</span>
        <span className={styles.currency}>{currencySymbol(currency)}</span>
      </p>

      <Keypad
        onKey={(key) => setAmount((current) => applyKey(current, key))}
        labels={{
          backspace: cs.quickAdd.backspace,
          decimal: cs.quickAdd.decimal,
        }}
      />

      {kind === 'transfer' ? (
        <>
          <Field label={cs.quickAdd.fromAccount}>
            <Chips label={cs.quickAdd.fromAccount}>
              {cashAccounts.map((a) => (
                <Chip
                  key={a.id}
                  pressed={a.id === accountId}
                  tag={a.currency !== 'CZK' ? a.currency : undefined}
                  onClick={() => setAccountId(a.id)}
                >
                  {a.name}
                </Chip>
              ))}
            </Chips>
          </Field>
          <Field label={cs.quickAdd.toAccount}>
            <Chips label={cs.quickAdd.toAccount}>
              {data.accounts.map((a) => (
                <Chip
                  key={a.id}
                  pressed={a.id === toAccountId}
                  tag={a.currency !== 'CZK' ? a.currency : undefined}
                  onClick={() => setToAccountId(a.id)}
                >
                  {a.name}
                </Chip>
              ))}
            </Chips>
            {toAccountId === accountId && (
              <p className={styles.warn}>{cs.quickAdd.sameAccount}</p>
            )}
          </Field>
          {crossCurrency && toAccount && (
            <TextField
              label={cs.quickAdd.toAmount(toAccount.currency)}
              hint={cs.quickAdd.toAmountHint}
              inputMode="decimal"
              value={toAmount}
              onChange={(event) =>
                setToAmount(event.target.value.replace('.', ','))
              }
              autoComplete="off"
            />
          )}
        </>
      ) : (
        <>
          <Field label={cs.quickAdd.category}>
            <Chips label={cs.quickAdd.category}>
              {shown.map((c) => (
                <Chip
                  key={c.id}
                  pressed={c.id === categoryId}
                  onClick={() => setCategoryId(c.id)}
                >
                  {c.name}
                </Chip>
              ))}
              {!showAll && categories.length > SHOWN_CATEGORIES && (
                <Chip onClick={() => setShowAll(true)}>
                  {cs.quickAdd.moreCategories}
                </Chip>
              )}
              {newCategory === null && (
                <Chip onClick={() => setNewCategory('')}>
                  {cs.quickAdd.newCategory}
                </Chip>
              )}
            </Chips>
            {categories.length === 0 && newCategory === null && (
              <p className={styles.muted}>{cs.quickAdd.noCategories}</p>
            )}
            {newCategory !== null && (
              <div className={styles.inline}>
                <TextField
                  label={cs.quickAdd.newCategoryName}
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addCategory()
                    }
                  }}
                  data-new-category=""
                  maxLength={80}
                  autoComplete="off"
                  autoFocus
                />
                <Button variant="ghost" onClick={addCategory} busy={pending}>
                  {cs.quickAdd.addCategory}
                </Button>
              </div>
            )}
          </Field>
          <Field label={cs.quickAdd.account}>
            <Chips label={cs.quickAdd.account}>
              {cashAccounts.map((a) => (
                <Chip
                  key={a.id}
                  pressed={a.id === accountId}
                  tag={a.currency !== 'CZK' ? a.currency : undefined}
                  onClick={() => setAccountId(a.id)}
                >
                  {a.name}
                </Chip>
              ))}
            </Chips>
          </Field>
        </>
      )}

      <Field label={cs.quickAdd.date}>
        <Chips label={cs.quickAdd.date}>
          <Chip
            pressed={date === data.today}
            onClick={() => setDate(data.today)}
          >
            {cs.quickAdd.today}
          </Chip>
          <Chip pressed={date === yesterday} onClick={() => setDate(yesterday)}>
            {cs.quickAdd.yesterday}
          </Chip>
          <input
            type="date"
            className={styles.date}
            value={date}
            max={data.today}
            aria-label={cs.quickAdd.pickDate}
            onChange={(event) =>
              event.target.value && setDate(event.target.value)
            }
          />
        </Chips>
      </Field>

      <TextField
        label={cs.quickAdd.what}
        placeholder={cs.quickAdd.whatPlaceholder}
        value={what}
        onChange={(event) => setWhat(event.target.value)}
        maxLength={500}
        autoComplete="off"
      />
      <TextField
        label={cs.quickAdd.note}
        placeholder={cs.quickAdd.notePlaceholder}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={500}
        autoComplete="off"
      />

      {error && <Banner tone="error">{error}</Banner>}

      <div className={styles.foot}>
        {edit && (
          <Button variant="danger" onClick={remove} disabled={pending}>
            {cs.quickAdd.delete}
          </Button>
        )}
        <Button
          size="large"
          block
          onClick={save}
          disabled={!valid}
          busy={pending}
        >
          {verb}
          {minor > 0 && ` · ${formatMoney(minor, currency)}`}
        </Button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <span className={styles.label} aria-hidden="true">
        {label}
      </span>
      {children}
    </div>
  )
}
