import { Suspense } from 'react'
import { requireUser } from './_lib/session.ts'
import { SignOutButton } from './SignOutButton.tsx'

export default function Home() {
  return (
    <main>
      <h1>moneyverse</h1>
      <Suspense fallback={<p>Načítání…</p>}>
        <SignedIn />
      </Suspense>
    </main>
  )
}

async function SignedIn() {
  const user = await requireUser()
  return (
    <>
      <p>Přihlášeno: {user.name}. Aplikace se připravuje.</p>
      <SignOutButton />
    </>
  )
}
