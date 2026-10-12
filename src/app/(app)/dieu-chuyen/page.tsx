'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Truck } from 'lucide-react'
import { PageHeader, PageContainer } from '@/components/inventory/page-header'
import { OperationTable, NumberCell, InfoCell } from '@/components/inventory/operation-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useStore } from '@/lib/store-context'
import { useOperationMaterials } from '@/lib/use-operation-materials'
import { formatNum } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface TransferRow {
  qty: number
  selected: boolean
}

export default function DieuChuyenPage() {
  const { selectedStore, stores } = useStore()
  const destOptions = selectedStore
    ? stores.filter((s) => s.brand_id === selectedStore.brand_id && s.id !== selectedStore.id)
    : []

  return (
    <PageContainer>
      <PageHeader
        icon={Truck}
        title="Điều Chuyển"
        code="DIEU_CHUYEN"
        description="Chuyển NVL từ Kho Dự Trữ của cửa hàng này sang một cửa hàng khác cùng thương hiệu. Cửa hàng nhận được tự động cộng kho, không tính vào giá vốn."
      />
      {!selectedStore ? (
        <Card className="border-border/60">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Chưa chọn cửa hàng — chọn cửa hàng ở góc trên bên phải để tiếp tục.
          </CardContent>
        </Card>
      ) : destOptions.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Thương hiệu {selectedStore.brand.name} chỉ có 1 cửa hàng — không có cửa hàng khác để điều chuyển đến.
          </CardContent>
        </Card>
      ) : (
        <DieuChuyenGrid storeId={selectedStore.id} brandId={selectedStore.brand_id} destOptions={destOptions} />
      )}
    </PageContainer>
  )
}

function DieuChuyenGrid({
  storeId,
  brandId,
  destOptions,
}: {
  storeId: string
  brandId: string
  destOptions: { id: string; name: string; code: string }[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const { loading, materials, reload } = useOperationMaterials(storeId, brandId)

  const [destStoreId, setDestStoreId] = React.useState(destOptions[0]?.id ?? '')
  const [note, setNote] = React.useState('')
  const [rows, setRows] = React.useState<Record<string, TransferRow>>({})
  const [saving, setSaving] = React.useState(false)

  const getRow = (mId: string): TransferRow => rows[mId] ?? { qty: 0, selected: false }
  const updateRow = (mId: string, patch: Partial<TransferRow>) =>
    setRows((prev) => ({ ...prev, [mId]: { ...getRow(mId), ...patch } }))

  const selectedRows = materials.filter((m) => {
    const r = getRow(m.id)
    return r.selected && r.qty > 0
  })
  const totalQty = selectedRows.reduce((s, m) => s + getRow(m.id).qty, 0)

  const overTransfer = (mId: string) => {
    const m = materials.find((x) => x.id === mId)
    if (!m) return false
    return getRow(mId).qty > m.khoStock
  }
  const hasOverTransfer = selectedRows.some((m) => overTransfer(m.id))

  const handleSave = async () => {
    if (!destStoreId) {
      toast({ title: 'Chưa chọn cửa hàng nhận', variant: 'destructive' })
      return
    }
    if (selectedRows.length === 0) {
      toast({ title: 'Chưa chọn nguyên vật liệu', description: 'Hãy tick chọn và nhập số lượng cho ít nhất 1 NVL.', variant: 'destructive' })
      return
    }
    if (hasOverTransfer) {
      toast({ title: 'Có NVL điều chuyển vượt tồn kho', description: 'Vui lòng kiểm tra lại số lượng.', variant: 'destructive' })
      return
    }
    setSaving(true)
    let okCount = 0
    for (const m of selectedRows) {
      const { error } = await supabase.rpc('record_transfer', {
        p_store_id: storeId,
        p_material_id: m.id,
        p_quantity: getRow(m.id).qty,
        p_dest_store_id: destStoreId,
        p_note: note || undefined,
      })
      if (error) {
        toast({ title: `Lỗi khi điều chuyển "${m.name}"`, description: error.message, variant: 'destructive' })
      } else {
        okCount++
      }
    }
    setSaving(false)
    if (okCount > 0) {
      const destName = destOptions.find((d) => d.id === destStoreId)?.name ?? ''
      toast({
        title: `Đã điều chuyển ${okCount} NVL đến ${destName}`,
        description: `${formatNum(totalQty)} tổng SL`,
      })
      await reload()
      setRows({})
      router.push('/lich-su')
    }
  }

  return (
    <>
      <Card className="mb-4 border-border/60">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
          <span className="text-sm font-medium text-muted-foreground">Cửa hàng nhận</span>
          <Select value={destStoreId} onValueChange={setDestStoreId}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Chọn cửa hàng nhận" />
            </SelectTrigger>
            <SelectContent>
              {destOptions.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <OperationTable
        loading={loading}
        note={note}
        onNoteChange={setNote}
        materials={materials}
        onSave={handleSave}
        saving={saving}
        saveLabel={`Lưu ${selectedRows.length} phiếu điều chuyển`}
        saveDisabled={selectedRows.length === 0 || hasOverTransfer || !destStoreId}
        columns={[
          { key: 'select', label: 'Chọn', width: '60px' },
          { key: 'kho', label: 'Tồn Kho', width: '110px' },
          { key: 'qty', label: 'SL chuyển', width: '110px' },
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
          if (colKey === 'kho') return <InfoCell value={`${formatNum(m.khoStock)} ${m.unitKhoCode}`} tone="muted" />
          if (colKey === 'qty') {
            const over = overTransfer(m.id)
            return (
              <NumberCell
                value={r.qty}
                onChange={(v) => updateRow(m.id, { qty: v, selected: v > 0 ? true : r.selected })}
                placeholder="0"
                disabled={!r.selected}
                className={cn(over && 'border-destructive text-destructive')}
              />
            )
          }
          return null
        }}
        renderSummary={() => (
          <>
            <td className="px-3 py-2.5" colSpan={4}>
              {selectedRows.length} NVL được chọn
              {hasOverTransfer && <span className="ml-2 text-destructive">· có NVL vượt tồn!</span>}
            </td>
            <td className="px-3 py-2.5 text-right tabular-nums">{formatNum(totalQty)}</td>
          </>
        )}
      />
      {hasOverTransfer && (
        <div className="mt-3 rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Một số NVL có SL điều chuyển vượt tồn kho hiện tại. Vui lòng giảm SL hoặc nhập bổ sung trước.
        </div>
      )}
    </>
  )
}
