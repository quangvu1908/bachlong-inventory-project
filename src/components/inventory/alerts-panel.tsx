'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  CalendarClock,
  PackagePlus,
  ShoppingCart,
  Clock,
  X,
  TrendingDown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  useInventoryStats,
  formatVND,
  formatNum,
  formatDate,
  daysUntil,
  expiryLevel,
  expiryLevelMeta,
} from '@/lib/inventory-stats'
import { categoryStyles, categoryLabels } from '@/lib/inventory-data'
import { cn } from '@/lib/utils'

interface AlertsPanelProps {
  onQuickReceipt?: (materialId: string, qty: number) => void
}

export function AlertsPanel({ onQuickReceipt }: AlertsPanelProps) {
  const stats = useInventoryStats()
  const [tab, setTab] = React.useState<'restock' | 'expiry'>('restock')

  const restockCount = stats.restockSuggestions.length
  const expiryCount = stats.expiringMaterials.length
  const totalAlerts = restockCount + expiryCount

  if (totalAlerts === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="grid size-10 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/25">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <div className="font-semibold text-emerald-700 dark:text-emerald-300">
                Không có cảnh báo nào
              </div>
              <div className="text-sm text-muted-foreground">
                Tất cả nguyên vật liệu đều đủ hàng và còn hạn sử dụng.
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <Card className="overflow-hidden border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="relative grid size-8 place-items-center rounded-lg bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
                  <AlertTriangle className="size-4" />
                  {totalAlerts > 0 && (
                    <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-white">
                      {totalAlerts}
                    </span>
                  )}
                </span>
                Cảnh báo & gợi ý
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                NVL sắp hết hàng cần nhập bổ sung và hạn sử dụng sắp đến
              </CardDescription>
            </div>
            {/* tabs */}
            <div className="flex shrink-0 gap-1 rounded-full bg-muted/60 p-1 text-xs">
              <TabButton
                active={tab === 'restock'}
                onClick={() => setTab('restock')}
                count={restockCount}
                tone="amber"
              >
                <ShoppingCart className="size-3.5" />
                Nhập bổ sung
              </TabButton>
              <TabButton
                active={tab === 'expiry'}
                onClick={() => setTab('expiry')}
                count={expiryCount}
                tone="rose"
              >
                <CalendarClock className="size-3.5" />
                Hạn sử dụng
              </TabButton>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <AnimatePresence mode="wait">
            {tab === 'restock' ? (
              <motion.div
                key="restock"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
              >
                <RestockList onQuickReceipt={onQuickReceipt} />
              </motion.div>
            ) : (
              <motion.div
                key="expiry"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
              >
                <ExpiryList />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </section>
  )
}

function TabButton({
  active,
  onClick,
  count,
  tone,
  children,
}: {
  active: boolean
  onClick: () => void
  count: number
  tone: 'amber' | 'rose'
  children: React.ReactNode
}) {
  const tones = {
    amber: 'bg-amber-500 text-white shadow-sm',
    rose: 'bg-rose-500 text-white shadow-sm',
  }
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-all',
        active ? tones[tone] : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
      {count > 0 && (
        <span
          className={cn(
            'grid min-w-[16px] place-items-center rounded-full px-1 text-[10px] font-bold',
            active ? 'bg-white/25 text-white' : 'bg-foreground/10 text-foreground'
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function RestockList({
  onQuickReceipt,
}: {
  onQuickReceipt?: (materialId: string, qty: number) => void
}) {
  const { restockSuggestions } = useInventoryStats()

  if (restockSuggestions.length === 0) {
    return <EmptyRow text="Không có NVL nào dưới mức tối thiểu." />
  }

  const totalSuggestedValue = restockSuggestions.reduce(
    (s, r) => s + r.suggested * r.m.unitPrice,
    0
  )

  return (
    <div>
      <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        <span>{restockSuggestions.length} NVL cần nhập bổ sung</span>
        <span>
          Tổng giá trị dự kiến:{' '}
          <span className="font-bold text-amber-700 dark:text-amber-300">
            {formatVND(totalSuggestedValue)}
          </span>
        </span>
      </div>
      <div className="divide-y divide-border/40">
        {restockSuggestions.map(({ m, deficit, suggested }) => {
          const ratio = m.minStock > 0 ? m.stock / m.minStock : 1
          return (
            <div
              key={m.id}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">
                    {m.name}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium',
                      categoryStyles[m.category]
                    )}
                  >
                    {categoryLabels[m.category]}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="text-destructive">
                    {formatNum(m.stock)} {m.unit}
                  </span>
                  <span>/ tối thiểu {formatNum(m.minStock)} {m.unit}</span>
                  {/* stock bar */}
                  <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'absolute inset-y-0 left-0 rounded-full transition-all',
                        ratio <= 0.5
                          ? 'bg-destructive'
                          : ratio <= 1
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      )}
                      style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Gợi ý nhập
                </div>
                <div className="text-sm font-bold text-amber-700 dark:text-amber-300">
                  +{formatNum(suggested)} {m.unit}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  ≈ {formatVND(suggested * m.unitPrice)}
                </div>
              </div>
              {onQuickReceipt && (
                <Button
                  size="sm"
                  className="shrink-0 gap-1.5 rounded-full"
                  onClick={() => onQuickReceipt(m.id, suggested)}
                >
                  <PackagePlus className="size-3.5" />
                  Nhập
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ExpiryList() {
  const { expiringMaterials } = useInventoryStats()

  if (expiringMaterials.length === 0) {
    return <EmptyRow text="Không có NVL nào sắp hết hạn." />
  }

  return (
    <div className="divide-y divide-border/40">
      {expiringMaterials.map(({ m, days, level }) => {
        const meta = expiryLevelMeta[level]
        return (
          <div
            key={m.id}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
          >
            <div
              className={cn(
                'grid size-9 shrink-0 place-items-center rounded-lg border',
                meta.classes
              )}
            >
              <Clock className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold">{m.name}</span>
                <span
                  className={cn(
                    'shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium',
                    meta.classes
                  )}
                >
                  {meta.label}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                Hết hạn {formatDate(m.expiryDate!)} · còn {formatNum(m.stock)} {m.unit} tại kho
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div
                className={cn(
                  'text-lg font-bold tabular-nums',
                  level === 'expired'
                    ? 'text-destructive'
                    : level === 'critical'
                    ? 'text-rose-600 dark:text-rose-300'
                    : 'text-amber-600 dark:text-amber-300'
                )}
              >
                {days! < 0 ? `${Math.abs(days!)}` : `${days!}`}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {days! < 0 ? 'ngày qua hạn' : 'ngày nữa'}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
      <div className="grid size-10 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
        <X className="size-5" />
      </div>
      <p className="text-sm">{text}</p>
    </div>
  )
}

// re-export for convenience
export { daysUntil, expiryLevel }
