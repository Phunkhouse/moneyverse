import { AppShell } from './_shell/AppShell.tsx'

export default function AppLayout({ children }: LayoutProps<'/'>) {
  return <AppShell>{children}</AppShell>
}
