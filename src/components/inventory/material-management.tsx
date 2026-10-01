'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  AlertTriangle,
  Filter,
  ArrowDownUp,
  Boxes,
  Coffee,
} from 'lucide-react'
import {
  initialMaterials,
  categoryLabels,
  categoryStyles,
  unitOptions,
  type Material,
  type MaterialCategory,
} from '@/lib/inventory-data'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n)

const formatNum = (n: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(n)

type SortKey = 'name' | 'unitPrice' | 'stock' | 'barStock'

export function MaterialManagement() {
  const { toast } = useToast()
  const [materials, setMaterials] = React.useState<Material[]>(initialMaterials)
  const [query, setQuery] = React.useState('')
  const [category, setCategory] = React.useState<MaterialCategory | 'all'>('all')
  const [sortKey, setSortKey] = React.useState<SortKey>('name')
  const [sortAsc, setSortAsc] = React.useState(true)
  const [editing, setEditing] = React.useState<Material | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Material | null>(null)

  const filtered = React.useMemo(() => {
    let list = materials.filter((m) => {
      const matchQuery = m.name.toLowerCase().includes(query.toLowerCase())
      const matchCat = category === 'all' || m.category === category
      return matchQuery && matchCat
    })
    list = [...list].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name, 'vi')
          break
        case 'unitPrice':
          cmp = a.unitPrice - b.unitPrice
          break
        case 'stock':
          cmp = a.stock - b.stock
          break
        case 'barStock':
          cmp = a.barStock - b.barStock
          break
      }
      return sortAsc ? cmp : -cmp
    })
    return list
  }, [materials, query, category, sortKey, sortAsc])

  const lowStockCount = materials.filter(
    (m) => m.stock <= m.minStock
  ).length

  const totalValue = materials.reduce(
    (sum, m) => sum + m.unitPrice * m.stock,
    0
  )

  const handleSave = (data: Omit<Material, 'id'> & { id?: string }) => {
    if (data.id) {
      setMaterials((prev) =>
        prev.map((m) => (m.id === data.id ? ({ ...m, ...data } as Material) : m))
      )
      toast({
        title: 'Đã cập nhật nguyên vật liệu',
        description: data.name,
      })
    } else {
      const newMat: Material = {
        ...data,
        id: `m${Date.now()}`,
      } as Material
      setMaterials((prev) => [newMat, ...prev])
      toast({
        title: 'Đã thêm nguyên vật liệu mới',
        description: data.name,
      })
    }
    setDialogOpen(false)
    setEditing(null)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    setMaterials((prev) => prev.filter((m) => m.id !== deleteTarget.id))
    toast({
      title: 'Đã xóa nguyên vật liệu',
      description: deleteTarget.name,
      variant: 'destructive',
    })
    setDeleteTarget(null)
  }

  const openAdd = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (m: Material) => {
    setEditing(m)
    setDialogOpen(true)
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((v) => !v)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  return (
    <section
      id="nguyen-vat-lieu"
      className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="outline" className="mb-2 border-primary/30 bg-primary/5 text-primary">
            <Package className="size-3.5" />
            Quản lý nguyên vật liệu
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Danh mục nguyên vật liệu
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Thêm · bớt · điều chỉnh đơn vị tính và giá thành. Hỗ trợ đơn vị Kho
            (DVT lớn) và đơn vị Bar (DVT nhỏ) với hệ số quy đổi.
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2 rounded-full shadow-sm">
          <Plus className="size-4" />
          Thêm nguyên vật liệu
        </Button>
      </div>

      {/* Summary chips */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          icon={Boxes}
          label="Tổng NVL"
          value={String(materials.length)}
          tone="primary"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Sắp hết hàng"
          value={String(lowStockCount)}
          tone={lowStockCount > 0 ? 'destructive' : 'muted'}
        />
        <SummaryCard
          icon={Coffee}
          label="Hàng tại Bar"
          value={String(materials.length)}
          tone="accent"
        />
        <SummaryCard
          icon={ArrowDownUp}
          label="Giá trị kho"
          value={formatVND(totalValue)}
          tone="primary"
          isCurrency
        />
      </div>

      <Card className="overflow-hidden border-border/60">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm theo tên nguyên vật liệu..."
                  className="h-9 rounded-full pl-9"
                />
              </div>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as MaterialCategory | 'all')}
              >
                <SelectTrigger className="h-9 w-full gap-2 rounded-full sm:w-[180px]">
                  <Filter className="size-3.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {(Object.keys(categoryLabels) as MaterialCategory[]).map(
                    (cat) => (
                      <SelectItem key={cat} value={cat}>
                        {categoryLabels[cat]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              Hiển thị <span className="font-semibold text-foreground">{filtered.length}</span> / {materials.length} mục
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block scrollbar-cream">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">
                    <SortButton label="Tên NVL" active={sortKey === 'name'} asc={sortAsc} onClick={() => toggleSort('name')} />
                  </th>
                  <th className="px-4 py-3 font-medium">Danh mục</th>
                  <th className="px-4 py-3 font-medium">ĐVT Kho</th>
                  <th className="px-4 py-3 font-medium">ĐVT Bar</th>
                  <th className="px-4 py-3 font-medium">Quy đổi</th>
                  <th className="px-4 py-3 text-right font-medium">
                    <SortButton label="Đơn giá" active={sortKey === 'unitPrice'} asc={sortAsc} onClick={() => toggleSort('unitPrice')} align="right" />
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    <SortButton label="Tồn Kho" active={sortKey === 'stock'} asc={sortAsc} onClick={() => toggleSort('stock')} align="right" />
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    <SortButton label="Tồn Bar" active={sortKey === 'barStock'} asc={sortAsc} onClick={() => toggleSort('barStock')} align="right" />
                  </th>
                  <th className="px-4 py-3 text-center font-medium">TT</th>
                  <th className="px-4 py-3 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filtered.map((m) => {
                    const isLow = m.stock <= m.minStock
                    return (
                      <motion.tr
                        key={m.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        className={cn(
                          'border-b border-border/40 transition-colors hover:bg-muted/30',
                          isLow && 'bg-destructive/5'
                        )}
                      >
                        <td className="px-4 py-3 font-medium">{m.name}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
                              categoryStyles[m.category]
                            )}
                          >
                            {categoryLabels[m.category]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{m.unit}</td>
                        <td className="px-4 py-3 text-muted-foreground">{m.unitBar ?? '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {m.convertFactor ? `1 = ${formatNum(m.convertFactor)}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatVND(m.unitPrice)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className={cn(isLow && 'font-semibold text-destructive')}>
                            {formatNum(m.stock)} {m.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {formatNum(m.barStock)} {m.unitBar ?? ''}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isLow ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                                    <AlertTriangle className="size-3" />
                                    Sắp hết
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Dưới mức tối thiểu {formatNum(m.minStock)} {m.unit}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                              <span className="size-1.5 rounded-full bg-accent" />
                              Đủ
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => openEdit(m)}
                              aria-label={`Sửa ${m.name}`}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setDeleteTarget(m)}
                              aria-label={`Xóa ${m.name}`}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      Không tìm thấy nguyên vật liệu phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-border/40 md:hidden">
            {filtered.map((m) => {
              const isLow = m.stock <= m.minStock
              return (
                <div key={m.id} className={cn('p-4', isLow && 'bg-destructive/5')}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{m.name}</div>
                      <span
                        className={cn(
                          'mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
                          categoryStyles[m.category]
                        )}
                      >
                        {categoryLabels[m.category]}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(m)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        onClick={() => setDeleteTarget(m)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <Info label="ĐVT Kho / Bar" value={`${m.unit} / ${m.unitBar ?? '—'}`} />
                    <Info label="Quy đổi" value={m.convertFactor ? `1 = ${formatNum(m.convertFactor)}` : '—'} />
                    <Info label="Đơn giá" value={formatVND(m.unitPrice)} />
                    <Info label="Tồn Kho" value={`${formatNum(m.stock)} ${m.unit}`} highlight={isLow} />
                    <Info label="Tồn Bar" value={`${formatNum(m.barStock)} ${m.unitBar ?? ''}`} />
                    <Info label="Trạng thái" value={isLow ? 'Sắp hết' : 'Đủ'} highlight={isLow} />
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                Không tìm thấy nguyên vật liệu phù hợp.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit dialog */}
      <MaterialDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o)
          if (!o) setEditing(null)
        }}
        material={editing}
        onSave={handleSave}
      />

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa nguyên vật liệu?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa <strong>{deleteTarget?.name}</strong>? Hành
              động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

function SortButton({
  label,
  active,
  asc,
  onClick,
  align = 'left',
}: {
  label: string
  active: boolean
  asc: boolean
  onClick: () => void
  align?: 'left' | 'right'
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 transition-colors hover:text-foreground',
        align === 'right' && 'flex-row-reverse',
        active && 'text-foreground'
      )}
    >
      {label}
      <ArrowDownUp className={cn('size-3', active ? 'opacity-100' : 'opacity-30')} />
      {active && (
        <span className="text-[9px]">{asc ? '▲' : '▼'}</span>
      )}
    </button>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
  isCurrency,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  tone: 'primary' | 'accent' | 'destructive' | 'muted'
  isCurrency?: boolean
}) {
  const tones = {
    primary: 'text-primary bg-primary/10 ring-primary/20',
    accent: 'text-accent-foreground bg-accent/15 ring-accent/30',
    destructive: 'text-destructive bg-destructive/10 ring-destructive/25',
    muted: 'text-muted-foreground bg-muted ring-border',
  }
  return (
    <Card className="flex items-center gap-3 border-border/60 p-3">
      <div className={cn('grid size-10 shrink-0 place-items-center rounded-lg ring-1', tones[tone])}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <div className={cn('font-bold leading-tight', isCurrency ? 'text-sm sm:text-base' : 'text-lg')}>
          {value}
        </div>
        <div className="truncate text-[11px] text-muted-foreground">{label}</div>
      </div>
    </Card>
  )
}

function Info({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={cn('font-medium', highlight && 'text-destructive')}>
        {value}
      </div>
    </div>
  )
}

/* ---------- Add / Edit Dialog ---------- */

function MaterialDialog({
  open,
  onOpenChange,
  material,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  material: Material | null
  onSave: (data: Omit<Material, 'id'> & { id?: string }) => void
}) {
  const isEdit = !!material
  const [form, setForm] = React.useState<Omit<Material, 'id'>>({
    name: '',
    category: 'tra',
    unit: 'kg',
    unitBar: 'g',
    convertFactor: 1000,
    unitPrice: 0,
    stock: 0,
    barStock: 0,
    minStock: 0,
  })

  React.useEffect(() => {
    if (material) {
      const { id: _id, ...rest } = material
      setForm(rest)
    } else {
      setForm({
        name: '',
        category: 'tra',
        unit: 'kg',
        unitBar: 'g',
        convertFactor: 1000,
        unitPrice: 0,
        stock: 0,
        barStock: 0,
        minStock: 0,
      })
    }
  }, [material, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave({ ...form, id: material?.id })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto scrollbar-cream sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Chỉnh sửa nguyên vật liệu' : 'Thêm nguyên vật liệu mới'}
          </DialogTitle>
          <DialogDescription>
            Cấu hình tên, danh mục, đơn vị tính (Kho & Bar), hệ số quy đổi và
            đơn giá.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="m-name">Tên nguyên vật liệu *</Label>
            <Input
              id="m-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Trà đen Đài Loan"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Danh mục</Label>
            <Select
              value={form.category}
              onValueChange={(v) =>
                setForm({ ...form, category: v as MaterialCategory })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(categoryLabels) as MaterialCategory[]).map(
                  (cat) => (
                    <SelectItem key={cat} value={cat}>
                      {categoryLabels[cat]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Units */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>ĐVT Kho (lớn)</Label>
              <Select
                value={form.unit}
                onValueChange={(v) => setForm({ ...form, unit: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>ĐVT Bar (nhỏ)</Label>
              <Select
                value={form.unitBar ?? ''}
                onValueChange={(v) => setForm({ ...form, unitBar: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="m-convert">Hệ số quy đổi (1 ĐVT Kho = ? ĐVT Bar)</Label>
            <Input
              id="m-convert"
              type="number"
              min={0}
              step="0.001"
              value={form.convertFactor ?? 0}
              onChange={(e) =>
                setForm({ ...form, convertFactor: Number(e.target.value) })
              }
            />
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <Label htmlFor="m-price">Đơn giá (theo ĐVT Kho) — VNĐ</Label>
            <Input
              id="m-price"
              type="number"
              min={0}
              value={form.unitPrice}
              onChange={(e) =>
                setForm({ ...form, unitPrice: Number(e.target.value) })
              }
            />
            {form.unitPrice > 0 && (
              <p className="text-xs text-muted-foreground">
                ≈ {formatVND(form.unitPrice / (form.convertFactor || 1))} / {form.unitBar}
              </p>
            )}
          </div>

          {/* Stocks */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="m-stock">Tồn Kho</Label>
              <Input
                id="m-stock"
                type="number"
                min={0}
                step="0.001"
                value={form.stock}
                onChange={(e) =>
                  setForm({ ...form, stock: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-bar">Tồn Bar</Label>
              <Input
                id="m-bar"
                type="number"
                min={0}
                value={form.barStock}
                onChange={(e) =>
                  setForm({ ...form, barStock: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-min">Tối thiểu</Label>
              <Input
                id="m-min"
                type="number"
                min={0}
                step="0.001"
                value={form.minStock}
                onChange={(e) =>
                  setForm({ ...form, minStock: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit">
              {isEdit ? 'Lưu thay đổi' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
