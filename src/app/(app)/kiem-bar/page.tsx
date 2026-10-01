'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Coffee } from 'lucide-react'
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

export default function KiemBarPage() {
  const router = useRouter()
  const { toast } = useToast()
  const materials = useInventoryStore((s) => s.materials)
  const recordBarCount = useInventoryStore((s) => s.recordBarCount)

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
    return r.counted - m.barStock
  }
  const totalDiff = selectedRows.reduce((s, m) => s + diffOf(m.id), 0)

  const handleSave = () => {
    if (selectedRows.length === 0) {
      toast({
        title: 'Chưa chọn nguyên vật liệu',
        description: 'Hãy tick chọn và nhập số đếm thực tế tại Bar.',
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
      recordBarCount({
        materialId: m.id,
        counted: getRow(m.id).counted,
        date,
        note: note || undefined,
      })
    })
    toast({
      title: 'Đã ghi nhận kiểm bar',
      description: `${selectedRows.length} NVL · chênh lệch ${totalDiff >= 0 ? '+' : ''}${formatNum(totalDiff)} (ảnh hưởng Giá Vốn)`,
    })
    router.push('/lich-su')
  }

  return (
    <PageContainer>
      <PageHeader
        icon={Coffee}
        title="Kiểm Bar"
        code="KIEM_KE_BAR"
        description="Kiểm kê tồn Quầy Bar theo DVT Bar — nhập số đếm thực tế, hệ thống tính chênh lệch. Ảnh hưởng trực tiếp báo cáo Giá Vốn."
        accent="from-rose-500/15 to-rose-500/5 text-rose-700 dark:text-rose-300"
      />

      <OperationTable
        title="Kiểm Bar"
        dateLabel="Ngày kiểm"
        date={date}
        onDateChange={setDate}
        note={note}
        onNoteChange={setNote}
        materials={materials}
        onSave={handleSave}
        saveLabel={`Lưu ${selectedRows.length} kiểm bar`}
        saveDisabled={selectedRows.length === 0}
        columns={[
          { key: 'select', label: 'Chọn', width: '60px' },
          { key: 'book', label: 'Sổ sách Bar', width: '120px' },
          { key: 'dvt', label: 'ĐVT Bar', width: '90px' },
          { key: 'counted', label: 'Đếm thực tế', width: '130px' },
          { key: 'diff', label: 'Chênh lệch', width: '120px' },
        ]}
        renderCell={(m, colKey) => {
          const r = getRow(m.id)
          const unitBar = m.unitBar ?? m.unit
          if (colKey === 'select') {
            return (
              <input
                type="checkbox"
                checked={r.selected}
                onChange={(e) => {
                  updateRow(m.id, { selected: e.target.checked })
                  if (e.target.checked && r.counted < 0) {
                    updateRow(m.id, { counted: m.barStock })
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
                value={`${formatNum(m.barStock)} ${unitBar}`}
                tone="muted"
              />
            )
          }
          if (colKey === 'dvt') {
            return (
              <InfoCell value={unitBar} tone="muted" className="!text-left" />
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
                value={`${diff >= 0 ? '+' : ''}${formatNum(diff)} ${unitBar}`}
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
              {selectedRows.reduce((s, m) => s + (getRow(m.id).counted < 0 ? 0 : getRow(m.id).counted), 0).toFixed(0)}
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
