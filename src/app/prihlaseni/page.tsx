import type { Metadata } from 'next'
import { SignIn } from './SignIn.tsx'

export const metadata: Metadata = { title: 'Přihlášení · moneyverse' }

export default function SignInPage() {
  return (
    <main>
      <h1>moneyverse</h1>
      <p>Přihlaste se přístupovým klíčem uloženým v tomto zařízení.</p>
      <SignIn />
      <p>Nemáte účet? Moneyverse je jen na pozvánku.</p>
    </main>
  )
}
