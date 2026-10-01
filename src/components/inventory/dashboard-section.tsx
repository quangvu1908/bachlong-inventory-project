'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import {
  Wallet,
  Boxes,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  PackagePlus,
  ArrowRightLeft,
  ClipboardCheck,
  Activity,
  CalendarClock,
  Minus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AnimatedCounter } from '@/components/inventory/animated-counter'
import { useInventoryStats, formatVND, formatNum } from '@/lib/inventory-stats'
import { cn } from '@/lib/utils'

const CATEGORY_COLORS: Record<string, string> = {
  tra: 'oklch(0.62 0.115 52)',
  sua: 'oklch(0.74 0.135 135)',
  duong: 'oklch(0.72 0.14 70)',
  tran: 'oklch(0.58 0.16 300)',
  topping: 'oklch(0.6 0.16 200)',
  khac: 'oklch(0.55 0.1 145)',
}

export function DashboardSection() {
  const stats = useInventoryStats()

  const kpis = [
    {
      label: 'Giá trị Kho Dự Trữ',
      numeric: stats.totalStockValue,
      kind: 'currency' as const,
      icon: Wallet,
      tone: 'text-amber-600 bg-amber-500/10 ring-amber-500/20',
      sub: `${stats.totalMaterials} nguyên vật liệu`,
    },
    {
      label: 'Giá trị tại Quầy Bar',
      numeric: stats.totalBarValue,
      kind: 'currency' as const,
      icon: Boxes,
      tone: 'text-rose-600 bg-rose-500/10 ring-rose-500/20',
      sub: 'Theo đơn giá quy đổi',
    },
    {
      label: 'Sắp hết hàng',
      numeric: stats.lowStockCount,
      kind: 'count' as const,
      icon: AlertTriangle,
      tone:
        stats.lowStockCount > 0
          ? 'text-destructive bg-destructive/10 ring-destructive/25'
          : 'text-emerald-600 bg-emerald-500/10 ring-emerald-500/20',
      sub:
        stats.lowStockCount > 0
          ? 'Cần nhập bổ sung'
          : 'Tất cả đủ hàng',
    },
    {
      label: 'Nhập hôm nay',
      numeric: stats.todayReceiptValue,
      kind: 'currency' as const,
      icon: TrendingUp,
      tone: 'text-teal-600 bg-teal-500/10 ring-teal-500/20',
      sub: `${stats.todayReceipts} phiếu nhập`,
    },
  ]

  const trendData = stats.last7Days.map((d) => ({
    name: d.label,
    Nhập: d.receipt,
    'Xuất Bar': d.issue,
    'Kiểm kê': d.check,
  }))

  const stockLevelData = stats.materials
    .slice()
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 6)
    .map((m) => ({
      name: m.name.length > 14 ? m.name.slice(0, 13) + '…' : m.name,
      Kho: Number(m.stock.toFixed(1)),
      Bar: Number((m.barStock / (m.convertFactor ?? 1)).toFixed(1)),
    }))

  return (
    <section
      id="tong-quan"
      className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="outline" className="mb-2 border-primary/30 bg-primary/5 text-primary">
            <Activity className="size-3.5" />
            Bảng điều khiển
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Tổng quan kho & quầy bar
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Giá trị tồn kho, phân bổ theo danh mục và xu hướng giao dịch 7 ngày
            gần nhất.
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
            >
              <Card className="group h-full border-border/60 p-4 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      'grid size-9 place-items-center rounded-lg ring-1 transition-transform group-hover:scale-110',
                      kpi.tone
                    )}
                  >
                    <Icon className="size-4.5" />
                  </div>
                </div>
                <div className="mt-3 text-xl font-bold leading-tight tabular-nums sm:text-2xl">
                  <AnimatedCounter
                    value={kpi.numeric}
                    format={kpi.kind === 'currency' ? formatVND : (n) => String(Math.round(n))}
                  />
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {kpi.label}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground/80">
                  {kpi.sub}
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Trend strip + expiry summary */}
      <TrendStrip />

      {/* Charts row */}
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        {/* Donut: value by category */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Giá trị kho theo danh mục</CardTitle>
            <CardDescription className="text-xs">
              Phân bổ giá trị tồn kho Dự Trữ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byCategory}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {stats.byCategory.map((entry) => (
                      <Cell
                        key={entry.category}
                        fill={CATEGORY_COLORS[entry.category]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const p = payload[0].payload as { label: string; value: number; count: number }
                      return (
                        <div className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs shadow-md">
                          <div className="font-semibold">{p.label}</div>
                          <div className="tabular-nums">{formatVND(p.value)}</div>
                          <div className="text-muted-foreground">{p.count} NVL</div>
                        </div>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {stats.byCategory.map((c) => (
                <div
                  key={c.category}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-xs"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: CATEGORY_COLORS[c.category] }}
                    />
                    <span className="truncate text-muted-foreground">{c.label}</span>
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatVND(c.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bar: stock levels top 6 */}
        <Card className="border-border/60 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Mức tồn top 6 NVL</CardTitle>
            <CardDescription className="text-xs">
              So sánh tồn Kho (đvt lớn) và quy đổi Bar (đvt lớn)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stockLevelData}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                  barGap={2}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.7 0.02 60 / 0.25)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: 'oklch(0.5 0.02 60)' }}
                    interval={0}
                    angle={-18}
                    textAnchor="end"
                    height={52}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'oklch(0.5 0.02 60)' }}
                    width={40}
                  />
                  <Tooltip
                    cursor={{ fill: 'oklch(0.7 0.02 60 / 0.12)' }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs shadow-md">
                          <div className="mb-1 font-semibold">{label}</div>
                          {payload.map((pl) => (
                            <div key={pl.dataKey as string} className="flex items-center gap-2">
                              <span
                                className="size-2 rounded-full"
                                style={{ background: pl.color }}
                              />
                              <span className="text-muted-foreground">{pl.name}:</span>
                              <span className="font-medium tabular-nums">{formatNum(Number(pl.value))}</span>
                            </div>
                          ))}
                        </div>
                      )
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar dataKey="Kho" fill="oklch(0.62 0.115 52)" radius={[4, 4, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="Bar" fill="oklch(0.74 0.135 135)" radius={[4, 4, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend line */}
      <Card className="mt-4 border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Xu hướng giao dịch 7 ngày</CardTitle>
              <CardDescription className="text-xs">
                Số lượng phiếu theo loại nghiệp vụ mỗi ngày
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <LegendDot color="oklch(0.62 0.115 52)" label="Nhập" icon={PackagePlus} />
              <LegendDot color="oklch(0.72 0.14 70)" label="Xuất Bar" icon={ArrowRightLeft} />
              <LegendDot color="oklch(0.58 0.16 300)" label="Kiểm kê" icon={ClipboardCheck} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.7 0.02 60 / 0.25)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'oklch(0.5 0.02 60)' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'oklch(0.5 0.02 60)' }}
                  width={32}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs shadow-md">
                        <div className="mb-1 font-semibold">{label}</div>
                        {payload.map((pl) => (
                          <div key={pl.dataKey as string} className="flex items-center gap-2">
                            <span
                              className="size-2 rounded-full"
                              style={{ background: pl.color }}
                            />
                            <span className="text-muted-foreground">{pl.name}:</span>
                            <span className="font-medium tabular-nums">{pl.value} phiếu</span>
                          </div>
                        ))}
                      </div>
                    )
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="Nhập"
                  stroke="oklch(0.62 0.115 52)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: 'oklch(0.62 0.115 52)' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Xuất Bar"
                  stroke="oklch(0.72 0.14 70)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: 'oklch(0.72 0.14 70)' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Kiểm kê"
                  stroke="oklch(0.58 0.16 300)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: 'oklch(0.58 0.16 300)' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

function TrendStrip() {
  const [days, setDays] = React.useState<7 | 30>(7)
  const stats = useInventoryStats(days)
  const { trends, expiringMaterials } = stats

  const expiringCount = expiringMaterials.length
  const criticalCount = expiringMaterials.filter(
    (e) => e.level === 'expired' || e.level === 'critical'
  ).length

  const periodLabel = `${days} ngày`
  const trendCards = [
    {
      label: `Tiền nhập ${periodLabel}`,
      current: trends.receiptValue.current,
      previous: trends.receiptValue.previous,
      delta: trends.receiptValue.delta,
      icon: PackagePlus,
      tone: 'text-teal-600 bg-teal-500/10 ring-teal-500/20',
    },
    {
      label: `Xuất sang Bar ${periodLabel}`,
      current: trends.issueValue.current,
      previous: trends.issueValue.previous,
      delta: trends.issueValue.delta,
      icon: ArrowRightLeft,
      tone: 'text-orange-600 bg-orange-500/10 ring-orange-500/20',
    },
    {
      label: 'Số phiếu nhập',
      current: trends.receiptCount.current,
      previous: trends.receiptCount.previous,
      delta: trends.receiptCount.delta,
      icon: TrendingUp,
      tone: 'text-amber-600 bg-amber-500/10 ring-amber-500/20',
      isCount: true,
    },
  ]

  return (
    <div className="mt-3">
      {/* Period toggle */}
      <div className="mb-2 flex items-center justify-end">
        <div className="inline-flex items-center gap-0.5 rounded-full border border-border/60 bg-card/60 p-0.5 text-xs">
          <button
            onClick={() => setDays(7)}
            className={cn(
              'rounded-full px-3 py-1 font-medium transition-all',
              days === 7
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            7 ngày
          </button>
          <button
            onClick={() => setDays(30)}
            className={cn(
              'rounded-full px-3 py-1 font-medium transition-all',
              days === 30
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            30 ngày
          </button>
        </div>
      </div>
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
      className="grid gap-3 lg:grid-cols-4"
    >
      {trendCards.map((c) => {
        const Icon = c.icon
        const delta = c.delta
        const isUp = delta > 0
        const isFlat = delta === 0
        const DeltaIcon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown
        const deltaTone = isFlat
          ? 'text-muted-foreground bg-muted'
          : isUp
          ? 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-300'
          : 'text-rose-700 bg-rose-500/10 dark:text-rose-300'
        return (
          <Card key={c.label} className="border-border/60 p-3.5">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'grid size-7 place-items-center rounded-lg ring-1',
                  c.tone
                )}
              >
                <Icon className="size-3.5" />
              </div>
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {c.label}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-lg font-bold tabular-nums">
                {c.isCount ? (
                  <AnimatedCounter
                    value={c.current}
                    format={(n) => String(Math.round(n))}
                  />
                ) : (
                  <AnimatedCounter value={c.current} format={formatVND} />
                )}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                  deltaTone
                )}
                title={`Kỳ trước: ${c.isCount ? c.previous : formatVND(c.previous)}`}
              >
                <DeltaIcon className="size-3" />
                {isFlat
                  ? '0%'
                  : `${isUp ? '+' : ''}${delta.toFixed(0)}%`}
              </span>
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground/80">
              vs {days} ngày trước: {c.isCount ? c.previous : formatVND(c.previous)}
            </div>
          </Card>
        )
      })}

      {/* Expiry summary card */}
      <Card
        className={cn(
          'border-border/60 p-3.5',
          criticalCount > 0 && 'border-rose-500/30 bg-rose-500/5'
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'grid size-7 place-items-center rounded-lg ring-1',
              criticalCount > 0
                ? 'text-rose-600 bg-rose-500/10 ring-rose-500/20'
                : 'text-emerald-600 bg-emerald-500/10 ring-emerald-500/20'
            )}
          >
            <CalendarClock className="size-3.5" />
          </div>
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Hạn sử dụng
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <span className="text-lg font-bold tabular-nums">
            <AnimatedCounter value={expiringCount} format={(n) => String(Math.round(n))} />
          </span>
          {criticalCount > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
              <AlertTriangle className="size-3" />
              {criticalCount} sắp hết
            </span>
          )}
        </div>
        <div className="mt-0.5 text-[10px] text-muted-foreground/80">
          {expiringCount > 0
            ? 'Xem chi tiết tại Cảnh báo & gợi ý'
            : 'Tất cả NVL còn hạn an toàn'}
        </div>
      </Card>
    </motion.div>
    </div>
  )
}

function LegendDot({
  color,
  label,
  icon: Icon,
}: {
  color: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-2 py-0.5 text-muted-foreground">
      <span className="size-2 rounded-full" style={{ background: color }} />
      <Icon className="size-3" />
      {label}
    </span>
  )
}
