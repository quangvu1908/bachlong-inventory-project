'use client'

import * as React from 'react'
import {
  GitCompare,
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader, PageContainer } from '@/components/inventory/page-header'
import { useAuth } from '@/lib/auth/auth-context'
import { useStore } from '@/lib/store-context'
import { supabase } from '@/lib/supabase/client'
import { downloadCSV, csvFilename } from '@/lib/csv-export'
import { downloadXlsx, xlsxFilename } from '@/lib/xlsx-export'
import { formatVND, formatNum } from '@/lib/format'
import { computeActualConsumption, type TxnLite } from '@/lib/actual-consumption'
import {
  computeTheoreticalConsumption,
  type SalesRecordLite,
  type ProductRecipeLite,
  type MaterialRecipeLite,
} from '@/lib/theoretical-consumption'
import { cn } from '@/lib/utils'

interface StoreStat {
  storeId: string
  storeCode: string
  storeName: string
  brandName: string
  revenue: number
  costOfGoods: number
  costRatio: number | null
  avgVariancePct: number | null
  inventoryValue: number
}

export default function SoSanhCuaHangPage() {
  const { profile } = useAuth()
  const { stores, loading: storesLoading } = useStore()
  const canView = profile?.role === 'admin' || profile?.role === 'brand_manager'

  const defaultTo = new Date().toISOString().slice(0, 10)
  const defaultFrom = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  const [from, setFrom] = React.useState(defaultFrom)
  const [to, setTo] = React.useState(defaultTo)
  const [loading, setLoading] = React.useState(true)
  const [stats, setStats] = React.useState<StoreStat[]>([])

  React.useEffect(() => {
    if (!canView || storesLoading || stores.length === 0) {
      setLoading(false)
      return
    }
    setLoading(true)
    const fromIso = `${from}T00:00:00`
    const toIso = `${to}T23:59:59`

    Promise.all([
      supabase.from('materials').select('id, brand_id').eq('is_active', true),
      supabase.from('material_prices').select('material_id, unit_price'),
      supabase.from('inventory_levels').select('store_id, material_id, kho_stock'),
      supabase
        .from('transactions_view')
        .select('store_id, material_id, type, quantity, amount, created_at')
        .in('type', ['receipt', 'issue_to_bar', 'warehouse_count', 'transfer_out'])
        .gte('created_at', fromIso)
        .lte('created_at', toIso),
      supabase
        .from('sales_records')
        .select('store_id, product_id, quantity, revenue, sold_date')
        .gte('sold_date', from)
        .lte('sold_date', to),
      supabase.from('products').select('id, brand_id'),
      supabase.from('product_recipes').select('product_id, material_id, quantity, effective_from, effective_to'),
      supabase.from('material_recipes').select('btp_material_id, input_material_id, quantity, effective_from, effective_to'),
    ]).then(([matsRes, pricesRes, invRes, txnsRes, salesRes, prodRes, prRes, mrRes]) => {
      const materials = matsRes.data ?? []
      const priceByMaterial = new Map((pricesRes.data ?? []).map((p) => [p.material_id, p.unit_price]))
      const inv = invRes.data ?? []
      const txns = (txnsRes.data ?? []) as (TxnLite & { store_id: string })[]
      const sales = (salesRes.data ?? []) as (SalesRecordLite & { store_id: string; revenue: number | null })[]
      const productBrand = new Map((prodRes.data ?? []).map((p) => [p.id, p.brand_id]))
      const productRecipes = (prRes.data ?? []) as ProductRecipeLite[]
      const materialRecipes = (mrRes.data ?? []) as MaterialRecipeLite[]

      const result: StoreStat[] = stores.map((store) => {
        const brandMaterialIds = materials.filter((m) => m.brand_id === store.brand_id).map((m) => m.id)
        const khoStockByMaterial = new Map(
          inv.filter((i) => i.store_id === store.id).map((i) => [i.material_id, i.kho_stock])
        )
        const storeTxns = txns.filter((t) => t.store_id === store.id)
        const actual = computeActualConsumption(brandMaterialIds, khoStockByMaterial, storeTxns)
        const costOfGoods = actual.reduce((s, r) => s + r.tieuThuValue, 0)

        const inventoryValue = brandMaterialIds.reduce((s, materialId) => {
          const qty = khoStockByMaterial.get(materialId) ?? 0
          const price = priceByMaterial.get(materialId) ?? 0
          return s + qty * price
        }, 0)

        const storeSales = sales.filter((s) => s.store_id === store.id)
        const revenue = storeSales.reduce((s, r) => s + (r.revenue ?? 0), 0)

        const brandProductIds = new Set(
          Array.from(productBrand.entries())
            .filter(([, brandId]) => brandId === store.brand_id)
            .map(([id]) => id)
        )
        const storeProductRecipes = productRecipes.filter((r) => brandProductIds.has(r.product_id))
        const theoretical = computeTheoreticalConsumption(storeSales, storeProductRecipes, materialRecipes)
        const actualByMaterial = new Map(actual.map((r) => [r.materialId, r.tieuThu]))
        const variances = brandMaterialIds
          .map((materialId) => {
            const t = theoretical.get(materialId) ?? 0
            const a = actualByMaterial.get(materialId) ?? 0
            if (t === 0) return null
            return Math.abs(((a - t) / t) * 100)
          })
          .filter((v): v is number => v !== null)
        const avgVariancePct = variances.length > 0 ? variances.reduce((s, v) => s + v, 0) / variances.length : null

        return {
          storeId: store.id,
          storeCode: store.code,
          storeName: store.name,
          brandName: store.brand.name,
          revenue,
          costOfGoods,
          costRatio: revenue > 0 ? (costOfGoods / revenue) * 100 : null,
          avgVariancePct,
          inventoryValue,
        }
      })

      result.sort((a, b) => b.revenue - a.revenue)
      setStats(result)
      setLoading(false)
    })
  }, [canView, storesLoading, stores, from, to])

  const buildExportRows = (): (string | number)[][] => [
    ['Cửa hàng', 'Thương hiệu', 'Doanh thu', 'Giá vốn', 'Giá vốn/DT (%)', 'Sai lệch TB (%)', 'Giá trị tồn kho'],
    ...stats.map((s) => [
      s.storeName,
      s.brandName,
      s.revenue,
      s.costOfGoods,
      s.costRatio ?? '',
      s.avgVariancePct ?? '',
      s.inventoryValue,
    ]),
  ]
  const handleExport = () => {
    downloadCSV(csvFilename('so-sanh-cua-hang'), buildExportRows())
  }
  const handleExportXlsx = () => {
    downloadXlsx(xlsxFilename('so-sanh-cua-hang'), [{ name: 'So Sánh', rows: buildExportRows() }])
  }

  const chartData = stats.map((s) => ({
    name: s.storeCode,
    'Doanh thu': Math.round(s.revenue),
    'Giá vốn': Math.round(s.costOfGoods),
  }))

  if (!canView) {
    return (
      <PageContainer>
        <PageHeader icon={GitCompare} title="So Sánh Cửa Hàng" description="Đối chiếu doanh thu, giá vốn và sai lệch tiêu thụ giữa các cửa hàng." />
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <ShieldAlert className="size-8" />
            <p className="text-sm">Báo cáo này chỉ hiển thị cho Quản trị viên và Quản lý thương hiệu.</p>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        icon={GitCompare}
        title="So Sánh Cửa Hàng"
        description="Đối chiếu doanh thu, giá vốn và sai lệch tiêu thụ giữa các cửa hàng trong kỳ đã chọn."
        accent="from-primary/15 to-accent/10 text-primary"
        actions={
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport} disabled={stats.length === 0}>
              <Download className="size-3.5" />CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportXlsx} disabled={stats.length === 0}>
              <FileSpreadsheet className="size-3.5" />Excel
            </Button>
          </div>
        }
      />

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Khoảng thời gian</CardTitle>
          <CardDescription className="text-xs">
            Doanh thu lấy từ dữ liệu bán hàng đã import; Giá vốn &amp; sai lệch tính theo cùng công thức với báo cáo Giá Vốn / Sai Lệch Tiêu Thụ.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/60 px-3 py-2 text-[11px] text-foreground/75">
            <Info className="size-3.5 shrink-0 text-muted-foreground" />
            <span>
              <strong>Giá vốn/DT</strong> cao bất thường hoặc <strong>Sai lệch TB</strong> lớn ở một cửa hàng là dấu hiệu
              cần kiểm tra hao hụt, thất thoát hoặc nhập liệu sai so với các cửa hàng khác cùng thương hiệu.
            </span>
          </div>

          {loading ? (
            <div className="grid place-items-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
          ) : stats.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Chưa có cửa hàng nào để so sánh.</div>
          ) : (
            <>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatNum(v, 0)} width={56} />
                    <Tooltip
                      formatter={(value: number) => formatVND(value)}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Doanh thu" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Giá vốn" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border/40">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/60">
                      <TableHead>Cửa hàng</TableHead>
                      <TableHead>Thương hiệu</TableHead>
                      <TableHead className="text-right">Doanh thu</TableHead>
                      <TableHead className="text-right">Giá vốn</TableHead>
                      <TableHead className="text-right">Giá vốn/DT</TableHead>
                      <TableHead className="text-right">Sai lệch TB</TableHead>
                      <TableHead className="text-right">Giá trị tồn kho</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.map((s) => {
                      const ratioHigh = s.costRatio !== null && s.costRatio >= 50
                      const varianceHigh = s.avgVariancePct !== null && s.avgVariancePct >= 15
                      return (
                        <TableRow key={s.storeId}>
                          <TableCell className="font-medium">{s.storeName}</TableCell>
                          <TableCell className="text-muted-foreground">{s.brandName}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatVND(s.revenue)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatVND(s.costOfGoods)}</TableCell>
                          <TableCell
                            className={cn(
                              'text-right tabular-nums font-medium',
                              s.costRatio === null ? 'text-muted-foreground' : ratioHigh ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-300'
                            )}
                          >
                            <span className="inline-flex items-center justify-end gap-1">
                              {s.costRatio !== null && (ratioHigh ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />)}
                              {s.costRatio === null ? '—' : `${formatNum(s.costRatio, 1)}%`}
                            </span>
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right tabular-nums font-medium',
                              s.avgVariancePct === null ? 'text-muted-foreground' : varianceHigh ? 'text-destructive' : 'text-foreground'
                            )}
                          >
                            {s.avgVariancePct === null ? '—' : `${formatNum(s.avgVariancePct, 1)}%`}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {formatVND(s.inventoryValue)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  )
}
