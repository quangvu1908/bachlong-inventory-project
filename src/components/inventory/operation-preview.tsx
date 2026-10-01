'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  Calendar,
  Info,
  ListChecks,
  Lock,
} from 'lucide-react'
import type { InventoryOperation } from '@/lib/inventory-data'
import { cn } from '@/lib/utils'

interface OperationPreviewProps {
  operation: InventoryOperation | null
  onOpenChange: (o: boolean) => void
}

const categoryLabel: Record<InventoryOperation['category'], string> = {
  action: 'Nghiệp vụ thao tác',
  periodic: 'Kiểm kê định kỳ',
  report: 'Báo cáo — chỉ xem',
}

const stageFlows: Record<string, { from: string; to: string } | null> = {
  'nhap-hang': { from: 'Nhà cung cấp', to: 'Kho Dự Trữ' },
  'xuat-kho-bar': { from: 'Kho Dự Trữ', to: 'Quầy Bar' },
  'kiem-kho': null,
  'kiem-bar': null,
  'ton-kho': null,
  'gia-von': null,
}

const sampleFields: Record<string, string[]> = {
  'nhap-hang': ['Ngày nhận', 'Tên NVL', 'Số lượng', 'Đơn giá', 'Thành tiền (tự tính)'],
  'xuat-kho-bar': ['Ngày xuất', 'NVL xuất', 'Số lượng', 'Từ Kho → Bar'],
  'kiem-kho': ['Số tồn cơ sở', '+ Nhập thêm', '− Xuất ra', 'Tồn thực tế'],
  'kiem-bar': ['Số đếm thực tế', 'Theo DVT Bar', 'Chênh lệch', 'Ảnh hưởng Giá Vốn'],
  'ton-kho': ['Thời điểm xem', 'Tồn theo NVL', 'Tồn theo Kho/Bar'],
  'gia-von': ['Từ ngày (C2)', 'Đến ngày (C3)', 'Tồn đầu', 'Nhập', 'Tồn cuối', 'Tiêu thụ'],
}

export function OperationPreview({
  operation,
  onOpenChange,
}: OperationPreviewProps) {
  const open = !!operation
  if (!operation) return null
  const Icon = operation.icon
  const flow = stageFlows[operation.id]
  const fields = sampleFields[operation.id] ?? []
  const isReport = operation.category === 'report'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto scrollbar-cream sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ring-1 ring-border/40',
                operation.accent
              )}
            >
              <Icon className="size-6" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-xl">{operation.title}</DialogTitle>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {operation.code}
                </Badge>
              </div>
              <DialogDescription className="mt-1">
                {categoryLabel[operation.category]}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Description */}
          <p className="text-sm leading-relaxed text-foreground/90">
            {operation.description}
          </p>

          {/* Frequency */}
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <Calendar className="size-4 text-primary" />
            <span className="text-muted-foreground">Tần suất:</span>
            <span className="font-medium">{operation.frequency}</span>
          </div>

          {/* Flow */}
          {flow && (
            <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-accent/5 p-3">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Luồng nguyên vật liệu
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="rounded-lg bg-card px-3 py-1.5 shadow-sm ring-1 ring-border/50">
                  {flow.from}
                </span>
                <ArrowRight className="size-4 text-primary" />
                <span className="rounded-lg bg-primary px-3 py-1.5 text-primary-foreground shadow-sm">
                  {flow.to}
                </span>
              </div>
            </div>
          )}

          {/* Fields / columns */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <ListChecks className="size-3.5" />
              {isReport ? 'Các cột dữ liệu' : 'Thông tin cần ghi nhận'}
            </div>
            <div className="flex flex-wrap gap-2">
              {fields.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-card px-2.5 py-1 text-xs"
                >
                  <span className="size-1.5 rounded-full bg-accent" />
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Read-only notice */}
          {isReport && (
            <div className="flex items-start gap-2 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-xs text-violet-700 dark:text-violet-300">
              <Lock className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Báo cáo chỉ đọc — không nhập liệu trực tiếp tại tab này. Dữ liệu
                được tổng hợp tự động từ các nghiệp vụ thao tác.
              </span>
            </div>
          )}

          {/* Note */}
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Đây là trang chủ — chi tiết nghiệp vụ sẽ được phát triển ở các
              giao diện chuyên biệt.
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button disabled className="gap-2">
            {isReport ? 'Mở báo cáo' : 'Bắt đầu nghiệp vụ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
