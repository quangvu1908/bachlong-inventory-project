'use client'

import * as React from 'react'
import { Wallet, Coffee, AlertTriangle, PackagePlus, Loader2, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/lib/auth/auth-context'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'
import { formatVND, formatNum } from '@/lib/format'
import { cn } from '@/lib/utils'

interface KpiProps {
  totalKhoValue: number
  totalBarValue: number
  lowStockCount: number
  todayReceipts: number
  canViewPrice: boolean
}

export function DashboardKpis({ totalKhoValue, totalBarValue, lowStockCount, todayReceipts, canViewPrice }: KpiProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-3 pb-6 lg:grid-cols-4">
        {canViewPrice && (
          <>
            <KpiCard icon={Wallet} label="Giá trị Kho Dự Trữ" value={formatVND(totalKhoValue)} tone="amber" />
            <KpiCard icon={Coffee} label="Giá trị Quầy Bar" value={formatVND(totalBarValue)} tone="rose" />
          </>
        )}
        <KpiCard icon={AlertTriangle} label="Sắp hết hàng" value={String(lowStockCount)} tone={lowStockCount > 0 ? 'destructive' : 'emerald'} />
        <KpiCard icon={PackagePlus} label="Phiếu nhập hôm nay" value={String(todayReceipts)} tone="teal" />
      </div>
    </section>
  )
}

function KpiCard({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone: 'amber' | 'rose' | 'destructive' | 'emerald' | 'teal' }) {
  const tones = {
    amber: 'bg-amber-500/10 text-amber-600 ring-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-600 ring-rose-500/20',
    destructive: 'bg-destructive/10 text-destructive ring-destructive/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
    teal: 'bg-teal-500/10 text-teal-600 ring-teal-500/20',
  }
  return (
    <Card className="border-border/60">
      <CardContent className="flex items-center gap-3 p-4">
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl ring-1', tones[tone])}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-lg font-bold tabular-nums">{value}</div>
          <div className="truncate text-[11px] text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ---------- So sánh thương hiệu (chỉ Admin) ---------- */

type Brand = Database['public']['Tables']['brands']['Row']

interface BrandStat {
  brand: Brand
  storeCount: number
  totalValue: number
  lowStockCount: number
}

export function BrandComparison() {
  const { profile } = useAuth()
  const [loading, setLoading] = React.useState(true)
  const [stats, setStats] = React.useState<BrandStat[]>([])

  React.useEffect(() => {
    if (profile?.role !== 'admin') {
      setLoading(false)
      return
    }
    setLoading(true)
    Promise.all([
      supabase.from('brands').select('*').order('code'),
      supabase.from('stores').select('id, brand_id').eq('is_active', true),
      supabase.from('materials').select('id, brand_id, min_stock'),
      supabase.from('inventory_levels').select('store_id, material_id, kho_stock'),
      supabase.from('material_prices').select('material_id, unit_price'),
    ]).then(([brandsRes, storesRes, matsRes, invRes, pricesRes]) => {
      const brands = brandsRes.data ?? []
      const stores = storesRes.data ?? []
      const materials = matsRes.data ?? []
      const inv = invRes.data ?? []
      const priceByMaterial = new Map((pricesRes.data ?? []).map((p) => [p.material_id, p.unit_price]))
      const minByMaterial = new Map(materials.map((m) => [m.id, m.min_stock]))
      const brandByMaterial = new Map(materials.map((m) => [m.id, m.brand_id]))

      const result: BrandStat[] = brands.map((brand) => {
        const storeIds = new Set(stores.filter((s) => s.brand_id === brand.id).map((s) => s.id))
        let totalValue = 0
        let lowStockCount = 0
        for (const row of inv) {
          if (!storeIds.has(row.store_id)) continue
          const matBrand = brandByMaterial.get(row.material_id)
          if (matBrand !== brand.id) continue
          const price = priceByMaterial.get(row.material_id) ?? 0
          totalValue += price * row.kho_stock
          const min = minByMaterial.get(row.material_id) ?? 0
          if (row.kho_stock <= min) lowStockCount++
        }
        return { brand, storeCount: storeIds.size, totalValue, lowStockCount }
      })
      setStats(result)
      setLoading(false)
    })
  }, [profile?.role])

  if (profile?.role !== 'admin') return null

  return (
    <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
              <BarChart3 className="size-4" />
            </span>
            So sánh thương hiệu
          </CardTitle>
          <CardDescription className="text-xs">Toàn chuỗi — tổng hợp từ mọi cửa hàng đang hoạt động</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid place-items-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {stats.map((s) => (
                <div key={s.brand.id} className="rounded-xl border border-border/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{s.brand.name}</span>
                    <span className="text-xs text-muted-foreground">{s.storeCount} cửa hàng</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Giá trị tồn kho</div>
                      <div className="text-base font-bold tabular-nums">{formatVND(s.totalValue)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Sắp hết hàng</div>
                      <div className={cn('text-base font-bold tabular-nums', s.lowStockCount > 0 ? 'text-destructive' : 'text-emerald-600')}>
                        {formatNum(s.lowStockCount)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
