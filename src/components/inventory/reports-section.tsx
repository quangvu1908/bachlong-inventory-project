'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Boxes,
  Calculator,
  Download,
  FileSpreadsheet,
  Lock,
  Info,
  TrendingUp,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useInventoryStore } from '@/lib/inventory-store'
import {
  useInventoryStats,
  formatVND,
  formatNum,
} from '@/lib/inventory-stats'
import { categoryLabels, categoryStyles } from '@/lib/inventory-data'
import { downloadCSV, csvFilename } from '@/lib/csv-export'
import { downloadXlsx, xlsxFilename } from '@/lib/xlsx-export'
import { matchVi } from '@/lib/vi-search'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export function ReportsSection() {
  return (
    <section
      id="bao-cao"
      className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
    >
      <div className="mb-6">
        <Badge variant="outline" className="mb-2 border-violet-500/30 bg-violet-500/5 text-violet-700 dark:text-violet-300">
          <Lock className="size-3.5" />
          Báo cáo — chỉ xem
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Báo cáo Tồn Kho & Giá Vốn
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Hai báo cáo tra cứu — dữ liệu tổng hợp tự động từ các nghiệp vụ, không
          nhập liệu trực tiếp.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StockReport />
        <CostReport />
      </div>
    </section>
  )
}

/* ---------- Tồn Kho report ---------- */

