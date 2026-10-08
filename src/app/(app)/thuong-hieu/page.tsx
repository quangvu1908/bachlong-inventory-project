'use client'

import * as React from 'react'
import { Building2, Store, Plus, Pencil, ShieldAlert, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { PageHeader, PageContainer } from '@/components/inventory/page-header'
import { DeleteConfirmButton } from '@/components/inventory/delete-confirm-button'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth/auth-context'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Brand = Database['public']['Tables']['brands']['Row']
type StoreRow = Database['public']['Tables']['stores']['Row']

export default function ThuongHieuPage() {
  const { profile } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = React.useState(true)
  const [brands, setBrands] = React.useState<Brand[]>([])
  const [stores, setStores] = React.useState<StoreRow[]>([])
  const [managedBrandIds, setManagedBrandIds] = React.useState<Set<string>>(new Set())

  const isAdmin = profile?.role === 'admin'
  const isBrandManager = profile?.role === 'brand_manager'
  const canAccess = isAdmin || isBrandManager

  const load = React.useCallback(async () => {
    const [{ data: brandsData, error: brandsErr }, { data: storesData, error: storesErr }] =
      await Promise.all([
        supabase.from('brands').select('*').order('code'),
        supabase.from('stores').select('*').order('code'),
      ])
    if (brandsErr) toast({ title: 'Lỗi tải thương hiệu', description: brandsErr.message, variant: 'destructive' })
    if (storesErr) toast({ title: 'Lỗi tải cửa hàng', description: storesErr.message, variant: 'destructive' })
    setBrands(brandsData ?? [])
    setStores(storesData ?? [])

    if (profile?.id) {
      const { data: ub } = await supabase
        .from('user_brands')
        .select('brand_id')
        .eq('user_id', profile.id)
      setManagedBrandIds(new Set((ub ?? []).map((r) => r.brand_id)))
    }
    setLoading(false)
  }, [profile?.id, toast])

  React.useEffect(() => {
    if (canAccess) load()
  }, [canAccess, load])

  if (!canAccess) {
    return (
      <PageContainer>
        <PageHeader
          icon={Building2}
          title="Thương hiệu & Cửa hàng"
          description="Quản lý danh sách thương hiệu và cửa hàng trực thuộc."
        />
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <ShieldAlert className="size-8" />
            <p className="text-sm">
              Chỉ Quản trị viên và Quản lý thương hiệu mới truy cập được trang này.
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  const visibleBrands = isAdmin
    ? brands
    : brands.filter((b) => managedBrandIds.has(b.id))

  return (
    <PageContainer>
      <PageHeader
        icon={Building2}
        title="Thương hiệu & Cửa hàng"
        description="Quản lý danh sách thương hiệu và cửa hàng trực thuộc."
      />

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-5">
          {visibleBrands.map((brand) => (
            <BrandSection
              key={brand.id}
              brand={brand}
              stores={stores.filter((s) => s.brand_id === brand.id)}
              canEditBrand={isAdmin}
              onChanged={load}
            />
          ))}
          {visibleBrands.length === 0 && (
            <Card className="border-border/60">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Chưa có thương hiệu nào bạn quản lý.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </PageContainer>
  )
}

function BrandSection({
  brand,
  stores,
  canEditBrand,
  onChanged,
}: {
  brand: Brand
  stores: StoreRow[]
  canEditBrand: boolean
  onChanged: () => void
}) {
  const { toast } = useToast()
  const [renaming, setRenaming] = React.useState(false)
  const [name, setName] = React.useState(brand.name)
  const [savingName, setSavingName] = React.useState(false)
  const [storeDialogOpen, setStoreDialogOpen] = React.useState(false)
  const [editingStore, setEditingStore] = React.useState<StoreRow | null>(null)

  const saveBrandName = async () => {
    if (!name.trim() || name === brand.name) {
      setRenaming(false)
      return
    }
    setSavingName(true)
    const { error } = await supabase.from('brands').update({ name: name.trim() }).eq('id', brand.id)
    setSavingName(false)
    setRenaming(false)
    if (error) {
      toast({ title: 'Không đổi được tên', description: error.message, variant: 'destructive' })
      setName(brand.name)
    } else {
      toast({ title: 'Đã cập nhật tên thương hiệu' })
      onChanged()
    }
  }

  const toggleStoreActive = async (store: StoreRow, isActive: boolean) => {
    const { error } = await supabase
      .from('stores')
      .update({ is_active: isActive })
      .eq('id', store.id)
    if (error) {
      toast({ title: 'Không cập nhật được', description: error.message, variant: 'destructive' })
    } else {
      onChanged()
    }
  }

  const deleteStore = async (store: StoreRow) => {
    const { error } = await supabase.from('stores').delete().eq('id', store.id)
    if (error) {
      toast({ title: 'Không xóa được', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: `Đã xóa cửa hàng "${store.name}"` })
      onChanged()
    }
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
            <Building2 className="size-4" />
          </span>
          {renaming ? (
            <div className="flex items-center gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 w-48"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveBrandName()}
              />
              <Button size="sm" onClick={saveBrandName} disabled={savingName}>
                Lưu
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setRenaming(false); setName(brand.name) }}>
                Hủy
              </Button>
            </div>
          ) : (
            <>
              {brand.name}
              <Badge variant="outline" className="font-mono text-[10px]">{brand.code}</Badge>
              {canEditBrand && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-6"
                  onClick={() => setRenaming(true)}
                  aria-label="Đổi tên thương hiệu"
                >
                  <Pencil className="size-3.5" />
                </Button>
              )}
            </>
          )}
        </CardTitle>
        <Button size="sm" className="gap-1.5" onClick={() => { setEditingStore(null); setStoreDialogOpen(true) }}>
          <Plus className="size-4" />
          Thêm cửa hàng
        </Button>
      </CardHeader>
      <CardContent>
        {stores.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 py-8 text-center text-sm text-muted-foreground">
            Thương hiệu này chưa có cửa hàng nào.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Tên cửa hàng</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead className="w-28">Trạng thái</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-mono text-xs">{store.code}</TableCell>
                  <TableCell className="font-medium">{store.name}</TableCell>
                  <TableCell className="text-muted-foreground">{store.address || '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={store.is_active}
                        onCheckedChange={(v) => toggleStoreActive(store, v)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {store.is_active ? 'Hoạt động' : 'Ngừng'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => { setEditingStore(store); setStoreDialogOpen(true) }}
                        aria-label="Sửa cửa hàng"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <DeleteConfirmButton
                        title={`Xóa cửa hàng "${store.name}"?`}
                        description={`Toàn bộ lịch sử nhập hàng, xuất kho, kiểm kê và tồn kho của cửa hàng này sẽ bị xóa vĩnh viễn. Không thể hoàn tác.`}
                        onConfirm={() => deleteStore(store)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <StoreDialog
        key={editingStore?.id ?? 'new'}
        open={storeDialogOpen}
        onOpenChange={(v) => { setStoreDialogOpen(v); if (!v) setEditingStore(null) }}
        brandId={brand.id}
        store={editingStore}
        onSaved={onChanged}
      />
    </Card>
  )
}

function StoreDialog({
  open,
  onOpenChange,
  brandId,
  store,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  brandId: string
  store: StoreRow | null
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [code, setCode] = React.useState(store?.code ?? '')
  const [name, setName] = React.useState(store?.name ?? '')
  const [address, setAddress] = React.useState(store?.address ?? '')
  const [saving, setSaving] = React.useState(false)

  const handleSave = async () => {
    if (!code.trim() || !name.trim()) {
      toast({ title: 'Thiếu thông tin', description: 'Nhập đủ mã và tên cửa hàng.', variant: 'destructive' })
      return
    }
    setSaving(true)
    const payload = { brand_id: brandId, code: code.trim(), name: name.trim(), address: address.trim() || null }
    const { error } = store
      ? await supabase.from('stores').update(payload).eq('id', store.id)
      : await supabase.from('stores').insert(payload)
    setSaving(false)
    if (error) {
      toast({ title: 'Không lưu được', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: store ? 'Đã cập nhật cửa hàng' : 'Đã thêm cửa hàng' })
    onOpenChange(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="size-4" />
            {store ? 'Sửa cửa hàng' : 'Thêm cửa hàng'}
          </DialogTitle>
          <DialogDescription>
            Mã cửa hàng dùng để phân biệt nội bộ, không hiển thị cho khách.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Mã cửa hàng</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: mongo-tdinh" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tên cửa hàng</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Mongo 353 Trương Định" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Địa chỉ</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Tùy chọn" />
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
