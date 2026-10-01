'use client'

import * as React from 'react'
import { AppHeader } from '@/components/inventory/app-header'
import { InventoryFlow } from '@/components/inventory/inventory-flow'
import { OperationsGrid } from '@/components/inventory/operations-grid'
import { DashboardSection } from '@/components/inventory/dashboard-section'
import { MaterialManagement } from '@/components/inventory/material-management'
import { AlertsPanel } from '@/components/inventory/alerts-panel'
import {
  SettingsOverview,
  SettingsSheet,
} from '@/components/inventory/settings-panel'
import {
  OperationDialogs,
  type ActiveOp,
  type ReceiptPrefill,
} from '@/components/inventory/operation-dialogs'
import { CommandPalette } from '@/components/inventory/command-palette'
import { ShortcutsHelp } from '@/components/inventory/shortcuts-help'
import { TransactionHistory } from '@/components/inventory/transaction-history'
import { ReportsSection } from '@/components/inventory/reports-section'
import { AppFooter } from '@/components/inventory/app-footer'
import { useInventoryStats } from '@/lib/inventory-stats'
import { inventoryOperations, type InventoryOperation } from '@/lib/inventory-data'

export default function Home() {
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [activeOp, setActiveOp] = React.useState<ActiveOp>(null)
  const [prefill, setPrefill] = React.useState<ReceiptPrefill | null>(null)

  const stats = useInventoryStats()

  const openOperation = (op: InventoryOperation, pf?: ReceiptPrefill) => {
    setPrefill(pf ?? null)
    setActiveOp(op)
  }

  const openOperationById = (opId: string) => {
    const op = inventoryOperations.find((o) => o.id === opId)
    if (op) openOperation(op)
  }

  const handleQuickReceipt = (materialId: string, qty: number) => {
    const receiptOp = inventoryOperations.find((o) => o.id === 'nhap-hang')!
    openOperation(receiptOp, { materialId, quantity: qty })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        onOpenSettings={() => setSettingsOpen(true)}
        lowStockCount={stats.lowStockCount}
      />

      <main className="flex-1">
        <InventoryFlow
          totalMaterials={stats.totalMaterials}
          lowStockCount={stats.lowStockCount}
          todayReceipts={stats.todayReceipts}
        />

        <OperationsGrid onSelect={(op) => openOperation(op)} />

        <DashboardSection />

        <AlertsPanel onQuickReceipt={handleQuickReceipt} />

        <MaterialManagement />

        <TransactionHistory />

        <ReportsSection />

        <SettingsOverview onOpen={() => setSettingsOpen(true)} />
      </main>

      <AppFooter />

      {/* Global overlays */}
      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
      <OperationDialogs
        operation={activeOp}
        onOpenChange={(o) => !o && setActiveOp(null)}
        prefill={prefill}
      />
      <CommandPalette
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenOperation={openOperationById}
      />
      <ShortcutsHelp />
    </div>
  )
}
