'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { authClient } from './_lib/auth-client.ts'

export function SignOutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      aria-busy={busy}
      onClick={async () => {
        if (busy) return
        setBusy(true)
        await authClient.signOut()
        router.replace('/prihlaseni')
      }}
    >
      Odhlásit se
    </button>
  )
}
