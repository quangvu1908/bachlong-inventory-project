'use client'

import { AppShell } from '@/components/inventory/app-shell'
import { CommandPalette } from '@/components/inventory/command-palette'
import { ShortcutsHelp } from '@/components/inventory/shortcuts-help'
import { AppFooter } from '@/components/inventory/app-footer'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell>
      {children}
      <AppFooter />
      {/* Global overlays available on all pages */}
      <CommandPalette onOpenSettings={() => {}} onOpenOperation={() => {}} />
      <ShortcutsHelp />
    </AppShell>
  )
}
