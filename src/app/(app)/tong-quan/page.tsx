'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { InventoryFlow } from '@/components/inventory/inventory-flow'
import { DashboardKpis, BrandComparison } from '@/components/inventory/dashboard-section'
import { AlertsPanel } from '@/components/inventory/alerts-panel'
import { useStore } from '@/lib/store-context'
import { useAuth } from '@/lib/auth/auth-context'
import { useDashboardData } from '@/lib/use-dashboard-data'
import { Card, CardContent } from '@/components/ui/card'

export default function TongQuanPage() {
  const router = useRouter()
  const { selectedStore, loading: storeLoading } = useStore()
  const { profile } = useAuth()
  const canViewPrice = profile?.role !== 'staff'

  const {
    loading,
    materials,
    restockSuggestions,
    expiringMaterials,
    todayReceipts,
    totalKhoValue,
    totalBarValue,
  } = useDashboardData(selectedStore?.id, selectedStore?.brand_id)

  const handleQuickReceipt = (materialId: string, qty: number) => {
    router.push(`/nhap-hang?mid=${materialId}&qty=${qty}`)
  }

  if (storeLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!selectedStore) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Card className="border-border/60">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Chưa có cửa hàng nào để hiển thị. Vào "Thương hiệu & Cửa hàng" để thêm cửa hàng đầu tiên.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <InventoryFlow
        totalMaterials={materials.length}
        lowStockCount={restockSuggestions.length}
        todayReceipts={todayReceipts}
      />
      <div className="pb-8">
        {loading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DashboardKpis
              totalKhoValue={totalKhoValue}
              totalBarValue={totalBarValue}
              lowStockCount={restockSuggestions.length}
              todayReceipts={todayReceipts}
              canViewPrice={canViewPrice}
            />
            <BrandComparison />
            <AlertsPanel
              restockSuggestions={restockSuggestions}
              expiringMaterials={expiringMaterials}
              canViewPrice={canViewPrice}
              onQuickReceipt={handleQuickReceipt}
            />
          </>
        )}
      </div>
    </div>
  )
}
