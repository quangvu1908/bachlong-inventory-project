'use client'

import * as React from 'react'
import { supabase } from '@/lib/supabase/client'

export interface OperationMaterial {
  id: string
  name: string
  categoryId: string
  categoryName: string
  unitKhoCode: string
  unitBarCode: string
  convertFactor: number
  minStock: number
  khoStock: number
  barStock: number
  /** null nếu không có quyền xem giá (nhân viên) hoặc chưa có giá */
  price: number | null
}

/** Tải danh sách NVL đang hoạt động của thương hiệu, kèm tồn kho tại 1 cửa hàng cụ thể. */
export function useOperationMaterials(storeId: string | undefined, brandId: string | undefined) {
  const [loading, setLoading] = React.useState(true)
  const [materials, setMaterials] = React.useState<OperationMaterial[]>([])

  const load = React.useCallback(async () => {
    if (!storeId || !brandId) {
      setMaterials([])
      setLoading(false)
      return
    }
    const [matsRes, catsRes, unitsRes, invRes, pricesRes] = await Promise.all([
      supabase.from('materials').select('*').eq('brand_id', brandId).eq('is_active', true).order('name'),
      supabase.from('material_categories').select('id, name'),
      supabase.from('units').select('id, code'),
      supabase.from('inventory_levels').select('*').eq('store_id', storeId),
      supabase.from('material_prices').select('*'),
    ])

    const catName = new Map((catsRes.data ?? []).map((c) => [c.id, c.name]))
    const unitCode = new Map((unitsRes.data ?? []).map((u) => [u.id, u.code.toUpperCase()]))
    const invByMaterial = new Map((invRes.data ?? []).map((i) => [i.material_id, i]))
    const priceByMaterial = new Map((pricesRes.data ?? []).map((p) => [p.material_id, p.unit_price]))

    const rows: OperationMaterial[] = (matsRes.data ?? []).map((m) => {
      const inv = invByMaterial.get(m.id)
      return {
        id: m.id,
        name: m.name,
        categoryId: m.category_id,
        categoryName: catName.get(m.category_id) ?? '—',
        unitKhoCode: unitCode.get(m.unit_kho_id) ?? '—',
        unitBarCode: unitCode.get(m.unit_bar_id) ?? '—',
        convertFactor: m.convert_factor,
        minStock: m.min_stock,
        khoStock: inv?.kho_stock ?? 0,
        barStock: inv?.bar_stock ?? 0,
        price: priceByMaterial.get(m.id) ?? null,
      }
    })
    setMaterials(rows)
    setLoading(false)
  }, [storeId, brandId])

  React.useEffect(() => {
    load()
  }, [load])

  return { loading, materials, reload: load }
}
