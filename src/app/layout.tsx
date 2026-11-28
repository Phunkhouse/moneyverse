import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Sora } from 'next/font/google'
import { cs } from '@/ui/messages.ts'
import { themeScript } from '@/ui/theme.ts'
import './globals.scss'

// Self-hosted at build time by next/font; latin-ext carries the Czech letters.
const sora = Sora({
  subsets: ['latin', 'latin-ext'],
  weight: ['500', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
})
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: cs.app.name, template: `%s · ${cs.app.name}` },
  description: cs.app.description,
  applicationName: cs.app.name,
  appleWebApp: { capable: true, title: cs.app.name, statusBarStyle: 'default' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f1fb' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0918' },
  ],
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="cs"
      className={`${sora.variable} ${jakarta.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Applies the saved theme before the first paint; see src/ui/theme.ts. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
