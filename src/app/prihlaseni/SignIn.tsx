'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Banner } from '@/ui/kit/Banner.tsx'
import { Button } from '@/ui/kit/Button.tsx'
import { cs } from '@/ui/messages.ts'
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
      setError(cs.auth.signInFailed)
      setBusy(false)
      return
    }
    router.replace('/')
  }

  return (
    <>
      <Button size="large" block busy={busy} onClick={signIn}>
        {cs.auth.signInButton}
      </Button>
      {error && <Banner tone="error">{error}</Banner>}
    </>
  )
}
