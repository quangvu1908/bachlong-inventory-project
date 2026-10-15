'use client'

import * as React from 'react'
import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/** Bảng form kiểu "key-value", mỗi dòng là 1 hoặc 2 trường — theo mẫu iPOS Inventory. */
export function FieldTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
      {children}
    </div>
  )
}

/** Gộp 2 Field vào chung 1 dòng (cạnh nhau trên desktop, xếp chồng trên mobile). */
export function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
      {children}
    </div>
  )
}

export function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  /** Lỗi cho riêng trường này — hiện dòng chữ đỏ dưới input + tô đỏ nhãn, thay vì chỉ báo chung qua toast. */
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-stretch sm:grid-cols-[150px_1fr]">
      <div className={cn('flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold', error ? 'bg-destructive/10' : 'bg-muted/40')}>
        <span className="truncate">{label}</span>
        {required && <span className="text-destructive">*</span>}
        {hint && (
          <Tooltip>
            <TooltipTrigger type="button" className="shrink-0 text-muted-foreground">
              <Info className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent className="max-w-56 text-xs">{hint}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="flex min-w-0 flex-col justify-center">
        <div className="flex min-w-0 items-center">{children}</div>
        {error && <p className="px-3 pb-1.5 text-[11px] text-destructive">{error}</p>}
      </div>
    </div>
  )
}

/** Dòng lỗi dùng cho form Label+Input kiểu cũ (không qua FieldTable) — vd dialog Thương hiệu/Cửa hàng, Sản phẩm. */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-[11px] text-destructive">{message}</p>
}

/** Class dùng cho Input/Select/Textarea đặt bên trong Field — bỏ viền/bóng riêng để hòa vào bảng. */
export const cellInputClass = 'h-9 w-full rounded-none border-0 bg-transparent px-3 shadow-none focus-visible:ring-0'
export const cellSelectTriggerClass =
  'h-9 w-full justify-between rounded-none border-0 bg-transparent px-3 shadow-none focus-visible:ring-0'
export const cellTextareaClass =
  'min-h-[72px] w-full resize-y rounded-none border-0 bg-transparent px-3 py-2 shadow-none focus-visible:ring-0'

/** Thanh tiêu đề xám, chữ đậm giữa — thay cho DialogHeader mặc định, theo mẫu iPOS. */
export function FormDialogHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-border bg-muted/40 px-6 py-4 text-center text-base font-bold">
      {children}
    </div>
  )
}

export function FieldSectionLabel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('text-sm font-bold', className)}>{children}</div>
}
