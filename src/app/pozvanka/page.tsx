import type { Metadata } from 'next'
import { AcceptInvite } from './AcceptInvite.tsx'

export const metadata: Metadata = { title: 'Pozvánka · moneyverse' }

export default function InvitePage() {
  return (
    <main>
      <h1>Pozvánka do moneyverse</h1>
      <p>
        Vytvořte si přístupový klíč. Uloží se v tomto zařízení (nebo ve správci
        hesel) a budete se jím přihlašovat místo hesla.
      </p>
      <AcceptInvite />
    </main>
  )
}
