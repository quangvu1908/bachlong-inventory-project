'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardCheck } from 'lucide-react'
import { PageHeader, PageContainer } from '@/components/inventory/page-header'
import {
  OperationTable,
  NumberCell,
  InfoCell,
} from '@/components/inventory/operation-table'
import { useInventoryStore } from '@/lib/inventory-store'
import { formatNum } from '@/lib/inventory-stats'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface CountRow {
  counted: number
  selected: boolean
}

export default function KiemKhoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const materials = useInventoryStore((s) => s.materials)
  const recordWarehouseCount = useInventoryStore((s) => s.recordWarehouseCount)

  const [date, setDate] = React.useState(
    new Date().toISOString().slice(0, 10)
  )
  const [note, setNote] = React.useState('')
  const [rows, setRows] = React.useState<Record<string, CountRow>>({})

  const getRow = (mId: string): CountRow =>
    rows[mId] ?? { counted: -1, selected: false }
  const updateRow = (mId: string, patch: Partial<CountRow>) =>
    setRows((prev) => ({ ...prev, [mId]: { ...getRow(mId), ...patch } }))

  const selectedRows = materials.filter((m) => getRow(m.id).selected)
  const diffOf = (mId: string) => {
    const m = materials.find((x) => x.id === mId)
    if (!m) return 0
    const r = getRow(mId)
    if (r.counted < 0) return 0
    return r.counted - m.stock
  }
  const totalDiff = selectedRows.reduce((s, m) => s + diffOf(m.id), 0)

  const handleSave = () => {
    if (selectedRows.length === 0) {
      toast({
        title: 'Chưa chọn nguyên vật liệu',
        description: 'Hãy tick chọn và nhập số đếm thực tế.',
        variant: 'destructive',
      })
      return
    }
    const invalid = selectedRows.filter((m) => getRow(m.id).counted < 0)
    if (invalid.length > 0) {
      toast({
        title: 'Thiếu số đếm',
        description: `${invalid.length} NVL chưa nhập số đếm thực tế.`,
        variant: 'destructive',
      })
      return
    }
    selectedRows.forEach((m) => {
      recordWarehouseCount({
        materialId: m.id,
        counted: getRow(m.id).counted,
        date,
        note: note || undefined,
      })
    })
    toast({
      title: 'Đã ghi nhận kiểm kho',
      description: `${selectedRows.length} NVL · chênh lệch ${totalDiff >= 0 ? '+' : ''}${formatNum(totalDiff)}`,
    })
    router.push('/lich-su')
  }

  return (
    <PageContainer>
      <PageHeader
        icon={ClipboardCheck}
        title="Kiểm Kho"
        code="KIEM_KE"
        description="Kiểm kê tồn Kho Dự Trữ — nhập số đếm thực tế, hệ thống tự tính chênh lệch so với sổ sách. Chọn nhiều NVL, lưu cùng lúc."
        accent="from-teal-500/15 to-teal-500/5 text-teal-700 dark:text-teal-300"
      />

      <OperationTable
        title="Kiểm Kho"
        dateLabel="Ngày kiểm"
        date={date}
        onDateChange={setDate}
        note={note}
        onNoteChange={setNote}
        materials={materials}
        onSave={handleSave}
        saveLabel={`Lưu ${selectedRows.length} kiểm kê`}
        saveDisabled={selectedRows.length === 0}
        columns={[
          { key: 'select', label: 'Chọn', width: '60px' },
          { key: 'book', label: 'Sổ sách', width: '110px' },
          { key: 'min', label: 'Tối thiểu', width: '100px' },
          { key: 'counted', label: 'Đếm thực tế', width: '130px' },
          { key: 'diff', label: 'Chênh lệch', width: '120px' },
        ]}
        renderCell={(m, colKey) => {
          const r = getRow(m.id)
          if (colKey === 'select') {
            return (
              <input
                type="checkbox"
                checked={r.selected}
                onChange={(e) => {
                  updateRow(m.id, { selected: e.target.checked })
                  if (e.target.checked && r.counted < 0) {
                    updateRow(m.id, { counted: m.stock })
                  }
                }}
                className="size-4 cursor-pointer rounded border-border accent-primary"
                aria-label={`Chọn ${m.name}`}
              />
            )
          }
          if (colKey === 'book') {
            return (
              <InfoCell
                value={`${formatNum(m.stock)} ${m.unit}`}
                tone="muted"
              />
            )
          }
          if (colKey === 'min') {
            return (
              <InfoCell
                value={`${formatNum(m.minStock)} ${m.unit}`}
                tone="muted"
              />
            )
          }
          if (colKey === 'counted') {
            return (
              <NumberCell
                value={r.counted < 0 ? '' : r.counted}
                onChange={(v) =>
                  updateRow(m.id, {
                    counted: v,
                    selected: true,
                  })
                }
                placeholder="0"
                disabled={!r.selected}
              />
            )
          }
          if (colKey === 'diff') {
            const diff = diffOf(m.id)
            if (r.counted < 0) return <InfoCell value="—" tone="muted" />
            return (
              <InfoCell
                value={`${diff >= 0 ? '+' : ''}${formatNum(diff)} ${m.unit}`}
                tone={
                  diff === 0
                    ? 'muted'
                    : diff > 0
                    ? 'primary'
                    : 'destructive'
                }
              />
            )
          }
          return null
        }}
        renderSummary={(list) => (
          <>
            <td className="px-3 py-2.5" colSpan={4}>
              {selectedRows.length} NVL được chọn
            </td>
            <td className="px-3 py-2.5 text-right tabular-nums">
              {selectedRows.reduce((s, m) => s + (getRow(m.id).counted < 0 ? 0 : getRow(m.id).counted), 0).toFixed(2)}
            </td>
            <td
              className={cn(
                'px-3 py-2.5 text-right tabular-nums font-semibold',
                totalDiff > 0
                  ? 'text-primary'
                  : totalDiff < 0
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              )}
            >
              {totalDiff >= 0 ? '+' : ''}
              {formatNum(totalDiff)}
            </td>
          </>
        )}
      />
    </PageContainer>
  )
}
