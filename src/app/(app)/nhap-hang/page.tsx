'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PackagePlus } from 'lucide-react'
import { PageHeader, PageContainer } from '@/components/inventory/page-header'
import {
  OperationTable,
  NumberCell,
  InfoCell,
} from '@/components/inventory/operation-table'
import { useInventoryStore } from '@/lib/inventory-store'
import { categoryLabels } from '@/lib/inventory-data'
import { formatVND, formatNum } from '@/lib/inventory-stats'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ReceiptRow {
  qty: number
  price: number
  selected: boolean
}

export default function NhapHangPage() {
  return (
    <PageContainer>
      <PageHeader
        icon={PackagePlus}
        title="Nhập Hàng"
        code="NHAP_HANG"
        description="Ghi nhận lô hàng nhập kho từ nhà cung cấp. Chọn nhiều NVL, nhập số lượng & đơn giá, lưu cùng lúc."
        accent="from-amber-500/15 to-amber-500/5 text-amber-700 dark:text-amber-300"
      />
      <React.Suspense fallback={<div className="py-8 text-center text-sm text-muted-foreground">Đang tải…</div>}>
        <NhapHangGrid />
      </React.Suspense>
    </PageContainer>
  )
}

function NhapHangGrid() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const materials = useInventoryStore((s) => s.materials)
  const recordReceipt = useInventoryStore((s) => s.recordReceipt)

  const [date, setDate] = React.useState(
    new Date().toISOString().slice(0, 10)
  )
  const [note, setNote] = React.useState('')
  const [rows, setRows] = React.useState<Record<string, ReceiptRow>>({})

  // prefill from query (quick-receipt from alerts)
  React.useEffect(() => {
    const mid = searchParams.get('mid')
    const qty = Number(searchParams.get('qty'))
    if (mid && qty > 0) {
      setRows((prev) => ({
        ...prev,
        [mid]: { qty, price: 0, selected: true },
      }))
      setNote('Nhập bổ sung theo gợi ý')
    }
  }, [searchParams])

  const getRow = (mId: string): ReceiptRow =>
    rows[mId] ?? { qty: 0, price: 0, selected: false }

  const updateRow = (mId: string, patch: Partial<ReceiptRow>) =>
    setRows((prev) => ({ ...prev, [mId]: { ...getRow(mId), ...patch } }))

  // auto-fill price with material's current unit price on first interaction
  const ensurePrice = (mId: string) => {
    const r = getRow(mId)
    if (r.price === 0) {
      const m = materials.find((x) => x.id === mId)
      if (m) updateRow(mId, { price: m.unitPrice })
    }
  }

  const selectedRows = materials.filter((m) => {
    const r = getRow(m.id)
    return r.selected && r.qty > 0
  })

  const totalAmount = selectedRows.reduce((sum, m) => {
    const r = getRow(m.id)
    return sum + r.qty * r.price
  }, 0)
  const totalQty = selectedRows.reduce((sum, m) => sum + getRow(m.id).qty, 0)

  const handleSave = () => {
    if (selectedRows.length === 0) {
      toast({
        title: 'Chưa chọn nguyên vật liệu',
        description: 'Hãy tick chọn và nhập số lượng cho ít nhất 1 NVL.',
        variant: 'destructive',
      })
      return
    }
    selectedRows.forEach((m) => {
      const r = getRow(m.id)
      recordReceipt({
        materialId: m.id,
        quantity: r.qty,
        unitPrice: r.price,
        date,
        note: note || undefined,
      })
    })
    toast({
      title: 'Đã ghi nhận nhập hàng',
      description: `${selectedRows.length} NVL · ${formatNum(totalQty)} tổng SL · ${formatVND(totalAmount)}`,
    })
    router.push('/lich-su')
  }

  return (
    <OperationTable
      title="Nhập Hàng"
      dateLabel="Ngày nhận"
        date={date}
        onDateChange={setDate}
        note={note}
        onNoteChange={setNote}
        materials={materials}
        onSave={handleSave}
        saveLabel={`Lưu ${selectedRows.length} phiếu nhập`}
        saveDisabled={selectedRows.length === 0}
        columns={[
          { key: 'select', label: 'Chọn', width: '60px' },
          { key: 'current', label: 'Tồn hiện tại', width: '110px' },
          { key: 'qty', label: 'SL nhập', width: '110px' },
          { key: 'price', label: 'Đơn giá', width: '130px' },
          { key: 'amount', label: 'Thành tiền', width: '140px' },
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
                  if (e.target.checked) ensurePrice(m.id)
                }}
                className="size-4 cursor-pointer rounded border-border accent-primary"
                aria-label={`Chọn ${m.name}`}
              />
            )
          }
          if (colKey === 'current') {
            return <InfoCell value={`${formatNum(m.stock)} ${m.unit}`} tone="muted" />
          }
          if (colKey === 'qty') {
            return (
              <NumberCell
                value={r.qty}
                onChange={(v) => {
                  updateRow(m.id, { qty: v, selected: v > 0 ? true : r.selected })
                  if (v > 0) ensurePrice(m.id)
                }}
                placeholder="0"
                disabled={!r.selected}
              />
            )
          }
          if (colKey === 'price') {
            return (
              <NumberCell
                value={r.price}
                onChange={(v) => updateRow(m.id, { price: v })}
                placeholder="0"
                step="1000"
                disabled={!r.selected}
              />
            )
          }
          if (colKey === 'amount') {
            const amt = r.qty * r.price
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
            <td className="px-3 py-2.5" colSpan={3}>
              {selectedRows.length} NVL được chọn
            </td>
            <td className="px-3 py-2.5 text-right tabular-nums">
              {formatNum(totalQty)}
            </td>
            <td className="px-3 py-2.5" />
            <td className="px-3 py-2.5 text-right tabular-nums text-primary">
              {formatVND(totalAmount)}
            </td>
          </>
        )}
      />
  )
}
