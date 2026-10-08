'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { PackagePlus } from 'lucide-react'
import { PageHeader, PageContainer } from '@/components/inventory/page-header'
import { OperationTable, NumberCell, InfoCell } from '@/components/inventory/operation-table'
import { useStore } from '@/lib/store-context'
import { useOperationMaterials, type OperationMaterial } from '@/lib/use-operation-materials'
import { formatVND, formatNum } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'

interface ReceiptRow {
  qty: number
  price: number
  selected: boolean
}

export default function NhapHangPage() {
  const { selectedStore } = useStore()

  return (
    <PageContainer>
      <PageHeader
        icon={PackagePlus}
        title="Nhập Hàng"
        code="NHAP_HANG"
        description="Ghi nhận lô hàng nhập kho từ nhà cung cấp. Chọn nhiều NVL, nhập số lượng & đơn giá, lưu cùng lúc."
      />
      {!selectedStore ? (
        <Card className="border-border/60">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Chưa chọn cửa hàng — chọn cửa hàng ở góc trên bên phải để tiếp tục.
          </CardContent>
        </Card>
      ) : (
        <NhapHangGrid storeId={selectedStore.id} brandId={selectedStore.brand_id} />
      )}
    </PageContainer>
  )
}

function NhapHangGrid({ storeId, brandId }: { storeId: string; brandId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const { loading, materials, reload } = useOperationMaterials(storeId, brandId)

  const [note, setNote] = React.useState('')
  const [rows, setRows] = React.useState<Record<string, ReceiptRow>>({})
  const [saving, setSaving] = React.useState(false)

  const getRow = (mId: string): ReceiptRow => rows[mId] ?? { qty: 0, price: 0, selected: false }
  const updateRow = (mId: string, patch: Partial<ReceiptRow>) =>
    setRows((prev) => ({ ...prev, [mId]: { ...getRow(mId), ...patch } }))

  const ensurePrice = (m: OperationMaterial) => {
    const r = getRow(m.id)
    if (r.price === 0 && m.price) updateRow(m.id, { price: m.price })
  }

  const selectedRows = materials.filter((m) => {
    const r = getRow(m.id)
    return r.selected && r.qty > 0
  })
  const totalAmount = selectedRows.reduce((sum, m) => sum + getRow(m.id).qty * getRow(m.id).price, 0)
  const totalQty = selectedRows.reduce((sum, m) => sum + getRow(m.id).qty, 0)

  const handleSave = async () => {
    if (selectedRows.length === 0) {
      toast({
        title: 'Chưa chọn nguyên vật liệu',
        description: 'Hãy tick chọn và nhập số lượng cho ít nhất 1 NVL.',
        variant: 'destructive',
      })
      return
    }
    setSaving(true)
    let okCount = 0
    for (const m of selectedRows) {
      const r = getRow(m.id)
      const { error } = await supabase.rpc('record_receipt', {
        p_store_id: storeId,
        p_material_id: m.id,
        p_quantity: r.qty,
        p_unit_price: r.price,
        p_note: note || undefined,
      })
      if (error) {
        toast({ title: `Lỗi khi nhập "${m.name}"`, description: error.message, variant: 'destructive' })
      } else {
        okCount++
      }
    }
    setSaving(false)
    if (okCount > 0) {
      toast({
        title: `Đã ghi nhận ${okCount} phiếu nhập`,
        description: `${formatNum(totalQty)} tổng SL · ${formatVND(totalAmount)}`,
      })
      await reload()
      setRows({})
      router.push('/lich-su')
    }
  }

  return (
    <OperationTable
      loading={loading}
      dateLabel={undefined}
      note={note}
      onNoteChange={setNote}
      materials={materials}
      onSave={handleSave}
      saving={saving}
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
                if (e.target.checked) ensurePrice(m)
              }}
              className="size-4 cursor-pointer rounded border-border accent-primary"
              aria-label={`Chọn ${m.name}`}
            />
          )
        }
        if (colKey === 'current') {
          return <InfoCell value={`${formatNum(m.khoStock)} ${m.unitKhoCode}`} tone="muted" />
        }
        if (colKey === 'qty') {
          return (
            <NumberCell
              value={r.qty}
              onChange={(v) => {
                updateRow(m.id, { qty: v, selected: v > 0 ? true : r.selected })
                if (v > 0) ensurePrice(m)
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
          return <InfoCell value={amt > 0 ? formatVND(amt) : '—'} tone={amt > 0 ? 'primary' : 'muted'} />
        }
        return null
      }}
      renderSummary={() => (
        <>
          <td className="px-3 py-2.5" colSpan={3}>{selectedRows.length} NVL được chọn</td>
          <td className="px-3 py-2.5 text-right tabular-nums">{formatNum(totalQty)}</td>
          <td className="px-3 py-2.5" />
          <td className="px-3 py-2.5 text-right tabular-nums text-primary">{formatVND(totalAmount)}</td>
        </>
      )}
    />
  )
}
