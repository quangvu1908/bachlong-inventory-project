'use client'

import * as React from 'react'
import { Scale, Download, FileSpreadsheet, Info, Loader2, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth/auth-context'
import { useStore } from '@/lib/store-context'
import { supabase } from '@/lib/supabase/client'
import { downloadCSV, csvFilename } from '@/lib/csv-export'
import { downloadXlsx, xlsxFilename } from '@/lib/xlsx-export'
import { formatNum } from '@/lib/format'
import { computeActualConsumption, type TxnLite } from '@/lib/actual-consumption'
import {
  computeTheoreticalConsumption,
  type SalesRecordLite,
  type ProductRecipeLite,
  type MaterialRecipeLite,
} from '@/lib/theoretical-consumption'
import { PageHeader, PageContainer } from '@/components/inventory/page-header'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface VarianceRow {
  materialId: string
  name: string
  unitCode: string
  theoretical: number
  actual: number
  variancePct: number | null
}

export default function SaiLechTieuThuPage() {
  const { selectedStore } = useStore()
  const { profile } = useAuth()
  const { toast } = useToast()
  const canView = profile?.role === 'admin' || profile?.role === 'brand_manager' || profile?.role === 'store_manager'

  const defaultTo = new Date().toISOString().slice(0, 10)
  const defaultFrom = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  const [from, setFrom] = React.useState(defaultFrom)
  const [to, setTo] = React.useState(defaultTo)
  const [loading, setLoading] = React.useState(true)
  const [rows, setRows] = React.useState<VarianceRow[]>([])

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
      supabase
        .from('sales_records')
        .select('product_id, quantity, sold_date')
        .eq('store_id', selectedStore.id)
        .gte('sold_date', from)
        .lte('sold_date', to),
      supabase.from('products').select('id').eq('brand_id', selectedStore.brand_id),
      supabase.from('product_recipes').select('product_id, material_id, quantity, effective_from, effective_to'),
      supabase.from('material_recipes').select('btp_material_id, input_material_id, quantity, effective_from, effective_to'),
    ]).then(([matsRes, unitsRes, invRes, txnsRes, salesRes, prodIdsRes, prRes, mrRes]) => {
      const materials = matsRes.data ?? []
      const unitCode = new Map((unitsRes.data ?? []).map((u) => [u.id, u.code.toUpperCase()]))
      const khoStockByMaterial = new Map((invRes.data ?? []).map((i) => [i.material_id, i.kho_stock]))
      const productIds = new Set((prodIdsRes.data ?? []).map((p) => p.id))

      const actual = computeActualConsumption(
        materials.map((m) => m.id),
        khoStockByMaterial,
        (txnsRes.data ?? []) as TxnLite[]
      )
      const actualByMaterial = new Map(actual.map((r) => [r.materialId, r.tieuThu]))

      const salesRecords = (salesRes.data ?? []) as SalesRecordLite[]
      const productRecipes = ((prRes.data ?? []) as ProductRecipeLite[]).filter((r) => productIds.has(r.product_id))
      const materialRecipes = (mrRes.data ?? []) as MaterialRecipeLite[]
      const theoretical = computeTheoreticalConsumption(salesRecords, productRecipes, materialRecipes)

      const result: VarianceRow[] = materials
        .map((m) => {
          const t = theoretical.get(m.id) ?? 0
          const a = actualByMaterial.get(m.id) ?? 0
          return {
            materialId: m.id,
            name: m.name,
            unitCode: unitCode.get(m.unit_kho_id) ?? '—',
            theoretical: t,
            actual: a,
            variancePct: t !== 0 ? ((a - t) / t) * 100 : null,
          }
        })
        .filter((r) => r.theoretical !== 0 || r.actual !== 0)
        .sort((a, b) => Math.abs(b.variancePct ?? 0) - Math.abs(a.variancePct ?? 0))

      setRows(result)
      setLoading(false)
    })
  }, [selectedStore, canView, from, to])

  const buildExportRows = (): (string | number)[][] => [
    ['NVL', 'Tiêu thụ lý thuyết', 'Tiêu thụ thực tế', 'Sai lệch (%)'],
    ...rows.map((r) => [r.name, r.theoretical, r.actual, r.variancePct ?? '']),
  ]
  const handleExport = () => {
    downloadCSV(csvFilename('sai-lech-tieu-thu'), buildExportRows())
    toast({ title: 'Đã xuất CSV', description: `${rows.length} NVL` })
  }
  const handleExportXlsx = () => {
    downloadXlsx(xlsxFilename('sai-lech-tieu-thu'), [{ name: 'Sai Lệch', rows: buildExportRows() }])
    toast({ title: 'Đã xuất Excel', description: `${rows.length} NVL` })
  }

  if (!canView) {
    return (
      <PageContainer>
        <PageHeader icon={Scale} title="Sai Lệch Tiêu Thụ" description="So sánh tiêu thụ lý thuyết vs thực tế." />
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <ShieldAlert className="size-8" />
            <p className="text-sm">Báo cáo này không hiển thị cho vai trò Nhân viên.</p>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  if (!selectedStore) {
    return (
      <PageContainer>
        <PageHeader icon={Scale} title="Sai Lệch Tiêu Thụ" description="So sánh tiêu thụ lý thuyết vs thực tế." />
        <Card className="border-border/60">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Chưa chọn cửa hàng.</CardContent>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        icon={Scale}
        title="Sai Lệch Tiêu Thụ"
        description={`${selectedStore.name} — chênh lệch giữa lượng NVL đáng lẽ dùng (theo công thức) và lượng thực tế đã dùng.`}
        actions={
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
              <Download className="size-3.5" />CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportXlsx}>
              <FileSpreadsheet className="size-3.5" />Excel
            </Button>
          </div>
        }
      />

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Khoảng thời gian</CardTitle>
          <CardDescription className="text-xs">
            Tiêu thụ lý thuyết nổ từ dữ liệu bán hàng đã import; tiêu thụ thực tế lấy từ báo cáo Giá Vốn.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid max-w-md grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Từ ngày</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Đến ngày</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-[11px] text-sky-700 dark:text-sky-300">
            <Info className="size-3.5 shrink-0" />
            <span>
              <strong>Sai lệch</strong> = (Thực tế − Lý thuyết) / Lý thuyết × 100%. Dương = dùng nhiều hơn công thức
              (hao hụt, rơi vãi, thất thoát); Âm = dùng ít hơn công thức.
            </span>
          </div>

          {loading ? (
            <div className="grid place-items-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="max-h-[480px] overflow-y-auto scrollbar-cream rounded-lg border border-border/40">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/60 text-left uppercase tracking-wide text-muted-foreground backdrop-blur">
                  <tr>
                    <th className="px-2.5 py-2 font-medium">NVL</th>
                    <th className="px-2.5 py-2 text-right font-medium">Lý thuyết</th>
                    <th className="px-2.5 py-2 text-right font-medium">Thực tế</th>
                    <th className="px-2.5 py-2 text-right font-medium">Sai lệch</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const big = r.variancePct !== null && Math.abs(r.variancePct) >= 20
                    return (
                      <tr key={r.materialId} className="border-t border-border/30 hover:bg-muted/30">
                        <td className="px-2.5 py-2 font-medium">{r.name}</td>
                        <td className="px-2.5 py-2 text-right tabular-nums text-muted-foreground">
                          {formatNum(r.theoretical)} {r.unitCode}
                        </td>
                        <td className="px-2.5 py-2 text-right tabular-nums text-muted-foreground">
                          {formatNum(r.actual)} {r.unitCode}
                        </td>
                        <td
                          className={cn(
                            'px-2.5 py-2 text-right tabular-nums font-medium',
                            r.variancePct === null
                              ? 'text-muted-foreground'
                              : big
                                ? 'text-destructive'
                                : r.variancePct > 0
                                  ? 'text-amber-600 dark:text-amber-300'
                                  : 'text-emerald-600 dark:text-emerald-300'
                          )}
                        >
                          {r.variancePct === null ? '—' : `${r.variancePct > 0 ? '+' : ''}${formatNum(r.variancePct, 1)}%`}
                        </td>
                      </tr>
                    )
                  })}
                  {rows.length === 0 && (
                    <tr><td colSpan={4} className="px-2.5 py-8 text-center text-muted-foreground">Không có dữ liệu trong kỳ.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  )
}
