'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Coffee } from 'lucide-react'
import { PageHeader, PageContainer } from '@/components/inventory/page-header'
import { OperationTable, NumberCell, InfoCell } from '@/components/inventory/operation-table'
import { useStore } from '@/lib/store-context'
import { useOperationMaterials } from '@/lib/use-operation-materials'
import { formatNum } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CountRow {
  counted: number
  selected: boolean
}

export default function KiemBarPage() {
  const { selectedStore } = useStore()
  return (
    <PageContainer>
      <PageHeader
        icon={Coffee}
        title="Kiểm Bar"
        code="KIEM_KE_BAR"
        description="Kiểm kê tồn Quầy Bar theo ĐVT Bar — nhập số đếm thực tế, hệ thống tính chênh lệch. Ảnh hưởng trực tiếp báo cáo Giá Vốn."
      />
      {!selectedStore ? (
        <Card className="border-border/60">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Chưa chọn cửa hàng — chọn cửa hàng ở góc trên bên phải để tiếp tục.
          </CardContent>
        </Card>
      ) : (
        <KiemBarGrid storeId={selectedStore.id} brandId={selectedStore.brand_id} />
      )}
    </PageContainer>
  )
}

function KiemBarGrid({ storeId, brandId }: { storeId: string; brandId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const { loading, materials, reload } = useOperationMaterials(storeId, brandId)

  const [note, setNote] = React.useState('')
  const [rows, setRows] = React.useState<Record<string, CountRow>>({})
  const [saving, setSaving] = React.useState(false)

  const getRow = (mId: string): CountRow => rows[mId] ?? { counted: -1, selected: false }
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

  const handleSave = async () => {
    if (selectedRows.length === 0) {
      toast({ title: 'Chưa chọn nguyên vật liệu', description: 'Hãy tick chọn và nhập số đếm thực tế tại Bar.', variant: 'destructive' })
      return
    }
    const invalid = selectedRows.filter((m) => getRow(m.id).counted < 0)
    if (invalid.length > 0) {
      toast({ title: 'Thiếu số đếm', description: `${invalid.length} NVL chưa nhập số đếm thực tế.`, variant: 'destructive' })
      return
    }
    setSaving(true)
    let okCount = 0
    for (const m of selectedRows) {
      const { error } = await supabase.rpc('record_bar_count', {
        p_store_id: storeId,
        p_material_id: m.id,
        p_counted: getRow(m.id).counted,
        p_note: note || undefined,
      })
      if (error) {
        toast({ title: `Lỗi khi kiểm "${m.name}"`, description: error.message, variant: 'destructive' })
      } else {
        okCount++
      }
    }
    setSaving(false)
    if (okCount > 0) {
      toast({
        title: `Đã ghi nhận kiểm bar ${okCount} NVL`,
        description: `Chênh lệch ${totalDiff >= 0 ? '+' : ''}${formatNum(totalDiff)} (ảnh hưởng Giá Vốn)`,
      })
      await reload()
      setRows({})
      router.push('/lich-su')
    }
  }

  return (
    <OperationTable
      loading={loading}
      note={note}
      onNoteChange={setNote}
      materials={materials}
      onSave={handleSave}
      saving={saving}
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
        if (colKey === 'select') {
          return (
            <input
              type="checkbox"
              checked={r.selected}
              onChange={(e) => {
                updateRow(m.id, { selected: e.target.checked })
                if (e.target.checked && r.counted < 0) updateRow(m.id, { counted: m.barStock })
              }}
              className="size-4 cursor-pointer rounded border-border accent-primary"
              aria-label={`Chọn ${m.name}`}
            />
          )
        }
        if (colKey === 'book') return <InfoCell value={`${formatNum(m.barStock)} ${m.unitBarCode}`} tone="muted" />
        if (colKey === 'dvt') return <InfoCell value={m.unitBarCode} tone="muted" className="!text-left" />
        if (colKey === 'counted') {
          return (
            <NumberCell
              value={r.counted < 0 ? '' : r.counted}
              onChange={(v) => updateRow(m.id, { counted: v, selected: true })}
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
              value={`${diff >= 0 ? '+' : ''}${formatNum(diff)} ${m.unitBarCode}`}
              tone={diff === 0 ? 'muted' : diff > 0 ? 'primary' : 'destructive'}
            />
          )
        }
        return null
      }}
      renderSummary={() => (
        <>
          <td className="px-3 py-2.5" colSpan={3}>{selectedRows.length} NVL được chọn</td>
          <td className="px-3 py-2.5 text-right tabular-nums">
            {formatNum(selectedRows.reduce((s, m) => s + Math.max(getRow(m.id).counted, 0), 0))}
          </td>
          <td
            className={cn(
              'px-3 py-2.5 text-right tabular-nums font-semibold',
              totalDiff > 0 ? 'text-primary' : totalDiff < 0 ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {totalDiff >= 0 ? '+' : ''}{formatNum(totalDiff)}
          </td>
        </>
      )}
    />
  )
}
