'use client'

import * as React from 'react'
import { Ruler, Plus, Pencil, ShieldAlert, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader, PageContainer } from '@/components/inventory/page-header'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth/auth-context'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Unit = Database['public']['Tables']['units']['Row']
type Dimension = Database['public']['Enums']['unit_dimension']

const DIMENSION_LABELS: Record<Dimension, string> = {
  weight: 'Khối lượng',
  volume: 'Thể tích',
  count: 'Đếm',
}

export default function DonViDoPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const isAdmin = profile?.role === 'admin'

  const [loading, setLoading] = React.useState(true)
  const [units, setUnits] = React.useState<Unit[]>([])
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Unit | null>(null)

  const load = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .order('dimension')
      .order('base_factor')
    if (error) toast({ title: 'Lỗi tải đơn vị đo', description: error.message, variant: 'destructive' })
    setUnits(data ?? [])
    setLoading(false)
  }, [toast])

  React.useEffect(() => {
    if (isAdmin) load()
  }, [isAdmin, load])

  const toggleActive = async (unit: Unit, isActive: boolean) => {
    const { error } = await supabase.from('units').update({ is_active: isActive }).eq('id', unit.id)
    if (error) {
      toast({ title: 'Không cập nhật được', description: error.message, variant: 'destructive' })
    } else {
      load()
    }
  }

  if (!isAdmin) {
    return (
      <PageContainer>
        <PageHeader
          icon={Ruler}
          title="Đơn vị đo"
          description="Danh sách đơn vị đo dùng chung cho mọi thương hiệu."
        />
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <ShieldAlert className="size-8" />
            <p className="text-sm">Chỉ Quản trị viên mới quản lý được đơn vị đo.</p>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  const byDimension = (['weight', 'volume', 'count'] as Dimension[]).map((dim) => ({
    dim,
    items: units.filter((u) => u.dimension === dim),
  }))

  return (
    <PageContainer>
      <PageHeader
        icon={Ruler}
        title="Đơn vị đo"
        description="Dùng chung cho cả Mongo và NooShan. Khối lượng/thể tích tự quy đổi theo hệ số; đếm thì mỗi NVL khai hệ số riêng."
        actions={
          <Button className="gap-1.5" onClick={() => { setEditing(null); setDialogOpen(true) }}>
            <Plus className="size-4" />
            Thêm đơn vị
          </Button>
        }
      />

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card className="border-border/60">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Nhóm</TableHead>
                  <TableHead>Hệ số quy đổi gốc</TableHead>
                  <TableHead className="w-28">Trạng thái</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {byDimension.map(({ dim, items }) =>
                  items.map((unit, i) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-mono text-xs">{unit.code}</TableCell>
                      <TableCell className="font-medium">{unit.name}</TableCell>
                      <TableCell>
                        {i === 0 && <Badge variant="outline">{DIMENSION_LABELS[dim]}</Badge>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{unit.base_factor}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch checked={unit.is_active} onCheckedChange={(v) => toggleActive(unit, v)} />
                          <span className="text-xs text-muted-foreground">
                            {unit.is_active ? 'Đang dùng' : 'Đã tắt'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => { setEditing(unit); setDialogOpen(true) }}
                          aria-label="Sửa đơn vị"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <UnitDialog
        key={editing?.id ?? 'new'}
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(null) }}
        unit={editing}
        onSaved={load}
      />
    </PageContainer>
  )
}

function UnitDialog({
  open,
  onOpenChange,
  unit,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  unit: Unit | null
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [code, setCode] = React.useState(unit?.code ?? '')
  const [name, setName] = React.useState(unit?.name ?? '')
  const [dimension, setDimension] = React.useState<Dimension>(unit?.dimension ?? 'weight')
  const [baseFactor, setBaseFactor] = React.useState(String(unit?.base_factor ?? 1))
  const [saving, setSaving] = React.useState(false)

  const handleSave = async () => {
    const factor = Number(baseFactor)
    if (!code.trim() || !name.trim() || !Number.isFinite(factor) || factor <= 0) {
      toast({ title: 'Thiếu thông tin', description: 'Nhập đủ mã, tên và hệ số hợp lệ (> 0).', variant: 'destructive' })
      return
    }
    setSaving(true)
    const payload = { code: code.trim(), name: name.trim(), dimension, base_factor: factor }
    const { error } = unit
      ? await supabase.from('units').update(payload).eq('id', unit.id)
      : await supabase.from('units').insert(payload)
    setSaving(false)
    if (error) {
      toast({ title: 'Không lưu được', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: unit ? 'Đã cập nhật đơn vị' : 'Đã thêm đơn vị' })
    onOpenChange(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="size-4" />
            {unit ? 'Sửa đơn vị đo' : 'Thêm đơn vị đo'}
          </DialogTitle>
          <DialogDescription>
            Hệ số quy đổi gốc: cùng nhóm Khối lượng/Thể tích sẽ tự quy đổi qua lại (vd kg=1000, g=1).
            Nhóm Đếm để hệ số 1, quy đổi giữa các đơn vị đếm khai riêng ở từng NVL.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Mã</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: kg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tên</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Ki-lô-gam" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nhóm</Label>
              <Select value={dimension} onValueChange={(v) => setDimension(v as Dimension)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['weight', 'volume', 'count'] as Dimension[]).map((d) => (
                    <SelectItem key={d} value={d}>{DIMENSION_LABELS[d]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hệ số quy đổi gốc</Label>
              <Input
                type="number"
                min="0"
                step="any"
                value={baseFactor}
                onChange={(e) => setBaseFactor(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="size-4 animate-spin" />}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
