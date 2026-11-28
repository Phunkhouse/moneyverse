'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from 'react'
import type { QuickAddData, TransactionItem } from '@/app/_lib/money.ts'
import { Sheet, Toast } from '@/ui/kit/index.ts'
import { cs } from '@/ui/messages.ts'
import { undoAction } from './actions.ts'
import { QuickAddForm } from './QuickAddForm.tsx'

/**
 * The app-wide toast. `undo` reverses the change and returns the message to show next; screens
 * that close or disappear after saving (a banner, a sheet) still get their Undo.
 */
export type Notice = { message: string; undo?: () => Promise<string> }

type Context = {
  /** Null until the user's accounts and categories have loaded. */
  data: QuickAddData | null
  setData: (data: QuickAddData) => void
  /** Opens the sheet for a new transaction, or to edit `edit`. */
  open: (edit?: TransactionItem) => void
  notify: (notice: Notice) => void
}

const QuickAddContext = createContext<Context | null>(null)

export function useQuickAdd(): Context {
  const context = useContext(QuickAddContext)
  if (!context) throw new Error('useQuickAdd outside QuickAddProvider')
  return context
}

/** Holds the quick add sheet and its toast for the whole app shell. */
export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<QuickAddData | null>(null)
  // `session` changes on every opening, so the form starts fresh with a new transaction id.
  const [session, setSession] = useState<{
    key: number
    edit?: TransactionItem
  } | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [, startUndo] = useTransition()

  const open = useCallback((edit?: TransactionItem) => {
    setNotice(null)
    setSession({ key: Date.now(), edit })
  }, [])
  const close = useCallback(() => setSession(null), [])
  const notify = useCallback((next: Notice) => setNotice(next), [])

  const undo = () => {
    const run = notice?.undo
    if (!run) return
    setNotice(null)
    startUndo(async () => setNotice({ message: await run() }))
  }

  const value = useMemo(
    () => ({ data, setData, open, notify }),
    [data, open, notify],
  )
  return (
    <QuickAddContext.Provider value={value}>
      {children}
      <Sheet
        open={session !== null}
        onClose={close}
        title={session?.edit ? cs.quickAdd.editTitle : cs.quickAdd.newTitle}
      >
        {session && data && (
          <QuickAddForm
            key={session.key}
            data={data}
            edit={session.edit}
            onSaved={({ message, undo: op }) => {
              close()
              setNotice({
                message,
                undo: async () => {
                  const result = await undoAction(op)
                  return result.status === 'ok'
                    ? cs.quickAdd.undone
                    : result.message
                },
              })
            }}
          />
        )}
      </Sheet>
      {notice && (
        <Toast
          key={notice.message + (notice.undo ? ':undo' : '')}
          message={notice.message}
          actionLabel={notice.undo ? cs.quickAdd.undo : undefined}
          onAction={undo}
          onClose={() => setNotice(null)}
        />
      )}
    </QuickAddContext.Provider>
  )
}

/** Rendered by the server inside <Suspense>: hands the loaded data to the provider. */
export function ProvideQuickAddData({ data }: { data: QuickAddData }) {
  const { setData } = useQuickAdd()
  useEffect(() => setData(data), [data, setData])
  return null
}
