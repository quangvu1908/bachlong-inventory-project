'use client'

import * as React from 'react'
import { supabase } from '@/lib/supabase/client'
import { expiryLevel, daysUntil } from '@/lib/format'

export interface DashboardMaterial {
  id: string
  name: string
  categoryName: string
  unitKhoCode: string
  khoStock: number
  barStock: number
  minStock: number
  price: number | null
  expiryDate: string | null
}

export function useDashboardData(storeId: string | undefined, brandId: string | undefined) {
  const [loading, setLoading] = React.useState(true)
  const [materials, setMaterials] = React.useState<DashboardMaterial[]>([])
  const [todayReceipts, setTodayReceipts] = React.useState(0)

  const load = React.useCallback(async () => {
    if (!storeId || !brandId) {
      setMaterials([])
      setTodayReceipts(0)
      setLoading(false)
      return
    }
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [matsRes, catsRes, unitsRes, invRes, pricesRes, receiptsRes] = await Promise.all([
      supabase.from('materials').select('*').eq('brand_id', brandId).eq('is_active', true),
      supabase.from('material_categories').select('id, name'),
      supabase.from('units').select('id, code'),
      supabase.from('inventory_levels').select('*').eq('store_id', storeId),
      supabase.from('material_prices').select('*'),
      supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeId)
        .eq('type', 'receipt')
        .gte('created_at', todayStart.toISOString()),
    ])

    const catName = new Map((catsRes.data ?? []).map((c) => [c.id, c.name]))
    const unitCode = new Map((unitsRes.data ?? []).map((u) => [u.id, u.code.toUpperCase()]))
    const invByMaterial = new Map((invRes.data ?? []).map((i) => [i.material_id, i]))
    const priceByMaterial = new Map((pricesRes.data ?? []).map((p) => [p.material_id, p.unit_price]))

    setMaterials(
      (matsRes.data ?? []).map((m) => {
        const inv = invByMaterial.get(m.id)
        return {
          id: m.id,
          name: m.name,
          categoryName: catName.get(m.category_id) ?? '—',
          unitKhoCode: unitCode.get(m.unit_kho_id) ?? '—',
          khoStock: inv?.kho_stock ?? 0,
          barStock: inv?.bar_stock ?? 0,
          minStock: m.min_stock,
          price: priceByMaterial.get(m.id) ?? null,
          expiryDate: inv?.expiry_date ?? null,
        }
      })
    )
    setTodayReceipts(receiptsRes.count ?? 0)
    setLoading(false)
  }, [storeId, brandId])

  React.useEffect(() => {
    load()
  }, [load])

  const lowStock = materials.filter((m) => m.khoStock <= m.minStock)
  const restockSuggestions = lowStock.map((m) => {
    const deficit = Math.max(m.minStock - m.khoStock, 0)
    const suggested = Math.max(m.minStock * 2 - m.khoStock, deficit * 2, m.minStock)
    return { m, deficit, suggested }
  })
  const expiringMaterials = materials
    .map((m) => ({ m, days: daysUntil(m.expiryDate), level: expiryLevel(m.expiryDate) }))
    .filter((e) => e.level === 'expired' || e.level === 'critical' || e.level === 'soon')
    .sort((a, b) => (a.days ?? 0) - (b.days ?? 0))

  const totalKhoValue = materials.reduce((s, m) => s + (m.price ?? 0) * m.khoStock, 0)
  const totalBarValue = materials.reduce((s, m) => s + (m.price ?? 0) * m.barStock, 0)

  return {
    loading,
    materials,
    lowStock,
    restockSuggestions,
    expiringMaterials,
    todayReceipts,
    totalKhoValue,
    totalBarValue,
    reload: load,
  }
}
