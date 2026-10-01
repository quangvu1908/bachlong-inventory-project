'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { InventoryFlow } from '@/components/inventory/inventory-flow'
import { DashboardSection } from '@/components/inventory/dashboard-section'
import { AlertsPanel } from '@/components/inventory/alerts-panel'
import { useInventoryStats } from '@/lib/inventory-stats'

export default function TongQuanPage() {
  const router = useRouter()
  const stats = useInventoryStats()

  const handleQuickReceipt = (materialId: string, qty: number) => {
    router.push(`/nhap-hang?mid=${materialId}&qty=${qty}`)
  }

  return (
    <div>
      <InventoryFlow
        totalMaterials={stats.totalMaterials}
        lowStockCount={stats.lowStockCount}
        todayReceipts={stats.todayReceipts}
      />
      <div className="pb-8">
        <DashboardSection />
        <AlertsPanel onQuickReceipt={handleQuickReceipt} />
      </div>
    </div>
  )
}
