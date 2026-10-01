'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  Eye,
  Repeat,
  Activity,
  FileBarChart,
  ShieldCheck,
} from 'lucide-react'
import {
  inventoryOperations,
  type InventoryOperation,
  type OperationCategory,
} from '@/lib/inventory-data'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const categoryMeta: Record<
  OperationCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; badge: string }
> = {
  action: {
    label: 'Nghiệp vụ thao tác',
    icon: Activity,
    badge: 'bg-amber-500/12 text-amber-700 border-amber-500/25 dark:text-amber-300',
  },
  periodic: {
    label: 'Kiểm kê định kỳ',
    icon: Repeat,
    badge: 'bg-teal-500/12 text-teal-700 border-teal-500/25 dark:text-teal-300',
  },
  report: {
    label: 'Báo cáo — chỉ xem',
    icon: FileBarChart,
    badge: 'bg-violet-500/12 text-violet-700 border-violet-500/25 dark:text-violet-300',
  },
}

interface OperationsGridProps {
  onSelect?: (op: InventoryOperation) => void
}

export function OperationsGrid({ onSelect }: OperationsGridProps) {
  return (
    <section id="nghiep-vu" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="outline" className="mb-2 border-accent/30 bg-accent/5 text-accent-foreground">
            <ShieldCheck className="size-3.5" />
            6 nghiệp vụ cốt lõi
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Các nghiệp vụ trong quy trình
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Bốn nghiệp vụ thao tác / kiểm kê định kỳ để nhập liệu, hai báo cáo
            chỉ đọc để tra cứu tồn kho và giá vốn.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {(Object.keys(categoryMeta) as OperationCategory[]).map((cat) => {
            const meta = categoryMeta[cat]
            const Icon = meta.icon
            return (
              <span
                key={cat}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium',
                  meta.badge
                )}
              >
                <Icon className="size-3.5" />
                {meta.label}
              </span>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {inventoryOperations.map((op, idx) => (
          <OperationCard key={op.id} op={op} index={idx} onSelect={onSelect} />
        ))}
      </div>
    </section>
  )
}

function OperationCard({
  op,
  index,
  onSelect,
}: {
  op: InventoryOperation
  index: number
  onSelect?: (op: InventoryOperation) => void
}) {
  const Icon = op.icon
  const meta = categoryMeta[op.category]
  const isReport = op.category === 'report'

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
    >
      <Card
        className={cn(
          'group relative h-full cursor-pointer overflow-hidden p-5 transition-all hover:-translate-y-1 hover:shadow-xl',
          'border-border/60 hover:border-primary/40'
        )}
        onClick={() => onSelect?.(op)}
      >
        {/* Decorative gradient blob */}
        <div
          className={cn(
            'pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br opacity-60 blur-2xl transition-opacity group-hover:opacity-100',
            op.accent
          )}
        />

        <div className="relative flex items-start justify-between gap-3">
          <div
            className={cn(
              'grid size-12 place-items-center rounded-xl bg-gradient-to-br ring-1 ring-border/40',
              op.accent
            )}
          >
            <Icon className="size-6" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                meta.badge
              )}
            >
              {isReport ? <Eye className="size-3" /> : <Activity className="size-3" />}
              {isReport ? 'Chỉ xem' : 'Nhập liệu'}
            </span>
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {op.code}
            </code>
          </div>
        </div>

        <div className="relative mt-4">
          <h3 className="text-lg font-semibold leading-tight">{op.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {op.description}
          </p>
        </div>

        <div className="relative mt-4 flex items-center justify-between border-t border-border/50 pt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Repeat className="size-3.5" />
            <span className="font-medium">{op.frequency}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              onSelect?.(op)
            }}
          >
            {isReport ? 'Mở báo cáo' : 'Thực hiện'}
            <ArrowUpRight className="size-3.5" />
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
