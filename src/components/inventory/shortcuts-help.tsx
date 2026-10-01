'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ShortcutItem {
  keys: string[]
  label: string
}

interface ShortcutGroup {
  title: string
  items: ShortcutItem[]
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Tổng quan',
    items: [
      { keys: ['⌘', 'K'], label: 'Mở bảng lệnh nhanh' },
      { keys: ['Shift', '?'], label: 'Mở bảng phím tắt này' },
      { keys: ['Esc'], label: 'Đóng dialog / bảng lệnh' },
    ],
  },
  {
    title: 'Trong bảng lệnh',
    items: [
      { keys: ['↑', '↓'], label: 'Di chuyển giữa các lệnh' },
      { keys: ['↵'], label: 'Chọn lệnh đang focus' },
    ],
  },
  {
    title: 'Điều hướng nhanh',
    items: [
      { keys: ['Tab'], label: 'Chuyển focus giữa các phần tử' },
      { keys: ['Space'], label: 'Cuộn trang xuống' },
    ],
  },
]

export function ShortcutsHelp() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Shift + ? (or Shift + / on most layouts)
      if (e.shiftKey && (e.key === '?' || e.key === '/')) {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    const onOpenEvent = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('tra-house:open-shortcuts', onOpenEvent)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('tra-house:open-shortcuts', onOpenEvent)
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
              <Keyboard className="size-4" />
            </span>
            Phím tắt
          </DialogTitle>
          <DialogDescription>
            Tăng tốc thao tác với các phím tắt nhanh
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.title}
              </h3>
              <div className="space-y-1.5">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/40"
                  >
                    <span className="text-sm text-foreground/90">{item.label}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, ki) => (
                        <kbd
                          key={ki}
                          className="rounded-md border border-border/70 bg-card px-1.5 py-0.5 font-mono text-[11px] font-medium shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-3">
          <p className="text-[11px] text-muted-foreground">
            Mở nhanh bằng <kbd className="rounded border border-border/70 bg-card px-1 py-0.5 font-mono text-[10px]">Shift</kbd>{' '}
            <kbd className="rounded border border-border/70 bg-card px-1 py-0.5 font-mono text-[10px]">?</kbd>
          </p>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="gap-1.5">
            <X className="size-3.5" />
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
