'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PackagePlus,
  ArrowRightLeft,
  ClipboardCheck,
  Coffee,
  Calendar,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { MaterialCombobox } from '@/components/inventory/material-combobox'
import { useInventoryStore } from '@/lib/inventory-store'
import { formatVND, formatNum, formatDate } from '@/lib/inventory-stats'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { InventoryOperation } from '@/lib/inventory-data'

export type ActiveOp = InventoryOperation | null

export interface ReceiptPrefill {
  materialId: string
  quantity: number
}

interface OperationDialogsProps {
  operation: ActiveOp
  onOpenChange: (o: boolean) => void
  prefill?: ReceiptPrefill | null
}

export function OperationDialogs({
  operation,
  onOpenChange,
  prefill,
}: OperationDialogsProps) {
  const open = !!operation
  if (!operation) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] overflow-y-auto scrollbar-cream sm:max-w-[560px]">
        <OpForm operation={operation} onDone={() => onOpenChange(false)} prefill={prefill} />
      </DialogContent>
    </Dialog>
  )
}

function OpForm({
  operation,
  onDone,
  prefill,
}: {
  operation: InventoryOperation
  onDone: () => void
  prefill?: ReceiptPrefill | null
}) {
  switch (operation.id) {
    case 'nhap-hang':
      return <ReceiptForm onDone={onDone} prefill={prefill} />
    case 'xuat-kho-bar':
      return <IssueForm onDone={onDone} />
    case 'kiem-kho':
      return <WarehouseCountForm onDone={onDone} />
    case 'kiem-bar':
      return <BarCountForm onDone={onDone} />
    default:
      return <ReportNotice operation={operation} onDone={onDone} />
  }
}

/* ---------- shared building blocks ---------- */

function OpHeader({
  icon: Icon,
  accent,
  title,
  code,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  accent: string
  title: string
  code: string
  description: string
}) {
  return (
    <div className="op-header">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ring-1 ring-border/40',
            accent
          )}
        >
          <Icon className="size-6" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold leading-none">{title}</h2>
            <Badge variant="secondary" className="font-mono text-[10px]">
              {code}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function useMaterialOptions() {
  const materials = useInventoryStore((s) => s.materials)
  return materials
}

