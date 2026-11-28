'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import type { FormState } from '@/app/_lib/forms.ts'
import {
  Banner,
  Button,
  Card,
  Glyph,
  Row,
  RowList,
  Segmented,
  Sheet,
  TextField,
} from '@/ui/kit/index.ts'
import { PlusIcon } from '@/ui/kit/icons.tsx'
import { cs } from '@/ui/messages.ts'
import {
  createCategoryAction,
  renameCategoryAction,
  setCategoryArchivedAction,
} from './actions.ts'
import styles from './categories.module.scss'

type Kind = 'expense' | 'income'
type Category = { id: string; kind: Kind; name: string; archived: boolean }

const idle: FormState = { status: 'idle' }

export function Categories({ categories }: { categories: Category[] }) {
  const [adding, setAdding] = useState<Kind | null>(null)
  const [editing, setEditing] = useState<Category | null>(null)
  const archived = categories.filter((c) => c.archived)
  return (
    <>
      <div className={styles.toolbar}>
        <Button onClick={() => setAdding('expense')}>
          <PlusIcon />
          {cs.categories.add}
        </Button>
      </div>
      <div className={styles.columns}>
        {(['expense', 'income'] as const).map((kind) => {
          const list = categories.filter((c) => c.kind === kind && !c.archived)
          return (
            <Card
              key={kind}
              title={
                kind === 'expense'
                  ? cs.categories.expense
                  : cs.categories.income
              }
            >
              {list.length === 0 ? (
                <p className={styles.muted}>
                  {kind === 'expense'
                    ? cs.categories.emptyExpense
                    : cs.categories.emptyIncome}
                </p>
              ) : (
                <RowList>
                  {list.map((category) => (
                    <li key={category.id}>
                      <Row
                        lead={<Glyph name={category.name} seed={category.id} />}
                        title={category.name}
                        onClick={() => setEditing(category)}
                      />
                    </li>
                  ))}
                </RowList>
              )}
            </Card>
          )
        })}
      </div>
      {archived.length > 0 && (
        <Card>
          <details className={styles.archived}>
            <summary>
              {cs.common.archived} ({archived.length})
            </summary>
            <RowList>
              {archived.map((category) => (
                <li key={category.id}>
                  <Row
                    lead={<Glyph name={category.name} seed={category.id} />}
                    title={category.name}
                    meta={
                      category.kind === 'expense'
                        ? cs.categories.expense
                        : cs.categories.income
                    }
                    onClick={() => setEditing(category)}
                  />
                </li>
              ))}
            </RowList>
          </details>
        </Card>
      )}
      <Sheet
        open={adding !== null}
        onClose={() => setAdding(null)}
        title={cs.categories.addTitle}
      >
        <AddForm
          initialKind={adding ?? 'expense'}
          onDone={() => setAdding(null)}
        />
      </Sheet>
      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={cs.categories.editTitle}
      >
        {editing && (
          <EditForm category={editing} onDone={() => setEditing(null)} />
        )}
      </Sheet>
    </>
  )
}

function useDone(state: FormState, onDone: () => void) {
  useEffect(() => {
    if (state.status === 'ok') onDone()
  }, [state, onDone])
}

function AddForm({
  initialKind,
  onDone,
}: {
  initialKind: Kind
  onDone: () => void
}) {
  const [state, action, pending] = useActionState(createCategoryAction, idle)
  const [kind, setKind] = useState<Kind>(initialKind)
  useDone(state, onDone)
  return (
    <form action={action} className={styles.form} noValidate>
      <input type="hidden" name="kind" value={kind} />
      <Segmented
        label={cs.categories.kind}
        value={kind}
        onChange={setKind}
        options={[
          { value: 'expense', label: cs.categories.expense },
          { value: 'income', label: cs.categories.income },
        ]}
      />
      <TextField
        label={cs.categories.name}
        name="name"
        placeholder={cs.categories.namePlaceholder}
        defaultValue={state.status === 'error' ? state.values?.name : undefined}
        maxLength={80}
        autoComplete="off"
        data-autofocus
        error={state.status === 'error' ? state.fields?.name : undefined}
      />
      {state.status === 'error' && !state.fields && (
        <Banner tone="error">{state.message}</Banner>
      )}
      <Button type="submit" size="large" block busy={pending}>
        {cs.common.save}
      </Button>
    </form>
  )
}

function EditForm({
  category,
  onDone,
}: {
  category: Category
  onDone: () => void
}) {
  const [state, action, pending] = useActionState(renameCategoryAction, idle)
  const [archiving, startArchiving] = useTransition()
  useDone(state, onDone)
  return (
    <form action={action} className={styles.form} noValidate>
      <input type="hidden" name="id" value={category.id} />
      <TextField
        label={cs.categories.name}
        name="name"
        defaultValue={
          (state.status === 'error' ? state.values?.name : undefined) ??
          category.name
        }
        maxLength={80}
        autoComplete="off"
        error={state.status === 'error' ? state.fields?.name : undefined}
      />
      <p className={styles.muted}>
        {category.kind === 'expense'
          ? cs.categories.expense
          : cs.categories.income}
        . {cs.categories.kindFixed}
      </p>
      {state.status === 'error' && !state.fields && (
        <Banner tone="error">{state.message}</Banner>
      )}
      <Button type="submit" size="large" block busy={pending}>
        {cs.common.save}
      </Button>
      <Button
        variant="ghost"
        block
        busy={archiving}
        onClick={() =>
          startArchiving(async () => {
            await setCategoryArchivedAction(category.id, !category.archived)
            onDone()
          })
        }
      >
        {category.archived ? cs.common.unarchive : cs.common.archive}
      </Button>
    </form>
  )
}
