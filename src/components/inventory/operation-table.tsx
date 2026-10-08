'use client'

import * as React from 'react'
import { Search, Save, RotateCcw, Inbox, Calendar, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { OperationMaterial } from '@/lib/use-operation-materials'
import { matchVi } from '@/lib/vi-search'
import { cn } from '@/lib/utils'

interface OperationTableProps {
  dateLabel?: string
  date?: string
  onDateChange?: (d: string) => void
  note: string
  onNoteChange: (n: string) => void
  columns: { key: string; label: string; className?: string; width?: string }[]
  renderCell: (m: OperationMaterial, colKey: string) => React.ReactNode
  renderSummary?: (rows: OperationMaterial[]) => React.ReactNode
  emptyText?: string
  onSave: () => void
  saveLabel: string
  saveDisabled?: boolean
  saving?: boolean
  materials: OperationMaterial[]
  loading?: boolean
}

export function OperationTable({
  dateLabel,
  date,
  onDateChange,
  note,
  onNoteChange,
  columns,
  renderCell,
  renderSummary,
  emptyText = 'Không có nguyên vật liệu phù hợp.',
  onSave,
  saveLabel,
  saveDisabled,
  saving,
  materials,
  loading,
}: OperationTableProps) {
  const [query, setQuery] = React.useState('')
  const [categoryId, setCategoryId] = React.useState<string>('all')

  const categories = React.useMemo(() => {
    const seen = new Map<string, string>()
    materials.forEach((m) => seen.set(m.categoryId, m.categoryName))
    return Array.from(seen, ([id, name]) => ({ id, name }))
  }, [materials])

  const filtered = React.useMemo(() => {
    return materials.filter((m) => {
      const matchQuery = matchVi(m.name, query)
      const matchCat = categoryId === 'all' || m.categoryId === categoryId
      return matchQuery && matchCat
    })
  }, [materials, query, categoryId])

  if (loading) {
    return (
      <Card className="grid place-items-center border-border/60 py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-border/60">
      {/* Toolbar */}
      <div className="border-b border-border/60 bg-muted/30 p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end">
            {dateLabel && date !== undefined && onDateChange && (
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {dateLabel}
                </Label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="h-9 w-full pl-8 sm:w-[160px]"
                  />
                </div>
              </div>
            )}
            <div className="flex-1 space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Ghi chú
              </Label>
              <Input
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="VD: Nhập lô chiều, kiểm kê cuối ngày..."
                className="h-9"
              />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm NVL..."
                className="h-9 w-full pl-8 sm:w-[180px]"
              />
            </div>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nhóm</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-cream">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2.5 font-medium" style={{ minWidth: 200 }}>
                Nguyên vật liệu
              </th>
              <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Nhóm</th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn('px-3 py-2.5 text-right font-medium', col.className)}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-border/40 transition-colors hover:bg-muted/20">
                <td className="px-3 py-2">
                  <div className="font-medium">{m.name}</div>
                  <div className="text-[10px] text-muted-foreground sm:hidden">{m.categoryName}</div>
                </td>
                <td className="hidden px-3 py-2 text-muted-foreground sm:table-cell">{m.categoryName}</td>
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-2 py-2', col.className)}>
                    {renderCell(m, col.key)}
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={2 + columns.length} className="px-3 py-12 text-center text-sm text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Inbox className="size-6 opacity-40" />
                    {emptyText}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          {renderSummary && filtered.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-border/60 bg-muted/40 font-semibold">
                {renderSummary(filtered)}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-muted/20 px-3 py-3 sm:px-4">
        <span className="text-xs text-muted-foreground">
          {filtered.length} / {materials.length} nguyên vật liệu
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setQuery(''); setCategoryId('all') }}
            className="gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            Xóa lọc
          </Button>
          <Button size="sm" onClick={onSave} disabled={saveDisabled || saving} className="gap-1.5">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            {saveLabel}
          </Button>
        </div>
      </div>
    </Card>
  )
}

/* ============ Small editable cell input ============ */

export function NumberCell({
  value,
  onChange,
  placeholder,
  min = 0,
  step = '0.001',
  className,
  disabled,
}: {
  value: number | string
  onChange: (v: number) => void
  placeholder?: string
  min?: number
  step?: string
  className?: string
  disabled?: boolean
}) {
  return (
    <Input
      type="number"
      min={min}
      step={step}
      value={value === 0 ? '' : value}
      onChange={(e) => onChange(Number(e.target.value))}
      placeholder={placeholder ?? '0'}
      disabled={disabled}
      className={cn('h-8 w-full text-right tabular-nums', className)}
    />
  )
}

/* ============ Static info cell ============ */

export function InfoCell({
  value,
  tone,
  className,
}: {
  value: React.ReactNode
  tone?: 'default' | 'muted' | 'primary' | 'destructive' | 'accent'
  className?: string
}) {
  const tones = {
    default: 'text-foreground',
    muted: 'text-muted-foreground',
    primary: 'text-primary font-semibold',
    destructive: 'text-destructive font-semibold',
    accent: 'text-accent-foreground font-semibold',
  }
  return (
    <div className={cn('px-1 text-right tabular-nums', tones[tone ?? 'default'], className)}>
      {value}
    </div>
  )
}
