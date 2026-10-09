'use client'

import * as React from 'react'
import * as XLSX from 'xlsx'
import {
  FileUp,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  FileSpreadsheet,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader, PageContainer } from '@/components/inventory/page-header'
import { useToast } from '@/hooks/use-toast'
import { useStore } from '@/lib/store-context'
import { supabase } from '@/lib/supabase/client'
import { parseVnNumber } from '@/lib/parse-vn-number'
import { formatNum } from '@/lib/format'
import type { Database } from '@/lib/supabase/database.types'

type Product = Database['public']['Tables']['products']['Row']

type Step = 'upload' | 'map' | 'review' | 'done'

interface ColumnMap {
  nameCol: number | null
  qtyCol: number | null
  dateCol: number | null
  revenueCol: number | null
}

interface ParsedRow {
  sourceName: string
  quantity: number
  soldDate: string
  revenue: number | null
}

interface NameResolution {
  productId: string
  isNewProduct: boolean
  isNewAlias: boolean
}

export default function NhapDoanhThuPage() {
  const { selectedStore } = useStore()
  const { toast } = useToast()

  const [step, setStep] = React.useState<Step>('upload')
  const [fileName, setFileName] = React.useState('')
  const [rawRows, setRawRows] = React.useState<unknown[][]>([])
  const [colMap, setColMap] = React.useState<ColumnMap>({ nameCol: null, qtyCol: null, dateCol: null, revenueCol: null })
  const [singleDate, setSingleDate] = React.useState(new Date().toISOString().slice(0, 10))

  const [products, setProducts] = React.useState<Product[]>([])
  const [aliasByName, setAliasByName] = React.useState<Map<string, string>>(new Map())
  const [resolutions, setResolutions] = React.useState<Record<string, NameResolution>>({})
  const [committing, setCommitting] = React.useState(false)
  const [result, setResult] = React.useState<{ rowCount: number; productCount: number } | null>(null)

  const headers = rawRows[0]?.map((h) => String(h ?? '').trim()) ?? []
  const dataRows = rawRows.slice(1).filter((r) => r.some((c) => c !== undefined && c !== null && String(c).trim() !== ''))

  const loadBrandData = React.useCallback(async (brandId: string) => {
    const [prodRes, aliasRes] = await Promise.all([
      supabase.from('products').select('*').eq('brand_id', brandId).eq('is_active', true).order('name'),
      supabase.from('product_aliases').select('source_name, product_id').eq('brand_id', brandId),
    ])
    setProducts(prodRes.data ?? [])
    setAliasByName(new Map((aliasRes.data ?? []).map((a) => [a.source_name, a.product_id])))
  }, [])

  React.useEffect(() => {
    if (selectedStore) loadBrandData(selectedStore.brand_id)
  }, [selectedStore, loadBrandData])

  const handleFile = async (file: File) => {
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array', cellDates: true })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][]
    if (rows.length < 2) {
      toast({ title: 'File trống', description: 'Không tìm thấy dữ liệu trong file.', variant: 'destructive' })
      return
    }
    setFileName(file.name)
    setRawRows(rows)
    // Đoán cột theo tên tiêu đề, người dùng chỉnh lại ở bước sau nếu đoán sai.
    const h = rows[0].map((v) => String(v ?? '').toLowerCase())
    const guess = (keywords: string[]) => h.findIndex((name) => keywords.some((k) => name.includes(k)))
    setColMap({
      nameCol: guess(['tên món', 'ten mon', 'món', 'mon', 'sản phẩm', 'san pham', 'item', 'product']),
      qtyCol: guess(['số lượng', 'so luong', 'sl', 'qty', 'quantity']),
      dateCol: guess(['ngày', 'ngay', 'date']),
      revenueCol: guess(['doanh thu', 'thành tiền', 'thanh tien', 'revenue', 'total']),
    })
    setStep('map')
  }

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const buildParsedRows = (): ParsedRow[] | null => {
    if (colMap.nameCol === null || colMap.qtyCol === null) return null
    const out: ParsedRow[] = []
    for (const row of dataRows) {
      const name = String(row[colMap.nameCol] ?? '').trim()
      if (!name) continue
      const qty = parseVnNumber(row[colMap.qtyCol])
      if (qty === null) continue
      let soldDate = singleDate
      if (colMap.dateCol !== null) {
        const raw = row[colMap.dateCol]
        if (raw instanceof Date) soldDate = raw.toISOString().slice(0, 10)
        else if (raw) {
          const parsed = new Date(String(raw))
          if (!Number.isNaN(parsed.getTime())) soldDate = parsed.toISOString().slice(0, 10)
        }
      }
      const revenue = colMap.revenueCol !== null ? parseVnNumber(row[colMap.revenueCol]) : null
      out.push({ sourceName: name, quantity: qty, soldDate, revenue })
    }
    return out
  }

  const parsedRows = step === 'review' || step === 'done' ? buildParsedRows() ?? [] : []
  const distinctNames = React.useMemo(() => {
    const m = new Map<string, number>()
    for (const r of parsedRows) m.set(r.sourceName, (m.get(r.sourceName) ?? 0) + r.quantity)
    return [...m.entries()].map(([name, totalQty]) => ({ name, totalQty }))
  }, [parsedRows])

  const goToReview = () => {
    const parsed = buildParsedRows()
    if (!parsed) {
      toast({ title: 'Thiếu cột bắt buộc', description: 'Chọn cột tên món và cột số lượng.', variant: 'destructive' })
      return
    }
    if (parsed.length === 0) {
      toast({ title: 'Không có dòng hợp lệ', description: 'Kiểm tra lại cột đã chọn.', variant: 'destructive' })
      return
    }
    // Khớp tự động: alias đã lưu trước -> tên sản phẩm trùng khớp -> chưa khớp
    const next: Record<string, NameResolution> = {}
    const names = [...new Set(parsed.map((r) => r.sourceName))]
    for (const name of names) {
      const aliasMatch = aliasByName.get(name)
      if (aliasMatch) {
        next[name] = { productId: aliasMatch, isNewProduct: false, isNewAlias: false }
        continue
      }
      const exact = products.find((p) => p.name.trim().toLowerCase() === name.toLowerCase())
      if (exact) {
        next[name] = { productId: exact.id, isNewProduct: false, isNewAlias: true }
        continue
      }
      next[name] = { productId: '', isNewProduct: false, isNewAlias: true }
    }
    setResolutions(next)
    setStep('review')
  }

  const allResolved = distinctNames.every((n) => resolutions[n.name]?.productId)

  const handleCreateProduct = async (sourceName: string) => {
    if (!selectedStore) return
    const { data, error } = await supabase
      .from('products')
      .insert({ brand_id: selectedStore.brand_id, name: sourceName })
      .select()
      .single()
    if (error || !data) {
      toast({ title: 'Không tạo được sản phẩm', description: error?.message, variant: 'destructive' })
      return
    }
    setProducts((prev) => [...prev, data])
    setResolutions((prev) => ({ ...prev, [sourceName]: { productId: data.id, isNewProduct: true, isNewAlias: true } }))
  }

  const handleCommit = async () => {
    if (!selectedStore || !allResolved) return
    setCommitting(true)

    const { data: userRes } = await supabase.auth.getUser()
    const userId = userRes.user?.id
    if (!userId) {
      setCommitting(false)
      toast({ title: 'Phiên đăng nhập hết hạn', variant: 'destructive' })
      return
    }

    const newAliases = distinctNames
      .filter((n) => resolutions[n.name]?.isNewAlias)
      .map((n) => ({
        brand_id: selectedStore.brand_id,
        product_id: resolutions[n.name].productId,
        source_name: n.name,
      }))
    if (newAliases.length > 0) {
      const { error } = await supabase.from('product_aliases').upsert(newAliases, { onConflict: 'brand_id,source_name' })
      if (error) {
        setCommitting(false)
        toast({ title: 'Không lưu được ánh xạ tên món', description: error.message, variant: 'destructive' })
        return
      }
    }

    const { data: importRow, error: importErr } = await supabase
      .from('sales_imports')
      .insert({ store_id: selectedStore.id, file_name: fileName, imported_by: userId, row_count: parsedRows.length })
      .select()
      .single()
    if (importErr || !importRow) {
      setCommitting(false)
      toast({ title: 'Không tạo được lần import', description: importErr?.message, variant: 'destructive' })
      return
    }

    const records = parsedRows.map((r) => ({
      import_id: importRow.id,
      store_id: selectedStore.id,
      product_id: resolutions[r.sourceName].productId,
      sold_date: r.soldDate,
      source_name: r.sourceName,
      quantity: r.quantity,
      revenue: r.revenue,
    }))
    const { error: recordsErr } = await supabase.from('sales_records').insert(records)
    setCommitting(false)
    if (recordsErr) {
      toast({ title: 'Không lưu được dữ liệu bán hàng', description: recordsErr.message, variant: 'destructive' })
      return
    }
    setResult({ rowCount: records.length, productCount: distinctNames.length })
    setStep('done')
  }

  const resetAll = () => {
    setStep('upload')
    setFileName('')
    setRawRows([])
    setColMap({ nameCol: null, qtyCol: null, dateCol: null, revenueCol: null })
    setResolutions({})
    setResult(null)
  }

  if (!selectedStore) {
    return (
      <PageContainer>
        <PageHeader icon={FileUp} title="Nhập Doanh Thu" description="Upload file bán hàng từ phần mềm POS." />
        <Card className="border-border/60">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Chưa chọn cửa hàng.</CardContent>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        icon={FileUp}
        title="Nhập Doanh Thu"
        description={`Upload file CSV/Excel doanh thu bán hàng cho ${selectedStore.name}.`}
      />

      {step === 'upload' && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Chọn file</CardTitle>
            <CardDescription>Hỗ trợ .csv, .xlsx, .xls — xuất từ phần mềm bán hàng đang dùng.</CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border/60 py-14 text-center hover:border-primary/40 hover:bg-muted/30">
              <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Upload className="size-5" />
              </span>
              <span className="text-sm font-medium">Nhấn để chọn file, hoặc kéo thả vào đây</span>
              <span className="text-xs text-muted-foreground">.csv, .xlsx, .xls</span>
              <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onFileInput} />
            </label>
          </CardContent>
        </Card>
      )}

      {step === 'map' && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="size-4" />
              Gán cột dữ liệu
            </CardTitle>
            <CardDescription>
              {fileName} — {dataRows.length} dòng dữ liệu. Chọn cột nào trong file ứng với thông tin nào.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ColumnPicker label="Cột tên món (bắt buộc)" headers={headers} value={colMap.nameCol}
                onChange={(v) => setColMap((c) => ({ ...c, nameCol: v }))} />
              <ColumnPicker label="Cột số lượng (bắt buộc)" headers={headers} value={colMap.qtyCol}
                onChange={(v) => setColMap((c) => ({ ...c, qtyCol: v }))} />
              <ColumnPicker label="Cột ngày bán (tùy chọn)" headers={headers} value={colMap.dateCol}
                onChange={(v) => setColMap((c) => ({ ...c, dateCol: v }))} />
              <ColumnPicker label="Cột doanh thu (tùy chọn)" headers={headers} value={colMap.revenueCol}
                onChange={(v) => setColMap((c) => ({ ...c, revenueCol: v }))} />
            </div>

            {colMap.dateCol === null && (
              <div className="space-y-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <Label className="text-xs text-muted-foreground">
                  File không có cột ngày — áp dụng một ngày cho toàn bộ file
                </Label>
                <Input type="date" value={singleDate} onChange={(e) => setSingleDate(e.target.value)} className="w-48" />
              </div>
            )}

            <div className="rounded-lg border border-border/40">
              <table className="w-full text-xs">
                <thead className="bg-muted/60 text-left text-muted-foreground">
                  <tr>{headers.map((h, i) => <th key={i} className="px-2.5 py-2 font-medium">{h || `(cột ${i + 1})`}</th>)}</tr>
                </thead>
                <tbody>
                  {dataRows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t border-border/30">
                      {headers.map((_, ci) => <td key={ci} className="px-2.5 py-1.5">{String(row[ci] ?? '')}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" className="gap-1.5" onClick={resetAll}>
                <ArrowLeft className="size-4" />Chọn file khác
              </Button>
              <Button className="gap-1.5" onClick={goToReview}>
                Tiếp tục<ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'review' && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Gán tên món vào sản phẩm</CardTitle>
            <CardDescription>
              {parsedRows.length} dòng, {distinctNames.length} tên món khác nhau. Tên đã khớp lần trước sẽ tự động chọn lại.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên trong file</TableHead>
                  <TableHead className="w-24">Tổng SL</TableHead>
                  <TableHead>Khớp với sản phẩm</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distinctNames.map(({ name, totalQty }) => {
                  const res = resolutions[name]
                  return (
                    <TableRow key={name}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell className="tabular-nums">{formatNum(totalQty)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={res?.productId || '__none__'}
                            onValueChange={(v) =>
                              setResolutions((prev) => ({
                                ...prev,
                                [name]: { productId: v === '__none__' ? '' : v, isNewProduct: false, isNewAlias: true },
                              }))
                            }
                          >
                            <SelectTrigger className="h-8 w-64 text-xs"><SelectValue placeholder="Chưa khớp" /></SelectTrigger>
                            <SelectContent>
                              {products.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {res?.productId ? (
                            <Badge variant="secondary" className="gap-1 text-[10px]">
                              <CheckCircle2 className="size-3" />Đã khớp
                            </Badge>
                          ) : (
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleCreateProduct(name)}>
                              + Tạo sản phẩm mới
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {!allResolved && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                <AlertCircle className="size-3.5 shrink-0" />
                Gán hết các tên món còn thiếu trước khi lưu.
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" className="gap-1.5" onClick={() => setStep('map')}>
                <ArrowLeft className="size-4" />Quay lại
              </Button>
              <Button className="gap-1.5" disabled={!allResolved || committing} onClick={handleCommit}>
                {committing && <Loader2 className="size-4 animate-spin" />}
                Lưu dữ liệu bán hàng
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'done' && result && (
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="size-7" />
            </span>
            <div>
              <p className="text-base font-semibold">Đã lưu dữ liệu bán hàng</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {result.rowCount} dòng, {result.productCount} sản phẩm — {selectedStore.name}
              </p>
            </div>
            <Button className="mt-2 gap-1.5" onClick={resetAll}>
              <Upload className="size-4" />Nhập file khác
            </Button>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  )
}

function ColumnPicker({
  label,
  headers,
  value,
  onChange,
}: {
  label: string
  headers: string[]
  value: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select
        value={value === null ? '__none__' : String(value)}
        onValueChange={(v) => onChange(v === '__none__' ? null : Number(v))}
      >
        <SelectTrigger><SelectValue placeholder="Không chọn" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">(không chọn)</SelectItem>
          {headers.map((h, i) => (
            <SelectItem key={i} value={String(i)}>{h || `Cột ${i + 1}`}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
