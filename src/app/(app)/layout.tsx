'use client'

import { AppShell } from '@/components/inventory/app-shell'
import { CommandPalette } from '@/components/inventory/command-palette'
import { ShortcutsHelp } from '@/components/inventory/shortcuts-help'
import { AppFooter } from '@/components/inventory/app-footer'
import { AuthGuard } from '@/components/auth/auth-guard'
import { StoreProvider } from '@/lib/store-context'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <StoreProvider>
        <AppShell>
          {children}
          <AppFooter />
          {/* Global overlays available on all pages */}
          <CommandPalette />
          <ShortcutsHelp />
        </AppShell>
      </StoreProvider>
    </AuthGuard>
  )
}