export function StockReport() {
  const { materials } = useInventoryStats()
  const { toast } = useToast()
  const [query, setQuery] = React.useState('')

  const filtered = materials.filter((m) => matchVi(m.name, query))

  const totalKho = materials.reduce((s, m) => s + m.unitPrice * m.stock, 0)
  const totalBar = materials.reduce((s, m) => {
    const factor = m.convertFactor ?? 1
    return s + (m.unitPrice / factor) * m.barStock
  }, 0)

  const handleExport = () => {
    const rows: (string | number)[][] = [
      ['NVL', 'Danh mục', 'ĐVT Kho', 'ĐVT Bar', 'Quy đổi', 'Đơn giá', 'Tồn Kho', 'Tồn Bar', 'Hạn sử dụng', 'Giá trị'],
      ...filtered.map((m) => [
        m.name,
        categoryLabels[m.category],
        m.unit,
        m.unitBar ?? '',
        m.convertFactor ?? '',
        m.unitPrice,
        m.stock,
        m.barStock,
        m.expiryDate ?? '',
        m.unitPrice * m.stock,
      ]),
      ['', '', '', '', '', '', '', '', 'Tổng giá trị kho', totalKho],
    ]
    downloadCSV(csvFilename('ton-kho'), rows)
    toast({
      title: 'Đã xuất CSV',
      description: `${filtered.length} nguyên vật liệu — file ton-kho-*.csv`,
    })
  }

  const handleExportXlsx = () => {
    const rows: (string | number)[][] = [
      ['NVL', 'Danh mục', 'ĐVT Kho', 'ĐVT Bar', 'Quy đổi', 'Đơn giá', 'Tồn Kho', 'Tồn Bar', 'Hạn sử dụng', 'Giá trị'],
      ...filtered.map((m) => [
        m.name,
        categoryLabels[m.category],
        m.unit,
        m.unitBar ?? '',
        m.convertFactor ?? '',
        m.unitPrice,
        m.stock,
        m.barStock,
        m.expiryDate ?? '',
        m.unitPrice * m.stock,
      ]),
    ]
    downloadXlsx(xlsxFilename('ton-kho'), [{ name: 'Tồn Kho', rows }])
    toast({
      title: 'Đã xuất Excel',
      description: `${filtered.length} nguyên vật liệu — file ton-kho-*.xls`,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
    >
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
              <CardDescription className="mt-1 text-xs">
                Tra cứu tồn tại thời điểm hiện tại
              </CardDescription>
            </div>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleExport}
              >
                <Download className="size-3.5" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleExportXlsx}
              >
                <FileSpreadsheet className="size-3.5" />
                Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* totals */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Giá trị Kho
              </div>
              <div className="text-sm font-bold text-amber-700 dark:text-amber-300">
                {formatVND(totalKho)}
              </div>
            </div>
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Giá trị Bar
              </div>
              <div className="text-sm font-bold text-rose-700 dark:text-rose-300">
                {formatVND(totalBar)}
              </div>
            </div>
          </div>

          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Lọc theo tên NVL..."
            className="h-8 text-xs"
          />

          {/* table */}
          <div className="max-h-[340px] overflow-y-auto scrollbar-cream rounded-lg border border-border/40">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/60 text-left uppercase tracking-wide text-muted-foreground backdrop-blur">
                <tr>
                  <th className="px-2.5 py-2 font-medium">NVL</th>
                  <th className="px-2.5 py-2 text-right font-medium">Kho</th>
                  <th className="px-2.5 py-2 text-right font-medium">Bar</th>
                  <th className="px-2.5 py-2 text-right font-medium">GT</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const gt = m.unitPrice * m.stock
                  const isLow = m.stock <= m.minStock
                  return (
                    <tr
                      key={m.id}
                      className="border-t border-border/30 hover:bg-muted/30"
                    >
                      <td className="px-2.5 py-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'inline-flex shrink-0 items-center rounded border px-1 py-0.5 text-[9px] font-medium',
                              categoryStyles[m.category]
                            )}
                          >
                            {categoryLabels[m.category].slice(0, 3)}
                          </span>
                          <span className="truncate font-medium">{m.name}</span>
                        </div>
                      </td>
                      <td
                        className={cn(
                          'px-2.5 py-2 text-right tabular-nums',
                          isLow && 'font-bold text-destructive'
                        )}
                      >
                        {formatNum(m.stock)}
                      </td>
                      <td className="px-2.5 py-2 text-right tabular-nums text-muted-foreground">
                        {formatNum(m.barStock)}
                      </td>
                      <td className="px-2.5 py-2 text-right tabular-nums">
                        {formatVND(gt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ---------- Giá Vốn report ---------- */

export function CostReport() {
  const transactions = useInventoryStore((s) => s.transactions)
  const materials = useInventoryStore((s) => s.materials)
  const { toast } = useToast()

  const defaultTo = new Date().toISOString().slice(0, 10)
  const defaultFrom = new Date(Date.now() - 30 * 86400000)
    .toISOString()
    .slice(0, 10)
  const [from, setFrom] = React.useState(defaultFrom)
  const [to, setTo] = React.useState(defaultTo)

  // Warehouse stock balance: stock_end = stock_start + receipts − issues_to_bar + kho_adjustments
  // => stock_start = stock_end − receipts + issues_to_bar − kho_adjustments
  // => tieu_thu = stock_start + receipts − stock_end = issues_to_bar − kho_adjustments
  const rows = materials.map((m) => {
    const period = transactions.filter(
      (t) =>
        t.materialId === m.id &&
        t.date >= from &&
        t.date <= to &&
        (t.type === 'NHAP_HANG' ||
          t.type === 'XUAT_KHO_BAR' ||
          t.type === 'KIEM_KE')
    )
    const receipts = period.filter((t) => t.type === 'NHAP_HANG')
    const issues = period.filter((t) => t.type === 'XUAT_KHO_BAR')
    const khoChecks = period.filter((t) => t.type === 'KIEM_KE')

    const nhapQty = receipts.reduce((s, t) => s + t.quantity, 0)
    const nhapValue = receipts.reduce((s, t) => s + t.amount, 0)
    const xuatQty = issues.reduce((s, t) => s + t.quantity, 0)
    const khoAdjust = khoChecks.reduce((s, t) => s + t.quantity, 0) // signed

    const tonCuoi = m.stock
    const tonDau = Math.max(
      0,
      tonCuoi - nhapQty + xuatQty - khoAdjust
    )
    const tieuThu = tonDau + nhapQty - tonCuoi // = xuatQty - khoAdjust
    const tieuThuValue = tieuThu * m.unitPrice
    return {
      material: m,
      tonDau,
      nhapQty,
      xuatQty,
      nhapValue,
      tonCuoi,
      tieuThu,
      tieuThuValue,
    }
  })

  const totalConsumption = rows.reduce((s, r) => s + r.tieuThuValue, 0)
  const totalReceiptValue = rows.reduce((s, r) => s + r.nhapValue, 0)
  const totalIssued = rows.reduce((s, r) => s + r.xuatQty * r.material.unitPrice, 0)

  const handleExport = () => {
    const exportRows = rows.filter(
      (r) => r.tieuThu > 0 || r.nhapQty > 0 || r.xuatQty > 0
    )
    const csvRows: (string | number)[][] = [
      ['NVL', 'Tồn đầu', 'Nhập', 'Xuất Bar', 'Tồn cuối', 'Tiêu thụ', 'Đơn giá', 'Giá vốn'],
      ...exportRows.map((r) => [
        r.material.name,
        r.tonDau,
        r.nhapQty,
        r.xuatQty,
        r.tonCuoi,
        r.tieuThu,
        r.material.unitPrice,
        r.tieuThuValue,
      ]),
      ['', '', '', '', '', '', 'Tổng', totalConsumption],
    ]
    downloadCSV(csvFilename('gia-von'), csvRows)
    toast({
      title: 'Đã xuất CSV',
      description: `${exportRows.length} NVL — file gia-von-*.csv`,
    })
  }

  const handleExportXlsx = () => {
    const exportRows = rows.filter(
      (r) => r.tieuThu > 0 || r.nhapQty > 0 || r.xuatQty > 0
    )
    const xlsxRows: (string | number)[][] = [
      ['NVL', 'Tồn đầu', 'Nhập', 'Xuất Bar', 'Tồn cuối', 'Tiêu thụ', 'Đơn giá', 'Giá vốn'],
      ...exportRows.map((r) => [
        r.material.name,
        r.tonDau,
        r.nhapQty,
        r.xuatQty,
        r.tonCuoi,
        r.tieuThu,
        r.material.unitPrice,
        r.tieuThuValue,
      ]),
      ['', '', '', '', '', '', 'Tổng', totalConsumption],
    ]
    downloadXlsx(xlsxFilename('gia-von'), [{ name: 'Giá Vốn', rows: xlsxRows }])
    toast({
      title: 'Đã xuất Excel',
      description: `${exportRows.length} NVL — file gia-von-*.xls`,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: 0.05 }}
    >
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
              <CardDescription className="mt-1 text-xs">
                Chi phí NVL tiêu thụ theo khoảng ngày
              </CardDescription>
            </div>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleExport}
              >
                <Download className="size-3.5" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleExportXlsx}
              >
                <FileSpreadsheet className="size-3.5" />
                Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* date range */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Từ ngày (C2)
              </Label>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Đến ngày (C3)
              </Label>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* formula */}
          <div className="flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-[11px] text-violet-700 dark:text-violet-300">
            <Info className="size-3.5 shrink-0" />
            <span>
              <strong>Tiêu thụ</strong> = Tồn đầu + Nhập − Tồn cuối
            </span>
          </div>

          {/* totals */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Tiền nhập trong kỳ
              </div>
              <div className="text-sm font-bold text-teal-700 dark:text-teal-300">
                {formatVND(totalReceiptValue)}
              </div>
            </div>
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Xuất sang Bar
              </div>
              <div className="text-sm font-bold text-orange-700 dark:text-orange-300">
                {formatVND(totalIssued)}
              </div>
            </div>
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2">
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                <TrendingUp className="size-3" />
                Giá vốn tiêu thụ
              </div>
              <div className="text-sm font-bold text-violet-700 dark:text-violet-300">
                {formatVND(totalConsumption)}
              </div>
            </div>
          </div>

          {/* table */}
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
                {rows
                  .filter(
                    (r) =>
                      r.tieuThu > 0 ||
                      r.nhapQty > 0 ||
                      r.xuatQty > 0
                  )
                  .map((r) => (
                    <tr
                      key={r.material.id}
                      className="border-t border-border/30 hover:bg-muted/30"
                    >
                      <td className="px-2.5 py-2 truncate font-medium">
                        {r.material.name}
                      </td>
                      <td className="px-2.5 py-2 text-right tabular-nums text-muted-foreground">
                        {formatNum(r.tonDau)}
                      </td>
                      <td className="px-2.5 py-2 text-right tabular-nums text-teal-600 dark:text-teal-300">
                        {formatNum(r.nhapQty)}
                      </td>
                      <td className="px-2.5 py-2 text-right tabular-nums text-orange-600 dark:text-orange-300">
                        {formatNum(r.xuatQty)}
                      </td>
                      <td className="px-2.5 py-2 text-right tabular-nums text-muted-foreground">
                        {formatNum(r.tonCuoi)}
                      </td>
                      <td className="px-2.5 py-2 text-right tabular-nums font-medium text-violet-700 dark:text-violet-300">
                        {formatNum(r.tieuThu)}
                      </td>
                      <td className="px-2.5 py-2 text-right font-medium tabular-nums">
                        {formatVND(r.tieuThuValue)}
                      </td>
                    </tr>
                  ))}
                {rows.filter(
                  (r) => r.tieuThu > 0 || r.nhapQty > 0 || r.xuatQty > 0
                ).length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-2.5 py-8 text-center text-muted-foreground"
                    >
                      Không có dữ liệu trong kỳ.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
