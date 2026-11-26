'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { authClient } from '../_lib/auth-client.ts'

export function AcceptInvite() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // The token is in the fragment so it never reaches server logs. Read it once, then remove it
    // from the address bar and history.
    // An empty fragment must not overwrite a token already read: React may run this effect twice.
    const fromHash = window.location.hash.slice(1)
    if (fromHash) {
      history.replaceState(null, '', window.location.pathname)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading the URL fragment once on mount
      setToken(fromHash)
    }
    setReady(true)
  }, [])

  async function accept() {
    if (busy || !token) return
    setBusy(true)
    setError(null)
    const result = await authClient.passkey.addPasskey({
      context: token,
      createSession: true,
    })
    if (result?.error) {
      setError(
        'Přístupový klíč se nepodařilo vytvořit. Pozvánka mohla vypršet nebo už byla použita.',
      )
      setBusy(false)
      return
    }
    router.replace('/')
  }

  if (!ready) return null
  if (!token) {
    return (
      <p role="alert">
        Odkaz pozvánky je neúplný. Otevřete celý odkaz, který jste dostali.
      </p>
    )
  }
  return (
    <>
      <button type="button" onClick={accept} aria-busy={busy}>
        Vytvořit přístupový klíč
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  )
}
