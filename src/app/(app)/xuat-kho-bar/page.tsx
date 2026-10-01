'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightLeft } from 'lucide-react'
import { PageHeader, PageContainer } from '@/components/inventory/page-header'
import {
  OperationTable,
  NumberCell,
  InfoCell,
} from '@/components/inventory/operation-table'
import { useInventoryStore } from '@/lib/inventory-store'
import { formatVND, formatNum } from '@/lib/inventory-stats'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface IssueRow {
  qty: number
  selected: boolean
}

export default function XuatKhoBarPage() {
  const router = useRouter()
  const { toast } = useToast()
  const materials = useInventoryStore((s) => s.materials)
  const recordIssue = useInventoryStore((s) => s.recordIssue)

  const [date, setDate] = React.useState(
    new Date().toISOString().slice(0, 10)
  )
  const [note, setNote] = React.useState('')
  const [rows, setRows] = React.useState<Record<string, IssueRow>>({})

  const getRow = (mId: string): IssueRow =>
    rows[mId] ?? { qty: 0, selected: false }
  const updateRow = (mId: string, patch: Partial<IssueRow>) =>
    setRows((prev) => ({ ...prev, [mId]: { ...getRow(mId), ...patch } }))

  const selectedRows = materials.filter((m) => {
    const r = getRow(m.id)
    return r.selected && r.qty > 0
  })

  const totalQty = selectedRows.reduce((s, m) => s + getRow(m.id).qty, 0)
  const totalAmount = selectedRows.reduce((s, m) => {
    const r = getRow(m.id)
    return s + r.qty * m.unitPrice
  }, 0)

  const overIssue = (mId: string) => {
    const m = materials.find((x) => x.id === mId)
    if (!m) return false
    return getRow(mId).qty > m.stock
  }

  const hasOverIssue = selectedRows.some((m) => overIssue(m.id))

  const handleSave = () => {
    if (selectedRows.length === 0) {
      toast({
        title: 'Chưa chọn nguyên vật liệu',
        description: 'Hãy tick chọn và nhập số lượng cho ít nhất 1 NVL.',
        variant: 'destructive',
      })
      return
    }
    if (hasOverIssue) {
      toast({
        title: 'Có NVL xuất vượt tồn kho',
        description: 'Vui lòng kiểm tra lại số lượng xuất.',
        variant: 'destructive',
      })
      return
    }
    selectedRows.forEach((m) => {
      recordIssue({
        materialId: m.id,
        quantity: getRow(m.id).qty,
        date,
        note: note || undefined,
      })
    })
    toast({
      title: 'Đã xuất kho ra Bar',
      description: `${selectedRows.length} NVL · ${formatNum(totalQty)} tổng SL · ${formatVND(totalAmount)}`,
    })
    router.push('/lich-su')
  }

  return (
    <PageContainer>
      <PageHeader
        icon={ArrowRightLeft}
        title="Xuất Kho Ra Bar"
        code="XUAT_KHO_BAR"
        description="Chuyển NVL từ Kho Dự Trữ sang Quầy Bar (nội bộ). Chọn nhiều NVL, nhập SL xuất, lưu cùng lúc. SL xuất > tồn kho sẽ bị chặn."
        accent="from-orange-500/15 to-orange-500/5 text-orange-700 dark:text-orange-300"
      />

      <OperationTable
        title="Xuất Kho Ra Bar"
        dateLabel="Ngày xuất"
        date={date}
        onDateChange={setDate}
        note={note}
        onNoteChange={setNote}
        materials={materials}
        onSave={handleSave}
        saveLabel={`Lưu ${selectedRows.length} phiếu xuất`}
        saveDisabled={selectedRows.length === 0 || hasOverIssue}
        columns={[
          { key: 'select', label: 'Chọn', width: '60px' },
          { key: 'kho', label: 'Tồn Kho', width: '110px' },
          { key: 'bar', label: 'Tồn Bar', width: '110px' },
          { key: 'qty', label: 'SL xuất', width: '110px' },
          { key: 'amount', label: 'Thành tiền', width: '140px' },
        ]}
        renderCell={(m, colKey) => {
          const r = getRow(m.id)
          if (colKey === 'select') {
            return (
              <input
                type="checkbox"
                checked={r.selected}
                onChange={(e) => updateRow(m.id, { selected: e.target.checked })}
                className="size-4 cursor-pointer rounded border-border accent-primary"
                aria-label={`Chọn ${m.name}`}
              />
            )
          }
          if (colKey === 'kho') {
            return (
              <InfoCell
                value={`${formatNum(m.stock)} ${m.unit}`}
                tone="muted"
              />
            )
          }
          if (colKey === 'bar') {
            return (
              <InfoCell
                value={`${formatNum(m.barStock)} ${m.unitBar ?? m.unit}`}
                tone="muted"
              />
            )
          }
          if (colKey === 'qty') {
            const over = overIssue(m.id)
            return (
              <NumberCell
                value={r.qty}
                onChange={(v) =>
                  updateRow(m.id, {
                    qty: v,
                    selected: v > 0 ? true : r.selected,
                  })
                }
                placeholder="0"
                disabled={!r.selected}
                className={cn(over && 'border-destructive text-destructive')}
              />
            )
          }
          if (colKey === 'amount') {
            const amt = r.qty * m.unitPrice
            return (
              <InfoCell
                value={amt > 0 ? formatVND(amt) : '—'}
                tone={amt > 0 ? 'primary' : 'muted'}
              />
            )
          }
          return null
        }}
        renderSummary={(list) => (
          <>
            <td className="px-3 py-2.5" colSpan={4}>
              {selectedRows.length} NVL được chọn
              {hasOverIssue && (
                <span className="ml-2 text-destructive">
                  · có NVL vượt tồn!
                </span>
              )}
            </td>
            <td className="px-3 py-2.5 text-right tabular-nums">
              {formatNum(totalQty)}
            </td>
            <td className="px-3 py-2.5 text-right tabular-nums text-primary">
              {formatVND(totalAmount)}
            </td>
          </>
        )}
      />

      {hasOverIssue && (
        <div className="mt-3 rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Một số NVL có SL xuất vượt tồn kho hiện tại. Vui lòng giảm SL xuất hoặc nhập bổ sung trước.
        </div>
      )}
    </PageContainer>
  )
}