function MaterialSummary({ materialId }: { materialId: string }) {
  const materials = useMaterialOptions()
  const m = materials.find((x) => x.id === materialId)
  if (!m) return null
  const isLow = m.stock <= m.minStock
  return (
    <Card className="border-border/60 bg-muted/30">
      <CardContent className="grid grid-cols-3 gap-3 p-3 text-center">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Tồn Kho
          </div>
          <div className={cn('text-sm font-bold', isLow && 'text-destructive')}>
            {formatNum(m.stock)} {m.unit}
          </div>
        </div>
        <div className="border-x border-border/40">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Tồn Bar
          </div>
          <div className="text-sm font-bold">
            {formatNum(m.barStock)} {m.unitBar ?? m.unit}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Đơn giá
          </div>
          <div className="text-sm font-bold">{formatVND(m.unitPrice)}</div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ---------- Nhập Hàng ---------- */

export function ReceiptForm({
  onDone,
  prefill,
}: {
  onDone: () => void
  prefill?: ReceiptPrefill | null
}) {
  const { toast } = useToast()
  const materials = useMaterialOptions()
  const recordReceipt = useInventoryStore((s) => s.recordReceipt)

  const [materialId, setMaterialId] = React.useState(
    prefill?.materialId ?? materials[0]?.id ?? ''
  )
  const [quantity, setQuantity] = React.useState(prefill?.quantity ?? 0)
  const [unitPrice, setUnitPrice] = React.useState(0)
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = React.useState(
    prefill ? 'Nhập bổ sung theo gợi ý' : ''
  )
  const [expiryDate, setExpiryDate] = React.useState<string>('')
  const [updateExpiry, setUpdateExpiry] = React.useState(false)

  const selected = materials.find((m) => m.id === materialId)
  React.useEffect(() => {
    if (selected && unitPrice === 0) setUnitPrice(selected.unitPrice)
  }, [selected, unitPrice])
  // when toggling "update expiry" on, prefill with current expiry if any
  React.useEffect(() => {
    if (updateExpiry && selected && !expiryDate) {
      setExpiryDate(selected.expiryDate ?? '')
    }
  }, [updateExpiry, selected, expiryDate])

  const amount = quantity * unitPrice

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!materialId || quantity <= 0) return
    recordReceipt({
      materialId,
      quantity,
      unitPrice,
      date,
      note,
      expiryDate: updateExpiry ? expiryDate || undefined : undefined,
    })
    toast({
      title: 'Đã ghi nhận nhập hàng',
      description: `${selected?.name}: +${formatNum(quantity)} ${selected?.unit} · ${formatVND(amount)}`,
    })
    onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-3">
        <Field label="Nguyên vật liệu">
          <MaterialCombobox
            materials={materials}
            value={materialId}
            onChange={setMaterialId}
          />
        </Field>
        {materialId && <MaterialSummary materialId={materialId} />}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Số lượng" htmlFor="qty">
            <Input
              id="qty"
              type="number"
              min={0}
              step="0.001"
              value={quantity || ''}
              onChange={(e) => setQuantity(Number(e.target.value))}
              placeholder="0"
              required
            />
          </Field>
          <Field label="Đơn giá (VNĐ)" htmlFor="price">
            <Input
              id="price"
              type="number"
              min={0}
              value={unitPrice || ''}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
              placeholder="0"
              required
            />
          </Field>
        </div>
        <Field label="Ngày nhận" htmlFor="date">
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-9"
              required
            />
          </div>
        </Field>
        <Field label="Ghi chú">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="VD: Lô từ NCC Minh Long, hạn sử dụng..."
            className="min-h-[60px] resize-none"
          />
        </Field>

        {/* Expiry toggle */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
          <label className="flex cursor-pointer items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Cập nhật hạn sử dụng cho lô này
            </span>
            <Switch checked={updateExpiry} onCheckedChange={setUpdateExpiry} />
          </label>
          {updateExpiry && (
            <div className="mt-3 space-y-1.5">
              <Label htmlFor="r-expiry" className="text-xs text-muted-foreground">
                Hạn sử dụng mới
              </Label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="r-expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="pl-9"
                />
              </div>
              {selected?.expiryDate && !expiryDate && (
                <p className="text-[11px] text-muted-foreground">
                  Hạn hiện tại: {formatDate(selected.expiryDate)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {amount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <span className="flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-300">
            <TrendingUp className="size-4" />
            Thành tiền tự tính
          </span>
          <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
            {formatVND(amount)}
          </span>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>Hủy</Button>
        <Button type="submit" className="gap-2">
          <CheckCircle2 className="size-4" />
          Ghi nhận nhập hàng
        </Button>
      </DialogFooter>
    </form>
  )
}

/* ---------- Xuất Kho Ra Bar ---------- */

export function IssueForm({ onDone }: { onDone: () => void }) {
  const { toast } = useToast()
  const materials = useMaterialOptions()
  const recordIssue = useInventoryStore((s) => s.recordIssue)

  const [materialId, setMaterialId] = React.useState(materials[0]?.id ?? '')
  const [quantity, setQuantity] = React.useState(0)
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = React.useState('')

  const selected = materials.find((m) => m.id === materialId)
  const barQty = selected ? quantity * (selected.convertFactor ?? 1) : 0
  const overIssue = selected ? quantity > selected.stock : false

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!materialId || quantity <= 0) return
    if (overIssue) {
      toast({
        title: 'Không đủ tồn kho',
        description: `Tồn kho chỉ còn ${formatNum(selected?.stock ?? 0)} ${selected?.unit}`,
        variant: 'destructive',
      })
      return
    }
    recordIssue({ materialId, quantity, date, note })
    toast({
      title: 'Đã xuất kho ra Bar',
      description: `${selected?.name}: −${formatNum(quantity)} ${selected?.unit} kho · +${formatNum(barQty)} ${selected?.unitBar} bar`,
    })
    onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-3">
        <Field label="Nguyên vật liệu">
          <MaterialCombobox
            materials={materials}
            value={materialId}
            onChange={setMaterialId}
          />
        </Field>
        {materialId && <MaterialSummary materialId={materialId} />}
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Số lượng xuất (theo ${selected?.unit ?? 'đơn vị kho'})`} htmlFor="qty">
            <Input
              id="qty"
              type="number"
              min={0}
              step="0.001"
              value={quantity || ''}
              onChange={(e) => setQuantity(Number(e.target.value))}
              placeholder="0"
              required
            />
          </Field>
          <Field label="Ngày xuất" htmlFor="date">
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </Field>
        </div>
        <Field label="Ghi chú">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="VD: Bổ sung quầy bar ca chiều..."
            className="min-h-[60px] resize-none"
          />
        </Field>
      </div>

      {overIssue && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          Số lượng xuất vượt tồn kho hiện tại ({formatNum(selected?.stock ?? 0)} {selected?.unit}).
        </div>
      )}

      {quantity > 0 && !overIssue && (
        <div className="flex items-center justify-between rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3">
          <span className="flex items-center gap-1.5 text-sm text-orange-700 dark:text-orange-300">
            <TrendingDown className="size-4" />
            Quầy Bar sẽ cộng thêm
          </span>
          <span className="text-lg font-bold text-orange-700 dark:text-orange-300">
            +{formatNum(barQty)} {selected?.unitBar ?? selected?.unit}
          </span>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>Hủy</Button>
        <Button type="submit" className="gap-2">
          <CheckCircle2 className="size-4" />
          Xuất kho ra Bar
        </Button>
      </DialogFooter>
    </form>
  )
}

/* ---------- Kiểm Kho (warehouse count) ---------- */

export function WarehouseCountForm({ onDone }: { onDone: () => void }) {
  const { toast } = useToast()
  const materials = useMaterialOptions()
  const recordWarehouseCount = useInventoryStore((s) => s.recordWarehouseCount)

  const [materialId, setMaterialId] = React.useState(materials[0]?.id ?? '')
  const [counted, setCounted] = React.useState(0)
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = React.useState('')

  const selected = materials.find((m) => m.id === materialId)
  React.useEffect(() => {
    if (selected) setCounted(selected.stock)
  }, [selected?.id])

  const diff = selected ? counted - selected.stock : 0

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!materialId || counted < 0) return
    recordWarehouseCount({ materialId, counted, date, note })
    toast({
      title: 'Đã ghi nhận kiểm kho',
      description: `${selected?.name}: điều chỉnh ${diff >= 0 ? '+' : ''}${formatNum(diff)} ${selected?.unit}`,
    })
    onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-3">
        <Field label="Nguyên vật liệu">
          <MaterialCombobox
            materials={materials}
            value={materialId}
            onChange={setMaterialId}
          />
        </Field>
        {materialId && <MaterialSummary materialId={materialId} />}
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Số đếm thực tế (${selected?.unit ?? 'đơn vị'})`} htmlFor="counted">
            <Input
              id="counted"
              type="number"
              min={0}
              step="0.001"
              value={counted || ''}
              onChange={(e) => setCounted(Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Ngày kiểm" htmlFor="date">
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </Field>
        </div>
        <Field label="Ghi chú">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="VD: Lệch số do hao hụt..."
            className="min-h-[60px] resize-none"
          />
        </Field>
      </div>

      {selected && diff !== 0 && (
        <div
          className={cn(
            'flex items-center justify-between rounded-xl border px-4 py-3',
            diff > 0
              ? 'border-teal-500/20 bg-teal-500/5 text-teal-700 dark:text-teal-300'
              : 'border-rose-500/20 bg-rose-500/5 text-rose-700 dark:text-rose-300'
          )}
        >
          <span className="flex items-center gap-1.5 text-sm">
            {diff > 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
            Chênh lệch sẽ ghi nhận
          </span>
          <span className="text-lg font-bold">
            {diff > 0 ? '+' : ''}{formatNum(diff)} {selected.unit}
          </span>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>Hủy</Button>
        <Button type="submit" className="gap-2">
          <CheckCircle2 className="size-4" />
          Ghi nhận kiểm kho
        </Button>
      </DialogFooter>
    </form>
  )
}

/* ---------- Kiểm Bar (bar count) ---------- */

export function BarCountForm({ onDone }: { onDone: () => void }) {
  const { toast } = useToast()
  const materials = useMaterialOptions()
  const recordBarCount = useInventoryStore((s) => s.recordBarCount)

  const [materialId, setMaterialId] = React.useState(materials[0]?.id ?? '')
  const [counted, setCounted] = React.useState(0)
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = React.useState('')

  const selected = materials.find((m) => m.id === materialId)
  React.useEffect(() => {
    if (selected) setCounted(selected.barStock)
  }, [selected?.id])

  const diff = selected ? counted - selected.barStock : 0

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!materialId || counted < 0) return
    recordBarCount({ materialId, counted, date, note })
    toast({
      title: 'Đã ghi nhận kiểm bar',
      description: `${selected?.name}: điều chỉnh ${diff >= 0 ? '+' : ''}${formatNum(diff)} ${selected?.unitBar ?? selected?.unit} (ảnh hưởng giá vốn)`,
    })
    onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-3">
        <Field label="Nguyên vật liệu">
          <MaterialCombobox
            materials={materials}
            value={materialId}
            onChange={setMaterialId}
          />
        </Field>
        {materialId && <MaterialSummary materialId={materialId} />}
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Số đếm thực tế (${selected?.unitBar ?? 'đơn vị bar'})`} htmlFor="counted">
            <Input
              id="counted"
              type="number"
              min={0}
              step="0.001"
              value={counted || ''}
              onChange={(e) => setCounted(Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Ngày kiểm" htmlFor="date">
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </Field>
        </div>
        <Field label="Ghi chú">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="VD: Kiểm bar cuối ca..."
            className="min-h-[60px] resize-none"
          />
        </Field>
      </div>

      {selected && diff !== 0 && (
        <div
          className={cn(
            'flex items-center justify-between rounded-xl border px-4 py-3',
            diff > 0
              ? 'border-teal-500/20 bg-teal-500/5 text-teal-700 dark:text-teal-300'
              : 'border-rose-500/20 bg-rose-500/5 text-rose-700 dark:text-rose-300'
          )}
        >
          <span className="flex items-center gap-1.5 text-sm">
            {diff > 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
            Chênh lệch tại Bar
          </span>
          <span className="text-lg font-bold">
            {diff > 0 ? '+' : ''}{formatNum(diff)} {selected.unitBar ?? selected.unit}
          </span>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>Hủy</Button>
        <Button type="submit" className="gap-2">
          <CheckCircle2 className="size-4" />
          Ghi nhận kiểm bar
        </Button>
      </DialogFooter>
    </form>
  )
}

/* ---------- Report notice (Tồn Kho / Giá Vốn) ---------- */

function ReportNotice({
  operation,
  onDone,
}: {
  operation: InventoryOperation
  onDone: () => void
}) {
  return (
    <>
      <OpHeader
        icon={operation.icon}
        accent={operation.accent}
        title={operation.title}
        code={operation.code}
        description={operation.description}
      />
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 text-sm text-violet-700 dark:text-violet-300">
        Đây là báo cáo chỉ xem. Vui lòng tra cứu tại phần <strong>Báo cáo</strong> bên dưới —
        dữ liệu được tổng hợp tự động từ các nghiệp vụ thao tác.
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>Đóng</Button>
        <Button onClick={onDone}>
          Đã hiểu
        </Button>
      </DialogFooter>
    </>
  )
}
