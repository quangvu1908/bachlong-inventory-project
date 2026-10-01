'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Settings2,
  Store,
  Bell,
  Scale,
  Database,
  Palette,
  ShieldCheck,
  ChevronRight,
  Save,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useInventoryStore } from '@/lib/inventory-store'
import { cn } from '@/lib/utils'

interface SettingsState {
  shopName: string
  currency: string
  timezone: string
  lowStockAlert: boolean
  dailyCheckBar: boolean
  weeklyCheckWarehouse: boolean
  autoCalcCost: boolean
  defaultUnitKho: string
  defaultUnitBar: string
  rounding: number
}

const defaultSettings: SettingsState = {
  shopName: 'Trà House',
  currency: 'VND',
  timezone: 'Asia/Ho_Chi_Minh',
  lowStockAlert: true,
  dailyCheckBar: true,
  weeklyCheckWarehouse: false,
  autoCalcCost: true,
  defaultUnitKho: 'kg',
  defaultUnitBar: 'g',
  rounding: 0,
}

interface SettingsSheetProps {
  open: boolean
  onOpenChange: (o: boolean) => void
}

export function SettingsSheet({ open, onOpenChange }: SettingsSheetProps) {
  const { toast } = useToast()
  const resetData = useInventoryStore((s) => s.resetData)
  const [settings, setSettings] = React.useState<SettingsState>(defaultSettings)

  const update = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => setSettings((s) => ({ ...s, [key]: value }))

  const handleSave = () => {
    toast({
      title: 'Đã lưu cài đặt',
      description: 'Các thay đổi đã được áp dụng cho hệ thống.',
    })
    onOpenChange(false)
  }

  const handleResetSettings = () => {
    setSettings(defaultSettings)
    toast({
      title: 'Đã khôi phục mặc định',
      description: 'Tất cả cài đặt trở về giá trị ban đầu.',
    })
  }

  const handleResetData = () => {
    resetData()
    toast({
      title: 'Đã đặt lại dữ liệu kho',
      description: 'Nguyên vật liệu & giao dịch về trạng thái ban đầu.',
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-border/60 px-6 py-5">
          <SheetTitle className="flex items-center gap-2">
            <Settings2 className="size-5 text-primary" />
            Cài đặt hệ thống
          </SheetTitle>
          <SheetDescription>
            Tùy chỉnh thông tin cửa hàng, đơn vị tính và nhắc nhở kiểm kê.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto scrollbar-cream px-6 py-5">
          {/* Store info */}
          <SettingGroup icon={Store} title="Thông tin cửa hàng">
            <Field label="Tên cửa hàng">
              <Input
                value={settings.shopName}
                onChange={(e) => update('shopName', e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Đơn vị tiền tệ">
                <Select
                  value={settings.currency}
                  onValueChange={(v) => update('currency', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VND">VND (₫)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Múi giờ">
                <Select
                  value={settings.timezone}
                  onValueChange={(v) => update('timezone', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</SelectItem>
                    <SelectItem value="Asia/Bangkok">Asia/Bangkok</SelectItem>
                    <SelectItem value="Asia/Singapore">Asia/Singapore</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </SettingGroup>

          {/* Units */}
          <SettingGroup icon={Scale} title="Đơn vị tính mặc định">
            <div className="grid grid-cols-2 gap-3">
              <Field label="ĐVT Kho (lớn)">
                <Select
                  value={settings.defaultUnitKho}
                  onValueChange={(v) => update('defaultUnitKho', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['kg', 'lít', 'lon', 'khay', 'hộp', 'bịch', 'chai'].map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="ĐVT Bar (nhỏ)">
                <Select
                  value={settings.defaultUnitBar}
                  onValueChange={(v) => update('defaultUnitBar', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['g', 'ml', 'miếng', 'lon', 'chai'].map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Làm tròn giá vốn (số lẻ)">
              <Select
                value={String(settings.rounding)}
                onValueChange={(v) => update('rounding', Number(v))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Không làm tròn</SelectItem>
                  <SelectItem value="10">Tròn 10đ</SelectItem>
                  <SelectItem value="100">Tròn 100đ</SelectItem>
                  <SelectItem value="1000">Tròn 1.000đ</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </SettingGroup>

          {/* Alerts */}
          <SettingGroup icon={Bell} title="Nhắc nhở & cảnh báo">
            <ToggleRow
              label="Cảnh báo sắp hết hàng"
              description="Hiển thị chấm đỏ khi tồn kho ≤ mức tối thiểu"
              checked={settings.lowStockAlert}
              onCheckedChange={(v) => update('lowStockAlert', v)}
            />
            <Separator />
            <ToggleRow
              label="Nhắc Kiểm Bar cuối ngày"
              description="Bắt buộc kiểm kê Quầy Bar mỗi cuối ngày"
              checked={settings.dailyCheckBar}
              onCheckedChange={(v) => update('dailyCheckBar', v)}
            />
            <Separator />
            <ToggleRow
              label="Nhắc Kiểm Kho đầu tuần"
              description="Gợi ý kiểm kê Kho Dự Trữ định kỳ hàng tuần"
              checked={settings.weeklyCheckWarehouse}
              onCheckedChange={(v) => update('weeklyCheckWarehouse', v)}
            />
          </SettingGroup>

          {/* Calculation */}
          <SettingGroup icon={ShieldCheck} title="Tính toán & giá vốn">
            <ToggleRow
              label="Tự động tính giá vốn"
              description="Áp dụng công thức Tiêu thụ = Tồn đầu + Nhập − Tồn cuối"
              checked={settings.autoCalcCost}
              onCheckedChange={(v) => update('autoCalcCost', v)}
            />
          </SettingGroup>

          {/* Data */}
          <SettingGroup icon={Database} title="Dữ liệu & sao lưu">
            <Button variant="outline" className="w-full justify-start gap-2">
              <Database className="size-4" />
              Xuất dữ liệu kho (CSV)
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <RotateCcw className="size-4" />
              Khôi phục từ bản sao lưu
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                  Đặt lại dữ liệu kho…
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Đặt lại dữ liệu kho?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Toàn bộ nguyên vật liệu và lịch sử giao dịch sẽ trở về trạng thái ban đầu. Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleResetData}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Đặt lại
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SettingGroup>
        </div>

        <SheetFooter className="border-t border-border/60 px-6 py-4">
          <Button variant="ghost" onClick={handleResetSettings} className="gap-2">
            <RotateCcw className="size-4" />
            Khôi phục
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="size-4" />
            Lưu cài đặt
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function SettingGroup({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-0.5">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

/* ---------- Inline settings overview section ---------- */

const settingsCards = [
  {
    icon: Store,
    title: 'Thông tin cửa hàng',
    desc: 'Tên, đơn vị tiền tệ, múi giờ',
    color: 'text-amber-600 bg-amber-500/10 ring-amber-500/20',
  },
  {
    icon: Scale,
    title: 'Đơn vị tính',
    desc: 'ĐVT Kho · ĐVT Bar · hệ số quy đổi',
    color: 'text-teal-600 bg-teal-500/10 ring-teal-500/20',
  },
  {
    icon: Bell,
    title: 'Nhắc nhở kiểm kê',
    desc: 'Cảnh báo hết hàng, nhắc Kiểm Bar/Kho',
    color: 'text-rose-600 bg-rose-500/10 ring-rose-500/20',
  },
  {
    icon: ShieldCheck,
    title: 'Tính giá vốn',
    desc: 'Tự động công thức Tiêu thụ',
    color: 'text-violet-600 bg-violet-500/10 ring-violet-500/20',
  },
  {
    icon: Database,
    title: 'Dữ liệu & sao lưu',
    desc: 'Xuất CSV, khôi phục bản lưu',
    color: 'text-emerald-600 bg-emerald-500/10 ring-emerald-500/20',
  },
  {
    icon: Palette,
    title: 'Giao diện',
    desc: 'Chế độ sáng/tối, màu thương hiệu',
    color: 'text-primary bg-primary/10 ring-primary/20',
  },
]

interface SettingsOverviewProps {
  onOpen: () => void
}

export function SettingsOverview({ onOpen }: SettingsOverviewProps) {
  return (
    <section
      id="cai-dat"
      className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
    >
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="outline" className="mb-2 border-primary/30 bg-primary/5 text-primary">
            <Settings2 className="size-3.5" />
            Cài đặt & cấu hình
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Tùy chọn cài đặt hệ thống
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Tất cả cấu hình vận hành kho: thông tin cửa hàng, đơn vị tính, nhắc
            nhở kiểm kê và cách tính giá vốn.
          </p>
        </div>
        <Button onClick={onOpen} className="gap-2 rounded-full">
          <Settings2 className="size-4" />
          Mở bảng cài đặt
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingsCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <motion.button
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              onClick={onOpen}
              className="group text-left"
            >
              <Card className="h-full cursor-pointer border-border/60 p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      'grid size-11 place-items-center rounded-xl ring-1',
                      card.color
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
                <h3 className="mt-3 font-semibold">{card.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{card.desc}</p>
              </Card>
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}

export { type SettingsState, defaultSettings }
