'use client'

import * as React from 'react'
import { AppHeader } from '@/components/inventory/app-header'
import { InventoryFlow } from '@/components/inventory/inventory-flow'
import { OperationsGrid } from '@/components/inventory/operations-grid'
import { MaterialManagement } from '@/components/inventory/material-management'
import {
  SettingsOverview,
  SettingsSheet,
} from '@/components/inventory/settings-panel'
import { OperationPreview } from '@/components/inventory/operation-preview'
import { AppFooter } from '@/components/inventory/app-footer'
import { initialMaterials } from '@/lib/inventory-data'
import type { InventoryOperation } from '@/lib/inventory-data'

export default function Home() {
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [previewOp, setPreviewOp] = React.useState<InventoryOperation | null>(
    null
  )

  const totalMaterials = initialMaterials.length
  const lowStockCount = initialMaterials.filter(
    (m) => m.stock <= m.minStock
  ).length
  const todayReceipts = 3

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        onOpenSettings={() => setSettingsOpen(true)}
        lowStockCount={lowStockCount}
      />

      <main className="flex-1">
        <InventoryFlow
          totalMaterials={totalMaterials}
          lowStockCount={lowStockCount}
          todayReceipts={todayReceipts}
        />

        <OperationsGrid onSelect={(op) => setPreviewOp(op)} />

        <MaterialManagement />

        <SettingsOverview onOpen={() => setSettingsOpen(true)} />
      </main>

      <AppFooter />

      {/* Global overlays */}
      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
      <OperationPreview
        operation={previewOp}
        onOpenChange={(o) => !o && setPreviewOp(null)}
      />
    </div>
  )
}
