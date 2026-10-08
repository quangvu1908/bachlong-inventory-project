'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Settings2,
  Store,
  Bell,
  Scale,
  ShieldCheck,
  Save,
  RotateCcw,
  Cloud,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Separator } from '@/components/ui/separator'
import { PageHeader, PageContainer } from '@/components/inventory/page-header'
import { useToast } from '@/hooks/use-toast'

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

export default function CaiDatPage() {
  const { toast } = useToast()
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
  }

  const handleResetSettings = () => {
    setSettings(defaultSettings)
    toast({
      title: 'Đã khôi phục mặc định',
      description: 'Tất cả cài đặt trở về giá trị ban đầu.',
    })
  }

  return (
    <PageContainer>
      <PageHeader
        icon={Settings2}
        title="Cài đặt"
        description="Cấu hình cửa hàng, đơn vị tính, nhắc nhở kiểm kê, kết nối Google Sheet và quản lý dữ liệu."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleResetSettings} className="gap-2">
              <RotateCcw className="size-4" />
              Khôi phục
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="size-4" />
              Lưu cài đặt
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Store info */}
        <SettingCard icon={Store} title="Thông tin cửa hàng">
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
        </SettingCard>

        {/* Units */}
        <SettingCard icon={Scale} title="Đơn vị tính mặc định">
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
        </SettingCard>

        {/* Alerts */}
        <SettingCard icon={Bell} title="Nhắc nhở & cảnh báo">
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
        </SettingCard>

        {/* Calculation */}
        <SettingCard icon={ShieldCheck} title="Tính toán & giá vốn">
          <ToggleRow
            label="Tự động tính giá vốn"
            description="Áp dụng công thức Tiêu thụ = Tồn đầu + Nhập − Tồn cuối"
            checked={settings.autoCalcCost}
            onCheckedChange={(v) => update('autoCalcCost', v)}
          />
        </SettingCard>

        {/* Google Sheet */}
        <GoogleSheetCard />
      </div>
    </PageContainer>
  )
}

function SettingCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
            <Icon className="size-4" />
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
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

/* ---------- Google Sheet integration ---------- */

function GoogleSheetCard() {
  const { toast } = useToast()
  const [sheetId, setSheetId] = React.useState('')
  const [appsScriptUrl, setAppsScriptUrl] = React.useState('')
  const [connected, setConnected] = React.useState(false)
  const [syncing, setSyncing] = React.useState(false)

  const handleConnect = () => {
    if (!appsScriptUrl) {
      toast({
        title: 'Thiếu URL Apps Script',
        description: 'Vui lòng dán URL Web App từ Google Apps Script.',
        variant: 'destructive',
      })
      return
    }
    setSyncing(true)
    // Simulate connection check
    setTimeout(() => {
      setSyncing(false)
      setConnected(true)
      toast({
        title: 'Đã kết nối Google Sheet',
        description: sheetId
          ? `Sheet ID: ${sheetId.slice(0, 12)}…`
          : 'Sẽ đồng bộ NVL & giao dịch.',
      })
    }, 1200)
  }

  const handleDisconnect = () => {
    setConnected(false)
    setSheetId('')
    setAppsScriptUrl('')
    toast({
      title: 'Đã ngắt kết nối Google Sheet',
      description: 'Dữ liệu quay lại lưu tại trình duyệt (localStorage).',
    })
  }

  return (
    <SettingCard icon={Cloud} title="Kết nối Google Sheet">
      <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
        Lưu dữ liệu NVL & giao dịch vào Google Sheet qua Google Apps Script Web App.
        Khi kết nối, mọi thao tác sẽ đồng bộ lên Sheet (thay vì chỉ localStorage).
      </div>
      <Field label="Google Sheet ID">
        <Input
          value={sheetId}
          onChange={(e) => setSheetId(e.target.value)}
          placeholder="VD: 1AbCdEf… (từ URL Sheet)"
          disabled={connected}
        />
      </Field>
      <Field label="Google Apps Script Web App URL">
        <Input
          value={appsScriptUrl}
          onChange={(e) => setAppsScriptUrl(e.target.value)}
          placeholder="https://script.google.com/macros/s/…/exec"
          disabled={connected}
        />
      </Field>
      <div className="flex items-center gap-2 pt-1">
        {connected ? (
          <>
            <Badge className="gap-1.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-3.5" />
              Đã kết nối
            </Badge>
            <Button variant="outline" size="sm" onClick={handleDisconnect} className="ml-auto">
              Ngắt kết nối
            </Button>
          </>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={syncing}
            className="ml-auto gap-2"
            size="sm"
          >
            {syncing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Đang kết nối…
              </>
            ) : (
              <>
                <Cloud className="size-4" />
                Kết nối
              </>
            )}
          </Button>
        )}
      </div>
      <details className="mt-2 rounded-lg border border-border/60 bg-muted/20 p-2 text-[11px] text-muted-foreground">
        <summary className="cursor-pointer font-medium text-foreground/80">
          Hướng dẫn thiết lập Google Sheet
        </summary>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Tạo Google Sheet mới, ghi nhớ Sheet ID từ URL.</li>
          <li>Mở Extensions → Apps Script, dán script xử lý GET/POST.</li>
          <li>Deploy as Web App (access: Anyone).</li>
          <li>Copy URL Web App dán vào ô trên, bấm Kết nối.</li>
        </ol>
      </details>
    </SettingCard>
  )
}
