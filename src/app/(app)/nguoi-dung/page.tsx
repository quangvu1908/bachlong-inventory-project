'use client'

import * as React from 'react'
import { Users, ShieldAlert, Loader2, UserCog, X, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Label } from '@/components/ui/label'
import { PageHeader, PageContainer } from '@/components/inventory/page-header'
import { useToast } from '@/hooks/use-toast'
import { useAuth, ROLE_LABELS } from '@/lib/auth/auth-context'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Brand = Database['public']['Tables']['brands']['Row']
type StoreRow = Database['public']['Tables']['stores']['Row']
type Role = Database['public']['Enums']['user_role']

interface UserStoreLink {
  user_id: string
  store_id: string
  stores: { id: string; name: string; brand_id: string } | null
}
interface UserBrandLink {
  user_id: string
  brand_id: string
  brands: { id: string; name: string } | null
}

export default function NguoiDungPage() {
  const { profile: me } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = React.useState(true)
  const [profiles, setProfiles] = React.useState<Profile[]>([])
  const [brands, setBrands] = React.useState<Brand[]>([])
  const [stores, setStores] = React.useState<StoreRow[]>([])
  const [userStores, setUserStores] = React.useState<UserStoreLink[]>([])
  const [userBrands, setUserBrands] = React.useState<UserBrandLink[]>([])
  const [assignTarget, setAssignTarget] = React.useState<Profile | null>(null)

  const isAdmin = me?.role === 'admin'
  const isBrandManager = me?.role === 'brand_manager'
  const canAccess = isAdmin || isBrandManager

  const load = React.useCallback(async () => {
    const [profilesRes, brandsRes, storesRes, userStoresRes, userBrandsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('brands').select('*').order('code'),
      supabase.from('stores').select('*').order('code'),
      supabase.from('user_stores').select('user_id, store_id, stores(id, name, brand_id)'),
      supabase.from('user_brands').select('user_id, brand_id, brands(id, name)'),
    ])
    if (profilesRes.error) {
      toast({ title: 'Lỗi tải người dùng', description: profilesRes.error.message, variant: 'destructive' })
    }
    setProfiles(profilesRes.data ?? [])
    setBrands(brandsRes.data ?? [])
    setStores(storesRes.data ?? [])
    setUserStores((userStoresRes.data as unknown as UserStoreLink[]) ?? [])
    setUserBrands((userBrandsRes.data as unknown as UserBrandLink[]) ?? [])
    setLoading(false)
  }, [toast])

  React.useEffect(() => {
    if (canAccess) load()
  }, [canAccess, load])

  if (!canAccess) {
    return (
      <PageContainer>
        <PageHeader
          icon={Users}
          title="Quản lý người dùng"
          description="Gán vai trò và cửa hàng phụ trách cho từng tài khoản."
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

  return (
    <PageContainer>
      <PageHeader
        icon={Users}
        title="Quản lý người dùng"
        description="Gán vai trò và cửa hàng phụ trách cho từng tài khoản. Tài khoản mới đăng nhập sẽ chờ ở đây."
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
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Phạm vi</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt="" className="size-8 rounded-full" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="grid size-8 place-items-center rounded-full bg-muted text-xs font-semibold">
                            {(p.full_name || p.email).charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div className="leading-tight">
                          <div className="text-sm font-medium">{p.full_name || '(Chưa có tên)'}</div>
                          <div className="text-xs text-muted-foreground">{p.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.role ? (
                        <Badge variant="outline">{ROLE_LABELS[p.role]}</Badge>
                      ) : (
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300">
                          Chờ duyệt
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <ScopeCell
                        profile={p}
                        userBrands={userBrands.filter((ub) => ub.user_id === p.id)}
                        userStores={userStores.filter((us) => us.user_id === p.id)}
                        canEdit={isAdmin || isBrandManager}
                        onChanged={load}
                      />
                    </TableCell>
                    <TableCell>
                      {p.id !== me?.id && (
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAssignTarget(p)}>
                          <UserCog className="size-3.5" />
                          Gán vai trò
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AssignRoleDialog
        key={assignTarget?.id ?? 'none'}
        target={assignTarget}
        onOpenChange={(open) => !open && setAssignTarget(null)}
        brands={brands}
        stores={stores}
        isAdmin={isAdmin}
        onSaved={load}
      />
    </PageContainer>
  )
}

function ScopeCell({
  profile,
  userBrands,
  userStores,
  canEdit,
  onChanged,
}: {
  profile: Profile
  userBrands: UserBrandLink[]
  userStores: UserStoreLink[]
  canEdit: boolean
  onChanged: () => void
}) {
  const { toast } = useToast()

  const removeStore = async (storeId: string) => {
    const { error } = await supabase
      .from('user_stores')
      .delete()
      .eq('user_id', profile.id)
      .eq('store_id', storeId)
    if (error) {
      toast({ title: 'Không gỡ được', description: error.message, variant: 'destructive' })
    } else {
      onChanged()
    }
  }

  if (profile.role === 'admin') {
    return <span className="text-xs text-muted-foreground">Toàn chuỗi</span>
  }
  if (profile.role === 'brand_manager') {
    if (userBrands.length === 0) return <span className="text-xs text-muted-foreground">Chưa gán thương hiệu</span>
    return (
      <div className="flex flex-wrap gap-1">
        {userBrands.map((ub) => (
          <Badge key={ub.brand_id} variant="secondary">{ub.brands?.name ?? ub.brand_id}</Badge>
        ))}
      </div>
    )
  }
  if (profile.role === 'store_manager' || profile.role === 'staff') {
    if (userStores.length === 0) return <span className="text-xs text-muted-foreground">Chưa gán cửa hàng</span>
    return (
      <div className="flex flex-wrap gap-1">
        {userStores.map((us) => (
          <Badge key={us.store_id} variant="secondary" className="gap-1 pr-1">
            {us.stores?.name ?? us.store_id}
            {canEdit && (
              <button
                onClick={() => removeStore(us.store_id)}
                className="rounded-full p-0.5 hover:bg-destructive/15 hover:text-destructive"
                aria-label="Gỡ cửa hàng"
              >
                <X className="size-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>
    )
  }
  return <span className="text-xs text-muted-foreground">—</span>
}

function AssignRoleDialog({
  target,
  onOpenChange,
  brands,
  stores,
  isAdmin,
  onSaved,
}: {
  target: Profile | null
  onOpenChange: (open: boolean) => void
  brands: Brand[]
  stores: StoreRow[]
  isAdmin: boolean
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [role, setRole] = React.useState<Role | ''>(target?.role ?? '')
  const [brandId, setBrandId] = React.useState('')
  const [storeId, setStoreId] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const roleOptions: Role[] = isAdmin
    ? ['admin', 'brand_manager', 'store_manager', 'staff']
    : ['store_manager', 'staff']

  const handleSave = async () => {
    if (!target || !role) return
    if (role === 'brand_manager' && !brandId) {
      toast({ title: 'Chọn thương hiệu', variant: 'destructive' })
      return
    }
    if ((role === 'store_manager' || role === 'staff') && !storeId) {
      toast({ title: 'Chọn cửa hàng', variant: 'destructive' })
      return
    }
    setSaving(true)
    const { error } = await supabase.rpc('assign_user_role', {
      p_target_user: target.id,
      p_role: role,
      p_brand_id: role === 'brand_manager' ? brandId : undefined,
      p_store_id: role === 'store_manager' || role === 'staff' ? storeId : undefined,
    })
    setSaving(false)
    if (error) {
      toast({ title: 'Không gán được', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Đã gán vai trò', description: `${target.email} → ${ROLE_LABELS[role]}` })
    onOpenChange(false)
    onSaved()
  }

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="size-4" />
            Gán vai trò
          </DialogTitle>
          <DialogDescription>{target?.email}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Vai trò</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger><SelectValue placeholder="Chọn vai trò" /></SelectTrigger>
              <SelectContent>
                {roleOptions.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {role === 'brand_manager' && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Thương hiệu phụ trách</Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger><SelectValue placeholder="Chọn thương hiệu" /></SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(role === 'store_manager' || role === 'staff') && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Plus className="size-3" /> Cửa hàng (gán thêm sau khi lưu nếu cần nhiều hơn 1)
              </Label>
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger><SelectValue placeholder="Chọn cửa hàng" /></SelectTrigger>
                <SelectContent>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving || !role} className="gap-2">
            {saving && <Loader2 className="size-4 animate-spin" />}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
