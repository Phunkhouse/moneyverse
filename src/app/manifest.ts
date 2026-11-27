import type { MetadataRoute } from 'next'
import { cs } from '@/ui/messages.ts'

// PWA manifest only, no service worker (offline entry is R-5, later). Icons: public/icons/,
// rendered by `pnpm icons:render`.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: cs.app.name,
    short_name: cs.app.name,
    description: cs.app.description,
    lang: 'cs',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f3f1fb',
    theme_color: '#f3f1fb',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
