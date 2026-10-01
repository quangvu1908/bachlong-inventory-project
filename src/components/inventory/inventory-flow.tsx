'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Truck,
  Warehouse,
  Coffee,
  ArrowRight,
  Sparkles,
  TrendingUp,
  PackageCheck,
  AlertTriangle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface InventoryFlowProps {
  totalMaterials: number
  lowStockCount: number
  todayReceipts: number
}

const stages = [
  {
    id: 'supplier',
    label: 'Nhà cung cấp',
    sub: 'Nguồn NVL',
    icon: Truck,
    color: 'text-amber-600 dark:text-amber-300',
    ring: 'ring-amber-500/30',
    bg: 'from-amber-500/15 to-amber-500/0',
    action: 'Nhập Hàng',
  },
  {
    id: 'warehouse',
    label: 'Kho Dự Trữ',
    sub: 'Mã: KIEM_KE',
    icon: Warehouse,
    color: 'text-teal-600 dark:text-teal-300',
    ring: 'ring-teal-500/30',
    bg: 'from-teal-500/15 to-teal-500/0',
    action: 'Xuất Kho Ra Bar',
  },
  {
    id: 'bar',
    label: 'Quầy Bar',
    sub: 'Mã: KIEM_KE_BAR',
    icon: Coffee,
    color: 'text-rose-600 dark:text-rose-300',
    ring: 'ring-rose-500/30',
    bg: 'from-rose-500/15 to-rose-500/0',
    action: 'Bán & Kiểm Bar',
  },
]

export function InventoryFlow({
  totalMaterials,
  lowStockCount,
  todayReceipts,
}: InventoryFlowProps) {
  return (
    <section id="luong-nvl" className="relative">
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-start gap-4 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="max-w-2xl">
            <Badge
              variant="outline"
              className="mb-3 gap-1.5 border-primary/30 bg-primary/5 text-primary"
            >
              <Sparkles className="size-3.5" />
              Vận hành số kho theo luồng nguyên vật liệu
            </Badge>
            <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Kiểm soát tồn kho{' '}
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Trà House
              </span>
            </h1>
            <p className="mt-3 text-balance text-sm text-muted-foreground sm:text-base">
              Một dòng chảy duy nhất: từ nhà cung cấp nhập vào Kho Dự Trữ, rồi
              xuất sang Quầy Bar. Mọi nghiệp vụ đều được ghi nhận theo đúng tần
              suất — nhập/xuất mỗi lần, kiểm kê định kỳ.
            </p>
          </div>

          {/* Quick stats */}
          <div className="grid w-full grid-cols-3 gap-3 lg:w-auto">
            <StatChip
              icon={PackageCheck}
              label="NVL đang quản lý"
              value={totalMaterials}
              tone="primary"
            />
            <StatChip
              icon={TrendingUp}
              label="Phiếu nhập hôm nay"
              value={todayReceipts}
              tone="accent"
            />
            <StatChip
              icon={AlertTriangle}
              label="Sắp hết hàng"
              value={lowStockCount}
              tone={lowStockCount > 0 ? 'destructive' : 'muted'}
            />
          </div>
        </motion.div>

        {/* Flow diagram */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-8 lg:mt-12"
        >
          <Card className="overflow-hidden border-border/60 p-5 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold sm:text-xl">
                  Sơ đồ luồng nguyên vật liệu
                </h2>
                <p className="text-sm text-muted-foreground">
                  Hàng di chuyển một chiều — mỗi chặng có một nghiệp vụ ghi nhận
                </p>
              </div>
              <Badge
                variant="secondary"
                className="hidden gap-1.5 sm:inline-flex"
              >
                <span className="size-1.5 animate-pulse rounded-full bg-accent" />
                Đang vận hành
              </Badge>
            </div>

            {/* Flow stages */}
            <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
              {stages.map((stage, idx) => {
                const Icon = stage.icon
                const stageEl = (
                  <div
                    className={cn(
                      'group relative flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-gradient-to-b p-5 text-center transition-all hover:-translate-y-1 hover:shadow-lg sm:p-6',
                      stage.bg
                    )}
                  >
                    <div
                      className={cn(
                        'grid size-14 place-items-center rounded-2xl bg-card shadow-sm ring-2 transition-transform group-hover:scale-110 sm:size-16',
                        stage.ring
                      )}
                    >
                      <Icon className={cn('size-7 sm:size-8', stage.color)} />
                    </div>
                    <div>
                      <div className="text-base font-semibold sm:text-lg">
                        {stage.label}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {stage.sub}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="gap-1 border-border/70 bg-card/60 text-[11px] font-medium"
                    >
                      <ArrowRight className="size-3" />
                      {stage.action}
                    </Badge>
                    {/* Stage number */}
                    <span className="absolute left-3 top-3 grid size-6 place-items-center rounded-full bg-card/80 text-[11px] font-bold text-muted-foreground ring-1 ring-border/60">
                      {idx + 1}
                    </span>
                  </div>
                )

                return (
                  <React.Fragment key={stage.id}>
                    {stageEl}
                    {idx < stages.length - 1 && (
                      <div className="flex items-center justify-center lg:py-0">
                        <FlowConnector />
                      </div>
                    )}
                  </React.Fragment>
                )
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 pt-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-amber-500" />
                Nghiệp vụ thao tác (mỗi lần)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-teal-500" />
                Kiểm kê định kỳ (bắt buộc)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-violet-500" />
                Báo cáo — chỉ xem
              </span>
              <span className="ml-auto hidden sm:inline">
                Công thức giá vốn:{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  Tiêu thụ = Tồn đầu + Nhập − Tồn cuối
                </code>
              </span>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}

function FlowConnector() {
  return (
    <div className="flex items-center gap-1 py-1">
      <svg
        width="64"
        height="24"
        viewBox="0 0 64 24"
        fill="none"
        className="hidden lg:block"
        aria-hidden
      >
        <line
          x1="2"
          y1="12"
          x2="56"
          y2="12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="flow-line text-primary/50"
        />
        <path
          d="M56 6 L62 12 L56 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="text-primary/70"
        />
      </svg>
      <div className="flex items-center lg:hidden">
        <ArrowRight className="size-5 rotate-90 text-primary/50" />
      </div>
    </div>
  )
}

function StatChip({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  tone: 'primary' | 'accent' | 'destructive' | 'muted'
}) {
  const tones = {
    primary: 'text-primary bg-primary/10 ring-primary/20',
    accent: 'text-accent-foreground bg-accent/15 ring-accent/30',
    destructive: 'text-destructive bg-destructive/10 ring-destructive/25',
    muted: 'text-muted-foreground bg-muted ring-border',
  }
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-card/70 p-3 backdrop-blur lg:min-w-[140px]">
      <div
        className={cn(
          'grid size-8 place-items-center rounded-lg ring-1',
          tones[tone]
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="text-xl font-bold leading-none tabular-nums sm:text-2xl">
        {value}
      </div>
      <div className="text-[11px] leading-tight text-muted-foreground">
        {label}
      </div>
    </div>
  )
}
