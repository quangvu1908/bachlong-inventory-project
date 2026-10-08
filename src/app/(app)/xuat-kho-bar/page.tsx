'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightLeft } from 'lucide-react'
import { PageHeader, PageContainer } from '@/components/inventory/page-header'
import { OperationTable, NumberCell, InfoCell } from '@/components/inventory/operation-table'
import { useStore } from '@/lib/store-context'
import { useOperationMaterials } from '@/lib/use-operation-materials'
import { formatVND, formatNum } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface IssueRow {
  qty: number
  selected: boolean
}

export default function XuatKhoBarPage() {
  const { selectedStore } = useStore()
  return (
    <PageContainer>
      <PageHeader
        icon={ArrowRightLeft}
        title="Xuất Kho Ra Bar"
        code="XUAT_KHO_BAR"
        description="Chuyển NVL từ Kho Dự Trữ sang Quầy Bar (nội bộ). SL xuất > tồn kho sẽ bị chặn."
      />
      {!selectedStore ? (
        <Card className="border-border/60">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Chưa chọn cửa hàng — chọn cửa hàng ở góc trên bên phải để tiếp tục.
          </CardContent>
        </Card>
      ) : (
        <XuatKhoGrid storeId={selectedStore.id} brandId={selectedStore.brand_id} />
      )}
    </PageContainer>
  )
}

function XuatKhoGrid({ storeId, brandId }: { storeId: string; brandId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const { loading, materials, reload } = useOperationMaterials(storeId, brandId)

  const [note, setNote] = React.useState('')
  const [rows, setRows] = React.useState<Record<string, IssueRow>>({})
  const [saving, setSaving] = React.useState(false)

  const getRow = (mId: string): IssueRow => rows[mId] ?? { qty: 0, selected: false }
  const updateRow = (mId: string, patch: Partial<IssueRow>) =>
    setRows((prev) => ({ ...prev, [mId]: { ...getRow(mId), ...patch } }))

  const selectedRows = materials.filter((m) => {
    const r = getRow(m.id)
    return r.selected && r.qty > 0
  })
  const totalQty = selectedRows.reduce((s, m) => s + getRow(m.id).qty, 0)
  const totalAmount = selectedRows.reduce((s, m) => s + getRow(m.id).qty * (m.price ?? 0), 0)

  const overIssue = (mId: string) => {
    const m = materials.find((x) => x.id === mId)
    if (!m) return false
    return getRow(mId).qty > m.khoStock
  }
  const hasOverIssue = selectedRows.some((m) => overIssue(m.id))

  const handleSave = async () => {
    if (selectedRows.length === 0) {
      toast({ title: 'Chưa chọn nguyên vật liệu', description: 'Hãy tick chọn và nhập số lượng cho ít nhất 1 NVL.', variant: 'destructive' })
      return
    }
    if (hasOverIssue) {
      toast({ title: 'Có NVL xuất vượt tồn kho', description: 'Vui lòng kiểm tra lại số lượng xuất.', variant: 'destructive' })
      return
    }
    setSaving(true)
    let okCount = 0
    for (const m of selectedRows) {
      const { error } = await supabase.rpc('record_issue_to_bar', {
        p_store_id: storeId,
        p_material_id: m.id,
        p_quantity: getRow(m.id).qty,
        p_note: note || undefined,
      })
      if (error) {
        toast({ title: `Lỗi khi xuất "${m.name}"`, description: error.message, variant: 'destructive' })
      } else {
        okCount++
      }
    }
    setSaving(false)
    if (okCount > 0) {
      toast({
        title: `Đã xuất kho ra Bar ${okCount} NVL`,
        description: `${formatNum(totalQty)} tổng SL`,
      })
      await reload()
      setRows({})
      router.push('/lich-su')
    }
  }

  return (
    <>
      <OperationTable
        loading={loading}
        note={note}
        onNoteChange={setNote}
        materials={materials}
        onSave={handleSave}
        saving={saving}
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
          if (colKey === 'kho') return <InfoCell value={`${formatNum(m.khoStock)} ${m.unitKhoCode}`} tone="muted" />
          if (colKey === 'bar') return <InfoCell value={`${formatNum(m.barStock)} ${m.unitBarCode}`} tone="muted" />
          if (colKey === 'qty') {
            const over = overIssue(m.id)
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
          if (colKey === 'amount') {
            if (m.price === null) return <InfoCell value="—" tone="muted" />
            const amt = r.qty * m.price
            return <InfoCell value={amt > 0 ? formatVND(amt) : '—'} tone={amt > 0 ? 'primary' : 'muted'} />
          }
          return null
        }}
        renderSummary={() => (
          <>
            <td className="px-3 py-2.5" colSpan={4}>
              {selectedRows.length} NVL được chọn
              {hasOverIssue && <span className="ml-2 text-destructive">· có NVL vượt tồn!</span>}
            </td>
            <td className="px-3 py-2.5 text-right tabular-nums">{formatNum(totalQty)}</td>
            <td className="px-3 py-2.5 text-right tabular-nums text-primary">{formatVND(totalAmount)}</td>
          </>
        )}
      />
      {hasOverIssue && (
        <div className="mt-3 rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Một số NVL có SL xuất vượt tồn kho hiện tại. Vui lòng giảm SL xuất hoặc nhập bổ sung trước.
        </div>
      )}
    </>
  )
}
