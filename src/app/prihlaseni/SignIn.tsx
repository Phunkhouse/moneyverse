'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { authClient } from '../_lib/auth-client.ts'

export function SignIn() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signIn() {
    if (busy) return
    setBusy(true)
    setError(null)
    const result = await authClient.signIn.passkey()
    if (result?.error) {
      setError('Přihlášení se nepovedlo. Zkuste to znovu.')
      setBusy(false)
      return
    }
    router.replace('/')
  }

  return (
    <>
      <button type="button" onClick={signIn} aria-busy={busy}>
        Přihlásit se přístupovým klíčem
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  )
}
