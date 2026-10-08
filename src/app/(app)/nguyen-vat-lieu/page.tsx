'use client'

import * as React from 'react'
import {
  Package,
  Tags,
  Ruler,
  Plus,
  Pencil,
  ShieldAlert,
  Loader2,
  FolderTree,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

type Brand = Database['public']['Tables']['brands']['Row']
type Category = Database['public']['Tables']['material_categories']['Row']
type Unit = Database['public']['Tables']['units']['Row']
type Material = Database['public']['Tables']['materials']['Row']
type MaterialPrice = Database['public']['Tables']['material_prices']['Row']
type Dimension = Database['public']['Enums']['unit_dimension']

const DIMENSION_LABELS: Record<Dimension, string> = {
  weight: 'Khối lượng',
  volume: 'Thể tích',
  count: 'Đếm',
}

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

export default function NguyenVatLieuPage() {
  const { profile, user } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = React.useState(true)
  const [brands, setBrands] = React.useState<Brand[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [units, setUnits] = React.useState<Unit[]>([])
  const [materials, setMaterials] = React.useState<Material[]>([])
  const [prices, setPrices] = React.useState<Record<string, MaterialPrice>>({})
  const [managedBrandIds, setManagedBrandIds] = React.useState<Set<string>>(new Set())

  const isAdmin = profile?.role === 'admin'
  const isBrandManager = profile?.role === 'brand_manager'
  const canAccess = isAdmin || isBrandManager

  const load = React.useCallback(async () => {
    const [brandsRes, catsRes, unitsRes, matsRes, pricesRes] = await Promise.all([
      supabase.from('brands').select('*').order('code'),
      supabase.from('material_categories').select('*').order('sort_order'),
      supabase.from('units').select('*').order('dimension').order('base_factor'),
      supabase.from('materials').select('*').order('name'),
      supabase.from('material_prices').select('*'),
    ])
    const firstErr = [brandsRes, catsRes, unitsRes, matsRes, pricesRes].find((r) => r.error)
    if (firstErr?.error) {
      toast({ title: 'Lỗi tải dữ liệu', description: firstErr.error.message, variant: 'destructive' })
    }
    setBrands(brandsRes.data ?? [])
    setCategories(catsRes.data ?? [])
    setUnits(unitsRes.data ?? [])
    setMaterials(matsRes.data ?? [])
    setPrices(Object.fromEntries((pricesRes.data ?? []).map((p) => [p.material_id, p])))

    if (profile?.id) {
      const { data: ub } = await supabase.from('user_brands').select('brand_id').eq('user_id', profile.id)
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
          icon={Package}
          title="Quản lý nguyên vật liệu"
          description="Danh sách nguyên vật liệu, danh mục và đơn vị tính."
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

  const visibleBrands = isAdmin ? brands : brands.filter((b) => managedBrandIds.has(b.id))
  const unitLabel = (id: string) => units.find((u) => u.id === id)?.code.toUpperCase() ?? '—'

  return (
    <PageContainer>
      <PageHeader
        icon={Package}
        title="Quản lý nguyên vật liệu"
        description="Danh sách nguyên vật liệu, danh mục và đơn vị tính."
      />

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="nvl">
          <TabsList>
            <TabsTrigger value="nvl" className="gap-1.5">
              <Package className="size-3.5" />
              Nguyên vật liệu
            </TabsTrigger>
            <TabsTrigger value="danh-muc" className="gap-1.5">
              <Tags className="size-3.5" />
              Danh mục
            </TabsTrigger>
            <TabsTrigger value="don-vi" className="gap-1.5">
              <Ruler className="size-3.5" />
              Đơn vị tính
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nvl" className="space-y-5 pt-4">
            {visibleBrands.map((brand) => (
              <MaterialsBrandSection
                key={brand.id}
                brand={brand}
                categories={categories.filter((c) => c.brand_id === brand.id)}
                units={units.filter((u) => u.is_active)}
                materials={materials.filter((m) => m.brand_id === brand.id)}
                prices={prices}
                unitLabel={unitLabel}
                userId={user?.id ?? ''}
                onChanged={load}
              />
            ))}
            {visibleBrands.length === 0 && <EmptyBrandsCard />}
          </TabsContent>

          <TabsContent value="danh-muc" className="space-y-5 pt-4">
            {visibleBrands.map((brand) => (
              <CategoryBrandSection
                key={brand.id}
                brand={brand}
                categories={categories.filter((c) => c.brand_id === brand.id)}
                onChanged={load}
              />
            ))}
            {visibleBrands.length === 0 && <EmptyBrandsCard />}
          </TabsContent>

          <TabsContent value="don-vi" className="pt-4">
            <UnitsSection units={units} canEdit={isAdmin} onChanged={load} />
          </TabsContent>
        </Tabs>
      )}
    </PageContainer>
  )
}

function EmptyBrandsCard() {
  return (
    <Card className="border-border/60">
      <CardContent className="py-10 text-center text-sm text-muted-foreground">
        Chưa có thương hiệu nào bạn quản lý.
      </CardContent>
    </Card>
  )
}

/* ========== Tab: Nguyên vật liệu ========== */

function MaterialsBrandSection({
  brand,
  categories,
  units,
  materials,
  prices,
  unitLabel,
  userId,
  onChanged,
}: {
  brand: Brand
  categories: Category[]
  units: Unit[]
  materials: Material[]
  prices: Record<string, MaterialPrice>
  unitLabel: (id: string) => string
  userId: string
  onChanged: () => void
}) {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Material | null>(null)
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—'

  const toggleActive = async (mat: Material, isActive: boolean) => {
    const { error } = await supabase.from('materials').update({ is_active: isActive }).eq('id', mat.id)
    if (error) toast({ title: 'Không cập nhật được', description: error.message, variant: 'destructive' })
    else onChanged()
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
            <Package className="size-4" />
          </span>
          {brand.name}
          <Badge variant="outline" className="font-mono text-[10px]">{brand.code}</Badge>
        </CardTitle>
        <Button
          size="sm"
          className="gap-1.5"
          disabled={categories.length === 0}
          title={categories.length === 0 ? 'Tạo danh mục trước ở tab Danh mục' : undefined}
          onClick={() => { setEditing(null); setDialogOpen(true) }}
        >
          <Plus className="size-4" />
          Thêm NVL
        </Button>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 py-8 text-center text-sm text-muted-foreground">
            Chưa có danh mục nào — tạo danh mục ở tab "Danh mục" trước khi thêm NVL.
          </div>
        ) : materials.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 py-8 text-center text-sm text-muted-foreground">
            Thương hiệu này chưa có nguyên vật liệu nào.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên NVL</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>ĐVT Kho</TableHead>
                <TableHead>ĐVT Bar</TableHead>
                <TableHead>Quy đổi</TableHead>
                <TableHead>Đơn giá</TableHead>
                <TableHead className="w-28">Trạng thái</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((mat) => (
                <TableRow key={mat.id}>
                  <TableCell className="font-medium">{mat.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{categoryName(mat.category_id)}</Badge>
                  </TableCell>
                  <TableCell><Badge variant="outline">{unitLabel(mat.unit_kho_id)}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{unitLabel(mat.unit_bar_id)}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">1 : {mat.convert_factor}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatVND(prices[mat.id]?.unit_price ?? 0)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={mat.is_active} onCheckedChange={(v) => toggleActive(mat, v)} />
                      <span className="text-xs text-muted-foreground">
                        {mat.is_active ? 'Đang dùng' : 'Đã tắt'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => { setEditing(mat); setDialogOpen(true) }}
                      aria-label="Sửa NVL"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <MaterialDialog
        key={editing?.id ?? 'new'}
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(null) }}
        brandId={brand.id}
        categories={categories}
        units={units}
        material={editing}
        price={editing ? prices[editing.id]?.unit_price : undefined}
        userId={userId}
        onSaved={onChanged}
      />
    </Card>
  )
}

function MaterialDialog({
  open,
  onOpenChange,
  brandId,
  categories,
  units,
  material,
  price,
  userId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  brandId: string
  categories: Category[]
  units: Unit[]
  material: Material | null
  price: number | undefined
  userId: string
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [name, setName] = React.useState(material?.name ?? '')
  const [categoryId, setCategoryId] = React.useState(material?.category_id ?? categories[0]?.id ?? '')
  const [unitKhoId, setUnitKhoId] = React.useState(material?.unit_kho_id ?? units[0]?.id ?? '')
  const [unitBarId, setUnitBarId] = React.useState(material?.unit_bar_id ?? units[0]?.id ?? '')
  const [convertFactor, setConvertFactor] = React.useState(String(material?.convert_factor ?? 1))
  const [minStock, setMinStock] = React.useState(String(material?.min_stock ?? 0))
  const [unitPrice, setUnitPrice] = React.useState(String(price ?? 0))
  const [saving, setSaving] = React.useState(false)

  const handleSave = async () => {
    const factor = Number(convertFactor)
    const min = Number(minStock)
    const priceVal = Number(unitPrice)
    if (!name.trim() || !categoryId || !unitKhoId || !unitBarId) {
      toast({ title: 'Thiếu thông tin', description: 'Nhập tên và chọn đủ danh mục, đơn vị.', variant: 'destructive' })
      return
    }
    if (!Number.isFinite(factor) || factor <= 0) {
      toast({ title: 'Hệ số quy đổi không hợp lệ', variant: 'destructive' })
      return
    }
    setSaving(true)
    const payload = {
      brand_id: brandId,
      category_id: categoryId,
      name: name.trim(),
      unit_kho_id: unitKhoId,
      unit_bar_id: unitBarId,
      convert_factor: factor,
      min_stock: Number.isFinite(min) ? min : 0,
    }
    const { data: savedMaterial, error } = material
      ? await supabase.from('materials').update(payload).eq('id', material.id).select().single()
      : await supabase.from('materials').insert(payload).select().single()

    if (error || !savedMaterial) {
      setSaving(false)
      toast({ title: 'Không lưu được', description: error?.message, variant: 'destructive' })
      return
    }

    const { error: priceErr } = await supabase
      .from('material_prices')
      .upsert(
        { material_id: savedMaterial.id, unit_price: Number.isFinite(priceVal) ? priceVal : 0, updated_by: userId },
        { onConflict: 'material_id' }
      )
    setSaving(false)
    if (priceErr) {
      toast({ title: 'Đã lưu NVL nhưng không lưu được giá', description: priceErr.message, variant: 'destructive' })
      onOpenChange(false)
      onSaved()
      return
    }
    toast({ title: material ? 'Đã cập nhật NVL' : 'Đã thêm NVL' })
    onOpenChange(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="size-4" />
            {material ? 'Sửa nguyên vật liệu' : 'Thêm nguyên vật liệu'}
          </DialogTitle>
          <DialogDescription>Quy đổi: 1 đơn vị Kho = bao nhiêu đơn vị Bar.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tên nguyên vật liệu</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Trà đen Đài Loan" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Danh mục</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">ĐVT Kho</Label>
              <Select value={unitKhoId} onValueChange={setUnitKhoId}>
                <SelectTrigger><SelectValue placeholder="Chọn đơn vị" /></SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name} ({u.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">ĐVT Bar</Label>
              <Select value={unitBarId} onValueChange={setUnitBarId}>
                <SelectTrigger><SelectValue placeholder="Chọn đơn vị" /></SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name} ({u.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hệ số quy đổi</Label>
              <Input type="number" min="0" step="any" value={convertFactor} onChange={(e) => setConvertFactor(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tồn tối thiểu</Label>
              <Input type="number" min="0" step="any" value={minStock} onChange={(e) => setMinStock(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Đơn giá (₫)</Label>
              <Input type="number" min="0" step="any" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
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

/* ========== Tab: Danh mục ========== */

function CategoryBrandSection({
  brand,
  categories,
  onChanged,
}: {
  brand: Brand
  categories: Category[]
  onChanged: () => void
}) {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Category | null>(null)

  const toggleActive = async (cat: Category, isActive: boolean) => {
    const { error } = await supabase.from('material_categories').update({ is_active: isActive }).eq('id', cat.id)
    if (error) toast({ title: 'Không cập nhật được', description: error.message, variant: 'destructive' })
    else onChanged()
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
            <FolderTree className="size-4" />
          </span>
          {brand.name}
          <Badge variant="outline" className="font-mono text-[10px]">{brand.code}</Badge>
        </CardTitle>
        <Button size="sm" className="gap-1.5" onClick={() => { setEditing(null); setDialogOpen(true) }}>
          <Plus className="size-4" />
          Thêm danh mục
        </Button>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 py-8 text-center text-sm text-muted-foreground">
            Thương hiệu này chưa có danh mục NVL nào.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Tên danh mục</TableHead>
                <TableHead className="w-24">Thứ tự</TableHead>
                <TableHead className="w-28">Trạng thái</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-mono text-xs">{cat.code}</TableCell>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-muted-foreground">{cat.sort_order}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={cat.is_active} onCheckedChange={(v) => toggleActive(cat, v)} />
                      <span className="text-xs text-muted-foreground">
                        {cat.is_active ? 'Đang dùng' : 'Đã tắt'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => { setEditing(cat); setDialogOpen(true) }}
                      aria-label="Sửa danh mục"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <CategoryDialog
        key={editing?.id ?? 'new'}
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(null) }}
        brandId={brand.id}
        category={editing}
        onSaved={onChanged}
      />
    </Card>
  )
}

function CategoryDialog({
  open,
  onOpenChange,
  brandId,
  category,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  brandId: string
  category: Category | null
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [code, setCode] = React.useState(category?.code ?? '')
  const [name, setName] = React.useState(category?.name ?? '')
  const [sortOrder, setSortOrder] = React.useState(String(category?.sort_order ?? 0))
  const [saving, setSaving] = React.useState(false)

  const handleSave = async () => {
    if (!code.trim() || !name.trim()) {
      toast({ title: 'Thiếu thông tin', description: 'Nhập đủ mã và tên danh mục.', variant: 'destructive' })
      return
    }
    setSaving(true)
    const payload = { brand_id: brandId, code: code.trim(), name: name.trim(), sort_order: Number(sortOrder) || 0 }
    const { error } = category
      ? await supabase.from('material_categories').update(payload).eq('id', category.id)
      : await supabase.from('material_categories').insert(payload)
    setSaving(false)
    if (error) {
      toast({ title: 'Không lưu được', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: category ? 'Đã cập nhật danh mục' : 'Đã thêm danh mục' })
    onOpenChange(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="size-4" />
            {category ? 'Sửa danh mục' : 'Thêm danh mục'}
          </DialogTitle>
          <DialogDescription>Danh mục chỉ thuộc một thương hiệu, không dùng chung.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Mã danh mục</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: tra" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tên danh mục</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Trà" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Thứ tự hiển thị</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
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

/* ========== Tab: Đơn vị tính ========== */

function UnitsSection({
  units,
  canEdit,
  onChanged,
}: {
  units: Unit[]
  canEdit: boolean
  onChanged: () => void
}) {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Unit | null>(null)

  const toggleActive = async (unit: Unit, isActive: boolean) => {
    const { error } = await supabase.from('units').update({ is_active: isActive }).eq('id', unit.id)
    if (error) toast({ title: 'Không cập nhật được', description: error.message, variant: 'destructive' })
    else onChanged()
  }

  const byDimension = (['weight', 'volume', 'count'] as Dimension[]).map((dim) => ({
    dim,
    items: units.filter((u) => u.dimension === dim),
  }))

  return (
    <Card className="border-border/60">
      <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
            <Ruler className="size-4" />
          </span>
          Đơn vị tính dùng chung
        </CardTitle>
        {canEdit && (
          <Button size="sm" className="gap-1.5" onClick={() => { setEditing(null); setDialogOpen(true) }}>
            <Plus className="size-4" />
            Thêm đơn vị
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Tên</TableHead>
              <TableHead>Nhóm</TableHead>
              <TableHead>Hệ số quy đổi gốc</TableHead>
              <TableHead className="w-28">Trạng thái</TableHead>
              {canEdit && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {byDimension.map(({ dim, items }) =>
              items.map((unit, i) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-mono text-xs">{unit.code}</TableCell>
                  <TableCell className="font-medium">{unit.name}</TableCell>
                  <TableCell>{i === 0 && <Badge variant="outline">{DIMENSION_LABELS[dim]}</Badge>}</TableCell>
                  <TableCell className="text-muted-foreground">{unit.base_factor}</TableCell>
                  <TableCell>
                    {canEdit ? (
                      <div className="flex items-center gap-2">
                        <Switch checked={unit.is_active} onCheckedChange={(v) => toggleActive(unit, v)} />
                        <span className="text-xs text-muted-foreground">
                          {unit.is_active ? 'Đang dùng' : 'Đã tắt'}
                        </span>
                      </div>
                    ) : (
                      <Badge variant={unit.is_active ? 'secondary' : 'outline'}>
                        {unit.is_active ? 'Đang dùng' : 'Đã tắt'}
                      </Badge>
                    )}
                  </TableCell>
                  {canEdit && (
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
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {canEdit && (
        <UnitDialog
          key={editing?.id ?? 'new'}
          open={dialogOpen}
          onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(null) }}
          unit={editing}
          onSaved={onChanged}
        />
      )}
    </Card>
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
            Cùng nhóm Khối lượng/Thể tích tự quy đổi qua lại (vd kg=1000, g=1). Nhóm Đếm để hệ số 1.
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
              <Input type="number" min="0" step="any" value={baseFactor} onChange={(e) => setBaseFactor(e.target.value)} />
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
