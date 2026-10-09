'use client'

import * as React from 'react'
import {
  UtensilsCrossed,
  FlaskConical,
  Beaker,
  Plus,
  Pencil,
  ShieldAlert,
  Loader2,
  History,
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
import { DeleteConfirmButton } from '@/components/inventory/delete-confirm-button'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth/auth-context'
import { supabase } from '@/lib/supabase/client'
import { formatDate, formatNum } from '@/lib/format'
import type { Database } from '@/lib/supabase/database.types'

type Brand = Database['public']['Tables']['brands']['Row']
type Product = Database['public']['Tables']['products']['Row']
type Material = Database['public']['Tables']['materials']['Row']
type ProductRecipe = Database['public']['Tables']['product_recipes']['Row']
type MaterialRecipe = Database['public']['Tables']['material_recipes']['Row']

export default function SanPhamPage() {
  const { profile, user } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = React.useState(true)
  const [brands, setBrands] = React.useState<Brand[]>([])
  const [products, setProducts] = React.useState<Product[]>([])
  const [materials, setMaterials] = React.useState<Material[]>([])
  const [unitCodeByMaterial, setUnitCodeByMaterial] = React.useState<Record<string, string>>({})
  const [productRecipes, setProductRecipes] = React.useState<ProductRecipe[]>([])
  const [materialRecipes, setMaterialRecipes] = React.useState<MaterialRecipe[]>([])
  const [managedBrandIds, setManagedBrandIds] = React.useState<Set<string>>(new Set())

  const isAdmin = profile?.role === 'admin'
  const isBrandManager = profile?.role === 'brand_manager'
  const canAccess = isAdmin || isBrandManager

  const load = React.useCallback(async () => {
    const [brandsRes, prodRes, matsRes, unitsRes, prRes, mrRes] = await Promise.all([
      supabase.from('brands').select('*').order('code'),
      supabase.from('products').select('*').order('name'),
      supabase.from('materials').select('*').eq('is_active', true).order('name'),
      supabase.from('units').select('id, code'),
      supabase.from('product_recipes').select('*').order('effective_from', { ascending: false }),
      supabase.from('material_recipes').select('*').order('effective_from', { ascending: false }),
    ])
    const firstErr = [brandsRes, prodRes, matsRes, unitsRes, prRes, mrRes].find((r) => r.error)
    if (firstErr?.error) {
      toast({ title: 'Lỗi tải dữ liệu', description: firstErr.error.message, variant: 'destructive' })
    }
    const mats = matsRes.data ?? []
    const unitCode = new Map((unitsRes.data ?? []).map((u) => [u.id, u.code.toUpperCase()]))
    setBrands(brandsRes.data ?? [])
    setProducts(prodRes.data ?? [])
    setMaterials(mats)
    setUnitCodeByMaterial(
      Object.fromEntries(mats.map((m) => [m.id, unitCode.get(m.unit_kho_id) ?? '—']))
    )
    setProductRecipes(prRes.data ?? [])
    setMaterialRecipes(mrRes.data ?? [])

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
          icon={UtensilsCrossed}
          title="Sản phẩm & Công thức"
          description="Sản phẩm bán ra, công thức sản phẩm và công thức bán thành phẩm."
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

  return (
    <PageContainer>
      <PageHeader
        icon={UtensilsCrossed}
        title="Sản phẩm & Công thức"
        description="Sản phẩm bán ra, công thức sản phẩm và công thức bán thành phẩm (BTP)."
      />

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="san-pham">
          <TabsList>
            <TabsTrigger value="san-pham" className="gap-1.5">
              <UtensilsCrossed className="size-3.5" />
              Sản phẩm
            </TabsTrigger>
            <TabsTrigger value="cong-thuc-sp" className="gap-1.5">
              <FlaskConical className="size-3.5" />
              Công thức sản phẩm
            </TabsTrigger>
            <TabsTrigger value="cong-thuc-btp" className="gap-1.5">
              <Beaker className="size-3.5" />
              Công thức BTP
            </TabsTrigger>
          </TabsList>

          <TabsContent value="san-pham" className="space-y-5 pt-4">
            {visibleBrands.map((brand) => (
              <ProductsBrandSection
                key={brand.id}
                brand={brand}
                products={products.filter((p) => p.brand_id === brand.id)}
                onChanged={load}
              />
            ))}
            {visibleBrands.length === 0 && <EmptyBrandsCard />}
          </TabsContent>

          <TabsContent value="cong-thuc-sp" className="space-y-5 pt-4">
            {visibleBrands.map((brand) => (
              <ProductRecipeBrandSection
                key={brand.id}
                brand={brand}
                products={products.filter((p) => p.brand_id === brand.id)}
                materials={materials.filter((m) => m.brand_id === brand.id)}
                unitCodeByMaterial={unitCodeByMaterial}
                recipes={productRecipes}
                userId={user?.id ?? ''}
                onChanged={load}
              />
            ))}
            {visibleBrands.length === 0 && <EmptyBrandsCard />}
          </TabsContent>

          <TabsContent value="cong-thuc-btp" className="space-y-5 pt-4">
            {visibleBrands.map((brand) => (
              <MaterialRecipeBrandSection
                key={brand.id}
                brand={brand}
                materials={materials.filter((m) => m.brand_id === brand.id)}
                unitCodeByMaterial={unitCodeByMaterial}
                recipes={materialRecipes}
                userId={user?.id ?? ''}
                onChanged={load}
              />
            ))}
            {visibleBrands.length === 0 && <EmptyBrandsCard />}
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

/* ========== Tab: Sản phẩm ========== */

function ProductsBrandSection({
  brand,
  products,
  onChanged,
}: {
  brand: Brand
  products: Product[]
  onChanged: () => void
}) {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Product | null>(null)

  const toggleActive = async (p: Product, isActive: boolean) => {
    const { error } = await supabase.from('products').update({ is_active: isActive }).eq('id', p.id)
    if (error) toast({ title: 'Không cập nhật được', description: error.message, variant: 'destructive' })
    else onChanged()
  }

  const deleteProduct = async (p: Product) => {
    const { error } = await supabase.from('products').delete().eq('id', p.id)
    if (error) toast({ title: 'Không xóa được', description: error.message, variant: 'destructive' })
    else {
      toast({ title: `Đã xóa "${p.name}"` })
      onChanged()
    }
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
            <UtensilsCrossed className="size-4" />
          </span>
          {brand.name}
          <Badge variant="outline" className="font-mono text-[10px]">{brand.code}</Badge>
        </CardTitle>
        <Button size="sm" className="gap-1.5" onClick={() => { setEditing(null); setDialogOpen(true) }}>
          <Plus className="size-4" />
          Thêm sản phẩm
        </Button>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 py-8 text-center text-sm text-muted-foreground">
            Thương hiệu này chưa có sản phẩm nào.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Mã</TableHead>
                <TableHead className="w-28">Trạng thái</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.code ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={p.is_active} onCheckedChange={(v) => toggleActive(p, v)} />
                      <span className="text-xs text-muted-foreground">
                        {p.is_active ? 'Đang bán' : 'Đã tắt'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => { setEditing(p); setDialogOpen(true) }}
                        aria-label="Sửa sản phẩm"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <DeleteConfirmButton
                        title={`Xóa sản phẩm "${p.name}"?`}
                        description="Toàn bộ công thức và dữ liệu doanh thu đã nhập của sản phẩm này sẽ bị xóa vĩnh viễn. Không thể hoàn tác."
                        onConfirm={() => deleteProduct(p)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <ProductDialog
        key={editing?.id ?? 'new'}
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(null) }}
        brandId={brand.id}
        product={editing}
        onSaved={onChanged}
      />
    </Card>
  )
}

function ProductDialog({
  open,
  onOpenChange,
  brandId,
  product,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  brandId: string
  product: Product | null
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [name, setName] = React.useState(product?.name ?? '')
  const [code, setCode] = React.useState(product?.code ?? '')
  const [saving, setSaving] = React.useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Thiếu thông tin', description: 'Nhập tên sản phẩm.', variant: 'destructive' })
      return
    }
    setSaving(true)
    const payload = { brand_id: brandId, name: name.trim(), code: code.trim() || null }
    const { error } = product
      ? await supabase.from('products').update(payload).eq('id', product.id)
      : await supabase.from('products').insert(payload)
    setSaving(false)
    if (error) {
      toast({ title: 'Không lưu được', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: product ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm' })
    onOpenChange(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UtensilsCrossed className="size-4" />
            {product ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
          </DialogTitle>
          <DialogDescription>
            Mã (nếu có) giúp khớp nhanh hơn với tên món trong file doanh thu import.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tên sản phẩm</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Trà sữa Thái Xanh size M" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Mã (tùy chọn)</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: TSTX-M" />
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

/* ========== Tab: Công thức sản phẩm ========== */

function ProductRecipeBrandSection({
  brand,
  products,
  materials,
  unitCodeByMaterial,
  recipes,
  userId,
  onChanged,
}: {
  brand: Brand
  products: Product[]
  materials: Material[]
  unitCodeByMaterial: Record<string, string>
  recipes: ProductRecipe[]
  userId: string
  onChanged: () => void
}) {
  const [selectedProductId, setSelectedProductId] = React.useState(products[0]?.id ?? '')
  React.useEffect(() => {
    if (!products.some((p) => p.id === selectedProductId)) setSelectedProductId(products[0]?.id ?? '')
  }, [products, selectedProductId])

  if (products.length === 0) {
    return (
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
              <FlaskConical className="size-4" />
            </span>
            {brand.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Chưa có sản phẩm nào — thêm sản phẩm ở tab "Sản phẩm" trước.
        </CardContent>
      </Card>
    )
  }

  const materialRows = recipes.filter((r) => r.product_id === selectedProductId)

  return (
    <Card className="border-border/60">
      <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
            <FlaskConical className="size-4" />
          </span>
          {brand.name}
        </CardTitle>
        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Chọn sản phẩm" /></SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <RecipeTable
          rows={materialRows}
          materials={materials}
          unitCodeByMaterial={unitCodeByMaterial}
          ownerLabel="sản phẩm"
          quantityHint="cho 1 đơn vị bán ra"
          userId={userId}
          onAdd={async (materialId, quantity, effectiveFrom) => {
            const { error } = await supabase.from('product_recipes').insert({
              product_id: selectedProductId,
              material_id: materialId,
              quantity,
              effective_from: effectiveFrom,
              created_by: userId || null,
            })
            return error?.message ?? null
          }}
          onRevise={async (row, newQuantity, newEffectiveFrom) => {
            const { error: closeErr } = await supabase
              .from('product_recipes')
              .update({ effective_to: newEffectiveFrom })
              .eq('id', row.id)
            if (closeErr) return closeErr.message
            const { error: insertErr } = await supabase.from('product_recipes').insert({
              product_id: selectedProductId,
              material_id: row.material_id,
              quantity: newQuantity,
              effective_from: newEffectiveFrom,
              created_by: userId || null,
            })
            return insertErr?.message ?? null
          }}
          onDelete={async (row) => {
            const { error } = await supabase.from('product_recipes').delete().eq('id', row.id)
            return error?.message ?? null
          }}
          onChanged={onChanged}
        />
      </CardContent>
    </Card>
  )
}

/* ========== Tab: Công thức BTP ========== */

function MaterialRecipeBrandSection({
  brand,
  materials,
  unitCodeByMaterial,
  recipes,
  userId,
  onChanged,
}: {
  brand: Brand
  materials: Material[]
  unitCodeByMaterial: Record<string, string>
  recipes: MaterialRecipe[]
  userId: string
  onChanged: () => void
}) {
  const [selectedMaterialId, setSelectedMaterialId] = React.useState(materials[0]?.id ?? '')
  React.useEffect(() => {
    if (!materials.some((m) => m.id === selectedMaterialId)) setSelectedMaterialId(materials[0]?.id ?? '')
  }, [materials, selectedMaterialId])

  if (materials.length === 0) {
    return (
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
              <Beaker className="size-4" />
            </span>
            {brand.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Chưa có nguyên vật liệu nào — thêm ở trang "Quản Lý Nguyên Vật Liệu" trước.
        </CardContent>
      </Card>
    )
  }

  const ingredientRows = recipes.filter((r) => r.btp_material_id === selectedMaterialId)
  // Nguyên liệu đầu vào không gồm chính BTP đang chọn (DB cũng chặn bằng CHECK).
  const ingredientOptions = materials.filter((m) => m.id !== selectedMaterialId)

  return (
    <Card className="border-border/60">
      <CardHeader className="gap-3 pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
              <Beaker className="size-4" />
            </span>
            {brand.name}
          </CardTitle>
          <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Chọn NVL / BTP" /></SelectTrigger>
            <SelectContent>
              {materials.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          Công thức BTP chỉ 1 tầng — chọn nguyên liệu thô làm đầu vào, không chọn BTP khác.
        </p>
      </CardHeader>
      <CardContent>
        <RecipeTable
          rows={ingredientRows.map((r) => ({ ...r, material_id: r.input_material_id }))}
          materials={ingredientOptions}
          unitCodeByMaterial={unitCodeByMaterial}
          ownerLabel="BTP"
          quantityHint="để ra 1 đơn vị thành phẩm"
          userId={userId}
          onAdd={async (materialId, quantity, effectiveFrom) => {
            const { error } = await supabase.from('material_recipes').insert({
              btp_material_id: selectedMaterialId,
              input_material_id: materialId,
              quantity,
              effective_from: effectiveFrom,
              created_by: userId || null,
            })
            return error?.message ?? null
          }}
          onRevise={async (row, newQuantity, newEffectiveFrom) => {
            const { error: closeErr } = await supabase
              .from('material_recipes')
              .update({ effective_to: newEffectiveFrom })
              .eq('id', row.id)
            if (closeErr) return closeErr.message
            const { error: insertErr } = await supabase.from('material_recipes').insert({
              btp_material_id: selectedMaterialId,
              input_material_id: row.material_id,
              quantity: newQuantity,
              effective_from: newEffectiveFrom,
              created_by: userId || null,
            })
            return insertErr?.message ?? null
          }}
          onDelete={async (row) => {
            const { error } = await supabase.from('material_recipes').delete().eq('id', row.id)
            return error?.message ?? null
          }}
          onChanged={onChanged}
        />
      </CardContent>
    </Card>
  )
}

/* ========== Bảng công thức dùng chung (sản phẩm & BTP) ========== */

interface RecipeRowLike {
  id: string
  material_id: string
  quantity: number
  effective_from: string
  effective_to: string | null
}

function RecipeTable({
  rows,
  materials,
  unitCodeByMaterial,
  ownerLabel,
  quantityHint,
  userId,
  onAdd,
  onRevise,
  onDelete,
  onChanged,
}: {
  rows: RecipeRowLike[]
  materials: Material[]
  unitCodeByMaterial: Record<string, string>
  ownerLabel: string
  quantityHint: string
  userId: string
  onAdd: (materialId: string, quantity: number, effectiveFrom: string) => Promise<string | null>
  onRevise: (row: RecipeRowLike, newQuantity: number, newEffectiveFrom: string) => Promise<string | null>
  onDelete: (row: RecipeRowLike) => Promise<string | null>
  onChanged: () => void
}) {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<RecipeRowLike | null>(null)
  const [showHistory, setShowHistory] = React.useState(false)

  const materialName = (id: string) => materials.find((m) => m.id === id)?.name ?? '(NVL đã xóa)'
  const active = rows.filter((r) => r.effective_to === null)
  const history = rows
    .filter((r) => r.effective_to !== null)
    .sort((a, b) => b.effective_from.localeCompare(a.effective_from))

  const handleDelete = async (row: RecipeRowLike) => {
    const err = await onDelete(row)
    if (err) toast({ title: 'Không xóa được', description: err, variant: 'destructive' })
    else {
      toast({ title: 'Đã xóa dòng công thức' })
      onChanged()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Số lượng tính theo đơn vị ĐVT Kho của NVL, {quantityHint}.
        </span>
        <Button size="sm" className="gap-1.5" onClick={() => { setEditing(null); setDialogOpen(true) }}>
          <Plus className="size-4" />
          Thêm dòng công thức
        </Button>
      </div>

      {active.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 py-8 text-center text-sm text-muted-foreground">
          Chưa có công thức cho {ownerLabel} này.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nguyên liệu</TableHead>
              <TableHead className="w-28">Số lượng</TableHead>
              <TableHead className="w-36">Hiệu lực từ</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {active.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{materialName(row.material_id)}</TableCell>
                <TableCell className="tabular-nums">
                  {formatNum(row.quantity)} {unitCodeByMaterial[row.material_id] ?? '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(row.effective_from)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => { setEditing(row); setDialogOpen(true) }}
                      aria-label="Sửa công thức"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <DeleteConfirmButton
                      title="Xóa dòng công thức này?"
                      description="Xóa hẳn dòng công thức, không giữ lại lịch sử. Nếu chỉ muốn đổi định lượng kể từ hôm nay, hãy dùng nút Sửa thay vì Xóa."
                      onConfirm={() => handleDelete(row)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {history.length > 0 && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground"
            onClick={() => setShowHistory((v) => !v)}
          >
            <History className="size-3.5" />
            {showHistory ? 'Ẩn lịch sử' : `Xem lịch sử (${history.length})`}
          </Button>
          {showHistory && (
            <Table>
              <TableBody>
                {history.map((row) => (
                  <TableRow key={row.id} className="text-xs text-muted-foreground">
                    <TableCell>{materialName(row.material_id)}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatNum(row.quantity)} {unitCodeByMaterial[row.material_id] ?? '—'}
                    </TableCell>
                    <TableCell>
                      {formatDate(row.effective_from)} → {formatDate(row.effective_to!)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      <RecipeLineDialog
        key={editing?.id ?? 'new'}
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(null) }}
        editing={editing}
        materials={materials}
        unitCodeByMaterial={unitCodeByMaterial}
        existingMaterialIds={new Set(active.map((r) => r.material_id))}
        onAdd={onAdd}
        onRevise={onRevise}
        onSaved={onChanged}
      />
    </div>
  )
}

function RecipeLineDialog({
  open,
  onOpenChange,
  editing,
  materials,
  unitCodeByMaterial,
  existingMaterialIds,
  onAdd,
  onRevise,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: RecipeRowLike | null
  materials: Material[]
  unitCodeByMaterial: Record<string, string>
  existingMaterialIds: Set<string>
  onAdd: (materialId: string, quantity: number, effectiveFrom: string) => Promise<string | null>
  onRevise: (row: RecipeRowLike, newQuantity: number, newEffectiveFrom: string) => Promise<string | null>
  onSaved: () => void
}) {
  const { toast } = useToast()
  const today = new Date().toISOString().slice(0, 10)
  const availableMaterials = editing
    ? materials
    : materials.filter((m) => !existingMaterialIds.has(m.id))

  const [materialId, setMaterialId] = React.useState(editing?.material_id ?? availableMaterials[0]?.id ?? '')
  const [quantity, setQuantity] = React.useState(String(editing?.quantity ?? ''))
  const [effectiveFrom, setEffectiveFrom] = React.useState(today)
  const [saving, setSaving] = React.useState(false)

  const handleSave = async () => {
    const qty = Number(quantity)
    if (!materialId || !Number.isFinite(qty) || qty <= 0) {
      toast({ title: 'Thiếu thông tin', description: 'Chọn nguyên liệu và nhập số lượng > 0.', variant: 'destructive' })
      return
    }
    if (!editing && existingMaterialIds.has(materialId)) {
      toast({ title: 'Nguyên liệu đã có trong công thức', description: 'Dùng nút Sửa để đổi định lượng.', variant: 'destructive' })
      return
    }
    setSaving(true)
    const err = editing
      ? await onRevise(editing, qty, effectiveFrom)
      : await onAdd(materialId, qty, effectiveFrom)
    setSaving(false)
    if (err) {
      toast({ title: 'Không lưu được', description: err, variant: 'destructive' })
      return
    }
    toast({ title: editing ? 'Đã tạo phiên bản công thức mới' : 'Đã thêm dòng công thức' })
    onOpenChange(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="size-4" />
            {editing ? 'Sửa định lượng' : 'Thêm dòng công thức'}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? 'Đổi định lượng sẽ kết thúc dòng hiện tại và tạo một phiên bản mới có hiệu lực từ ngày chọn — lịch sử cũ vẫn được giữ lại.'
              : 'Chọn nguyên liệu và định lượng cho công thức.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nguyên liệu</Label>
            <Select value={materialId} onValueChange={setMaterialId} disabled={!!editing}>
              <SelectTrigger><SelectValue placeholder="Chọn nguyên liệu" /></SelectTrigger>
              <SelectContent>
                {availableMaterials.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({unitCodeByMaterial[m.id] ?? '—'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Số lượng</Label>
              <Input type="number" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Có hiệu lực từ</Label>
              <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
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
