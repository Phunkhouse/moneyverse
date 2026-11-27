'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/ui/kit/Button.tsx'
import { cs } from '@/ui/messages.ts'
import { authClient } from '../../_lib/auth-client.ts'

export function SignOutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  return (
    <Button
      variant="ghost"
      busy={busy}
      onClick={async () => {
        setBusy(true)
        await authClient.signOut()
        router.replace('/prihlaseni')
      }}
    >
      {cs.auth.signOut}
    </Button>
  )
}
