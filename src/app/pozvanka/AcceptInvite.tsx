'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Banner } from '@/ui/kit/Banner.tsx'
import { Button } from '@/ui/kit/Button.tsx'
import { cs } from '@/ui/messages.ts'
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
      setError(cs.auth.inviteFailed)
      setBusy(false)
      return
    }
    router.replace('/')
  }

  if (!ready) return null
  if (!token) return <Banner tone="error">{cs.auth.inviteIncomplete}</Banner>
  return (
    <>
      <Button size="large" block busy={busy} onClick={accept}>
        {cs.auth.inviteButton}
      </Button>
      {error && <Banner tone="error">{error}</Banner>}
    </>
  )
}
