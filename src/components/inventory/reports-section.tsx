'use client'

import * as React from 'react'
import { Boxes, Calculator, Download, FileSpreadsheet, Info, TrendingUp, Loader2, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth/auth-context'
import { useStore } from '@/lib/store-context'
import { supabase } from '@/lib/supabase/client'
import { downloadCSV, csvFilename } from '@/lib/csv-export'
import { downloadXlsx, xlsxFilename } from '@/lib/xlsx-export'
import { formatVND, formatNum } from '@/lib/format'
import { matchVi } from '@/lib/vi-search'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { computeActualConsumption, type TxnLite } from '@/lib/actual-consumption'

interface StockRow {
  id: string
  name: string
  categoryName: string
  unitKhoCode: string
  unitBarCode: string
  convertFactor: number
  minStock: number
  khoStock: number
  barStock: number
  price: number | null
}

/* ---------- Tồn Kho report ---------- */

export function StockReport() {
  const { selectedStore } = useStore()
  const { profile } = useAuth()
  const { toast } = useToast()
  const canViewPrice = profile?.role !== 'staff'

  const [loading, setLoading] = React.useState(true)
  const [rows, setRows] = React.useState<StockRow[]>([])
  const [query, setQuery] = React.useState('')

  React.useEffect(() => {
    if (!selectedStore) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    Promise.all([
      supabase.from('materials').select('*').eq('brand_id', selectedStore.brand_id).eq('is_active', true).order('name'),
      supabase.from('material_categories').select('id, name'),
      supabase.from('units').select('id, code'),
      supabase.from('inventory_levels').select('*').eq('store_id', selectedStore.id),
      supabase.from('material_prices').select('*'),
    ]).then(([matsRes, catsRes, unitsRes, invRes, pricesRes]) => {
      const catName = new Map((catsRes.data ?? []).map((c) => [c.id, c.name]))
      const unitCode = new Map((unitsRes.data ?? []).map((u) => [u.id, u.code.toUpperCase()]))
      const invByMaterial = new Map((invRes.data ?? []).map((i) => [i.material_id, i]))
      const priceByMaterial = new Map((pricesRes.data ?? []).map((p) => [p.material_id, p.unit_price]))

      setRows(
        (matsRes.data ?? []).map((m) => {
          const inv = invByMaterial.get(m.id)
          return {
            id: m.id,
            name: m.name,
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
      )
      setLoading(false)
    })
  }, [selectedStore])

  const filtered = rows.filter((m) => matchVi(m.name, query))
  const totalKho = rows.reduce((s, m) => s + (m.price ?? 0) * m.khoStock, 0)
  const totalBar = rows.reduce((s, m) => s + ((m.price ?? 0) / (m.convertFactor || 1)) * m.barStock, 0)

  const buildExportRows = (): (string | number)[][] => [
    canViewPrice
      ? ['NVL', 'Danh mục', 'ĐVT Kho', 'ĐVT Bar', 'Quy đổi', 'Đơn giá', 'Tồn Kho', 'Tồn Bar', 'Giá trị']
      : ['NVL', 'Danh mục', 'ĐVT Kho', 'ĐVT Bar', 'Quy đổi', 'Tồn Kho', 'Tồn Bar'],
    ...filtered.map((m) =>
      canViewPrice
        ? [m.name, m.categoryName, m.unitKhoCode, m.unitBarCode, m.convertFactor, m.price ?? 0, m.khoStock, m.barStock, (m.price ?? 0) * m.khoStock]
        : [m.name, m.categoryName, m.unitKhoCode, m.unitBarCode, m.convertFactor, m.khoStock, m.barStock]
    ),
  ]

  const handleExport = () => {
    downloadCSV(csvFilename('ton-kho'), buildExportRows())
    toast({ title: 'Đã xuất CSV', description: `${filtered.length} nguyên vật liệu` })
  }
  const handleExportXlsx = () => {
    downloadXlsx(xlsxFilename('ton-kho'), [{ name: 'Tồn Kho', rows: buildExportRows() }])
    toast({ title: 'Đã xuất Excel', description: `${filtered.length} nguyên vật liệu` })
  }

  if (!selectedStore) {
    return (
      <Card className="border-border/60">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Chưa chọn cửa hàng.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
                <Boxes className="size-4" />
              </span>
              Tồn Kho
            </CardTitle>
            <CardDescription className="mt-1 text-xs">{selectedStore.name} — thời điểm hiện tại</CardDescription>
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
              <Download className="size-3.5" />CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportXlsx}>
              <FileSpreadsheet className="size-3.5" />Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {canViewPrice && (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Giá trị Kho</div>
              <div className="text-sm font-bold text-amber-700 dark:text-amber-300">{formatVND(totalKho)}</div>
            </div>
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Giá trị Bar</div>
              <div className="text-sm font-bold text-rose-700 dark:text-rose-300">{formatVND(totalBar)}</div>
            </div>
          </div>
        )}

        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Lọc theo tên NVL..." className="h-8 text-xs" />

        {loading ? (
          <div className="grid place-items-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="max-h-[340px] overflow-y-auto scrollbar-cream rounded-lg border border-border/40">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/60 text-left uppercase tracking-wide text-muted-foreground backdrop-blur">
                <tr>
                  <th className="px-2.5 py-2 font-medium">NVL</th>
                  <th className="px-2.5 py-2 text-right font-medium">Kho</th>
                  <th className="px-2.5 py-2 text-right font-medium">Bar</th>
                  {canViewPrice && <th className="px-2.5 py-2 text-right font-medium">GT</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const gt = (m.price ?? 0) * m.khoStock
                  const isLow = m.khoStock <= m.minStock
                  return (
                    <tr key={m.id} className="border-t border-border/30 hover:bg-muted/30">
                      <td className="px-2.5 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex shrink-0 items-center rounded border border-border/60 bg-muted/40 px-1 py-0.5 text-[9px] font-medium">
                            {m.categoryName.slice(0, 3)}
                          </span>
                          <span className="truncate font-medium">{m.name}</span>
                        </div>
                      </td>
                      <td className={cn('px-2.5 py-2 text-right tabular-nums', isLow && 'font-bold text-destructive')}>
                        {formatNum(m.khoStock)}
                      </td>
                      <td className="px-2.5 py-2 text-right tabular-nums text-muted-foreground">{formatNum(m.barStock)}</td>
                      {canViewPrice && <td className="px-2.5 py-2 text-right tabular-nums">{formatVND(gt)}</td>}
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="px-2.5 py-8 text-center text-muted-foreground">Không có dữ liệu.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ---------- Giá Vốn report ---------- */

export function CostReport() {
  const { selectedStore } = useStore()
  const { profile } = useAuth()
  const { toast } = useToast()
  const canView = profile?.role === 'admin' || profile?.role === 'brand_manager' || profile?.role === 'store_manager'

  const defaultTo = new Date().toISOString().slice(0, 10)
  const defaultFrom = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  const [from, setFrom] = React.useState(defaultFrom)
  const [to, setTo] = React.useState(defaultTo)
  const [loading, setLoading] = React.useState(true)
  const [materials, setMaterials] = React.useState<{ id: string; name: string; khoStock: number; unitKhoCode: string }[]>([])
  const [txns, setTxns] = React.useState<TxnLite[]>([])

  React.useEffect(() => {
    if (!selectedStore || !canView) {
      setLoading(false)
      return
    }
    setLoading(true)
    const fromIso = `${from}T00:00:00`
    const toIso = `${to}T23:59:59`
    Promise.all([
      supabase.from('materials').select('id, name, unit_kho_id').eq('brand_id', selectedStore.brand_id).eq('is_active', true),
      supabase.from('units').select('id, code'),
      supabase.from('inventory_levels').select('material_id, kho_stock').eq('store_id', selectedStore.id),
      supabase
        .from('transactions_view')
        .select('material_id, type, quantity, amount, created_at')
        .eq('store_id', selectedStore.id)
        .in('type', ['receipt', 'issue_to_bar', 'warehouse_count'])
        .gte('created_at', fromIso)
        .lte('created_at', toIso),
    ]).then(([matsRes, unitsRes, invRes, txnsRes]) => {
      const unitCode = new Map((unitsRes.data ?? []).map((u) => [u.id, u.code.toUpperCase()]))
      const stockByMaterial = new Map((invRes.data ?? []).map((i) => [i.material_id, i.kho_stock]))
      setMaterials(
        (matsRes.data ?? []).map((m) => ({
          id: m.id,
          name: m.name,
          khoStock: stockByMaterial.get(m.id) ?? 0,
          unitKhoCode: unitCode.get(m.unit_kho_id) ?? '—',
        }))
      )
      setTxns((txnsRes.data ?? []) as TxnLite[])
      setLoading(false)
    })
  }, [selectedStore, canView, from, to])

  const actual = computeActualConsumption(
    materials.map((m) => m.id),
    new Map(materials.map((m) => [m.id, m.khoStock])),
    txns
  )
  const actualByMaterial = new Map(actual.map((r) => [r.materialId, r]))
  const rows = materials.map((m) => {
    const r = actualByMaterial.get(m.id)!
    return { material: m, ...r }
  })

  const totalConsumption = rows.reduce((s, r) => s + r.tieuThuValue, 0)
  const totalReceiptValue = rows.reduce((s, r) => s + r.nhapValue, 0)

  const visibleRows = rows.filter((r) => r.tieuThu !== 0 || r.nhapQty > 0 || r.xuatQty > 0)

  const buildExportRows = (): (string | number)[][] => [
    ['NVL', 'Tồn đầu', 'Nhập', 'Xuất Bar', 'Tồn cuối', 'Tiêu thụ', 'Giá vốn'],
    ...visibleRows.map((r) => [r.material.name, r.tonDau, r.nhapQty, r.xuatQty, r.tonCuoi, r.tieuThu, r.tieuThuValue]),
    ['', '', '', '', '', 'Tổng', totalConsumption],
  ]

  const handleExport = () => {
    downloadCSV(csvFilename('gia-von'), buildExportRows())
    toast({ title: 'Đã xuất CSV', description: `${visibleRows.length} NVL` })
  }
  const handleExportXlsx = () => {
    downloadXlsx(xlsxFilename('gia-von'), [{ name: 'Giá Vốn', rows: buildExportRows() }])
    toast({ title: 'Đã xuất Excel', description: `${visibleRows.length} NVL` })
  }

  if (!canView) {
    return (
      <Card className="h-full border-border/60">
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
          <ShieldAlert className="size-8" />
          <p className="text-sm">Báo cáo Giá Vốn không hiển thị cho vai trò Nhân viên.</p>
        </CardContent>
      </Card>
    )
  }

  if (!selectedStore) {
    return (
      <Card className="h-full border-border/60">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">Chưa chọn cửa hàng.</CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="grid size-8 place-items-center rounded-lg bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20">
                <Calculator className="size-4" />
              </span>
              Giá Vốn
            </CardTitle>
            <CardDescription className="mt-1 text-xs">{selectedStore.name} — chi phí NVL tiêu thụ theo khoảng ngày</CardDescription>
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
              <Download className="size-3.5" />CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportXlsx}>
              <FileSpreadsheet className="size-3.5" />Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Từ ngày</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Đến ngày</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 text-xs" />
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-[11px] text-violet-700 dark:text-violet-300">
          <Info className="size-3.5 shrink-0" />
          <span><strong>Tiêu thụ</strong> = Tồn đầu + Nhập − Tồn cuối, định giá theo đơn giá nhập trung bình trong kỳ</span>
        </div>

        {loading ? (
          <div className="grid place-items-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Tiền nhập trong kỳ</div>
                <div className="text-sm font-bold text-teal-700 dark:text-teal-300">{formatVND(totalReceiptValue)}</div>
              </div>
              <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2">
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <TrendingUp className="size-3" />Giá vốn tiêu thụ
                </div>
                <div className="text-sm font-bold text-violet-700 dark:text-violet-300">{formatVND(totalConsumption)}</div>
              </div>
            </div>

            <div className="max-h-[260px] overflow-y-auto scrollbar-cream rounded-lg border border-border/40">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/60 text-left uppercase tracking-wide text-muted-foreground backdrop-blur">
                  <tr>
                    <th className="px-2.5 py-2 font-medium">NVL</th>
                    <th className="px-2.5 py-2 text-right font-medium">Đầu</th>
                    <th className="px-2.5 py-2 text-right font-medium">Nhập</th>
                    <th className="px-2.5 py-2 text-right font-medium">XB</th>
                    <th className="px-2.5 py-2 text-right font-medium">Cuối</th>
                    <th className="px-2.5 py-2 text-right font-medium">Tiêu thụ</th>
                    <th className="px-2.5 py-2 text-right font-medium">Giá vốn</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((r) => (
                    <tr key={r.material.id} className="border-t border-border/30 hover:bg-muted/30">
                      <td className="px-2.5 py-2 truncate font-medium">{r.material.name}</td>
                      <td className="px-2.5 py-2 text-right tabular-nums text-muted-foreground">{formatNum(r.tonDau)}</td>
                      <td className="px-2.5 py-2 text-right tabular-nums text-teal-600 dark:text-teal-300">{formatNum(r.nhapQty)}</td>
                      <td className="px-2.5 py-2 text-right tabular-nums text-orange-600 dark:text-orange-300">{formatNum(r.xuatQty)}</td>
                      <td className="px-2.5 py-2 text-right tabular-nums text-muted-foreground">{formatNum(r.tonCuoi)}</td>
                      <td className="px-2.5 py-2 text-right tabular-nums font-medium text-violet-700 dark:text-violet-300">{formatNum(r.tieuThu)}</td>
                      <td className="px-2.5 py-2 text-right font-medium tabular-nums">{formatVND(r.tieuThuValue)}</td>
                    </tr>
                  ))}
                  {visibleRows.length === 0 && (
                    <tr><td colSpan={7} className="px-2.5 py-8 text-center text-muted-foreground">Không có dữ liệu trong kỳ.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
