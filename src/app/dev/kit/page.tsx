import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { KitGallery } from './KitGallery.tsx'

export const metadata: Metadata = { title: 'UI kit', robots: { index: false } }

/** Development only (ADR 0002): every kit component in every state. */
export default function KitPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <KitGallery />
}
