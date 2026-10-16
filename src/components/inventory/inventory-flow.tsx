'use client'

import * as React from 'react'
import { Truck, Warehouse, Coffee, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface InventoryFlowProps {
  storeName: string
}

const stages = [
  {
    id: 'supplier',
    label: 'Nhà cung cấp',
    icon: Truck,
    color: 'text-[#B48535]',
    bg: 'bg-[#FFF4E3]',
    action: 'Nhập Hàng',
  },
  {
    id: 'warehouse',
    label: 'Kho Dự Trữ',
    icon: Warehouse,
    color: 'text-primary',
    bg: 'bg-primary/10',
    action: 'Xuất ra Bar',
  },
  {
    id: 'bar',
    label: 'Quầy Bar',
    icon: Coffee,
    color: 'text-accent-foreground',
    bg: 'bg-accent/50',
    action: 'Bán & Kiểm Bar',
  },
]

const todayLabel = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
}).format(new Date())

export function InventoryFlow({ storeName }: InventoryFlowProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Tổng quan</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {storeName} · {todayLabel}
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border-border/60 p-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          {stages.map((stage, idx) => {
            const Icon = stage.icon
            return (
              <React.Fragment key={stage.id}>
                <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5">
                  <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', stage.bg)}>
                    <Icon className={cn('size-4', stage.color)} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold leading-none">{stage.label}</div>
                    <Badge variant="outline" className="mt-1 gap-1 border-border/60 px-1.5 py-0 text-[10px] font-normal text-muted-foreground">
                      {stage.action}
                    </Badge>
                  </div>
                </div>
                {idx < stages.length - 1 && (
                  <ArrowRight className="size-3.5 shrink-0 rotate-90 text-muted-foreground/50 sm:rotate-0" />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </Card>
    </section>
  )
}
