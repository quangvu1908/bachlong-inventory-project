'use client'

import * as React from 'react'
import { Tags, Plus, Pencil, ShieldAlert, Loader2, FolderTree } from 'lucide-react'
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
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth/auth-context'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Brand = Database['public']['Tables']['brands']['Row']
type Category = Database['public']['Tables']['material_categories']['Row']

export default function DanhMucNvlPage() {
  const { profile } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = React.useState(true)
  const [brands, setBrands] = React.useState<Brand[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [managedBrandIds, setManagedBrandIds] = React.useState<Set<string>>(new Set())

  const isAdmin = profile?.role === 'admin'
  const isBrandManager = profile?.role === 'brand_manager'
  const canAccess = isAdmin || isBrandManager

  const load = React.useCallback(async () => {
    const [{ data: brandsData, error: brandsErr }, { data: catsData, error: catsErr }] =
      await Promise.all([
        supabase.from('brands').select('*').order('code'),
        supabase.from('material_categories').select('*').order('sort_order'),
      ])
    if (brandsErr) toast({ title: 'Lỗi tải thương hiệu', description: brandsErr.message, variant: 'destructive' })
    if (catsErr) toast({ title: 'Lỗi tải danh mục', description: catsErr.message, variant: 'destructive' })
    setBrands(brandsData ?? [])
    setCategories(catsData ?? [])

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
          icon={Tags}
          title="Danh mục nguyên vật liệu"
          description="Phân loại NVL theo từng thương hiệu (Trà, Sữa, Đường...)."
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
        icon={Tags}
        title="Danh mục nguyên vật liệu"
        description="Mỗi thương hiệu có danh mục riêng, không dùng chung. Tắt danh mục còn NVL đang dùng sẽ không xóa được dữ liệu cũ."
      />

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-5">
          {visibleBrands.map((brand) => (
            <BrandCategorySection
              key={brand.id}
              brand={brand}
              categories={categories.filter((c) => c.brand_id === brand.id)}
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

function BrandCategorySection({
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
    const { error } = await supabase
      .from('material_categories')
      .update({ is_active: isActive })
      .eq('id', cat.id)
    if (error) {
      toast({ title: 'Không cập nhật được', description: error.message, variant: 'destructive' })
    } else {
      onChanged()
    }
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
    const payload = {
      brand_id: brandId,
      code: code.trim(),
      name: name.trim(),
      sort_order: Number(sortOrder) || 0,
    }
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
          <DialogDescription>
            Danh mục chỉ thuộc một thương hiệu, không dùng chung với thương hiệu khác.
          </DialogDescription>
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
