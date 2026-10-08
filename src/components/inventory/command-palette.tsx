'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Command as CommandPrimitive } from 'cmdk'
import {
  Search,
  ArrowUpRight,
  PackagePlus,
  ArrowRightLeft,
  ClipboardCheck,
  Coffee,
  Boxes,
  Calculator,
  Settings2,
  Moon,
  Sun,
  Plus,
  LayoutDashboard,
  History,
  CornerDownLeft,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

export interface CommandAction {
  id: string
  label: string
  hint?: string
  keywords?: string
  icon: React.ComponentType<{ className?: string }>
  group: 'Điều hướng' | 'Nghiệp vụ' | 'Thao tác' | 'Giao diện'
  run: () => void
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const router = useRouter()
  const { setTheme, resolvedTheme } = useTheme()

  // Toggle the menu with Cmd/Ctrl + K
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    const onOpenEvent = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('tra-house:open-command-palette', onOpenEvent)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('tra-house:open-command-palette', onOpenEvent)
    }
  }, [])

  const nav = (href: string) => {
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  const run = (fn: () => void) => () => {
    setOpen(false)
    setQuery('')
    fn()
  }

  const actions: CommandAction[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      label: 'Tới Bảng điều khiển',
      icon: LayoutDashboard,
      group: 'Điều hướng',
      keywords: 'dashboard tong quan',
      run: () => nav('/tong-quan'),
    },
    {
      id: 'nav-ops',
      label: 'Tới Nghiệp vụ',
      icon: ArrowUpRight,
      group: 'Điều hướng',
      keywords: 'nghiep vu operations',
      run: () => nav('/nhap-hang'),
    },
    {
      id: 'nav-materials',
      label: 'Tới Nguyên vật liệu',
      icon: Boxes,
      group: 'Điều hướng',
      keywords: 'nguyen vat lieu materials kho',
      run: () => nav('/nguyen-vat-lieu'),
    },
    {
      id: 'nav-history',
      label: 'Tới Lịch sử giao dịch',
      icon: History,
      group: 'Điều hướng',
      keywords: 'lich su history giao dich',
      run: () => nav('/lich-su'),
    },
    {
      id: 'nav-reports',
      label: 'Tới Báo cáo',
      icon: Calculator,
      group: 'Điều hướng',
      keywords: 'bao cao reports ton kho gia von',
      run: () => nav('/ton-kho'),
    },
    // Operations
    {
      id: 'op-nhap-hang',
      label: 'Thực hiện: Nhập Hàng',
      hint: 'NHAP_HANG',
      icon: PackagePlus,
      group: 'Nghiệp vụ' as const,
      keywords: 'nhap hang receipt',
      run: () => nav('/nhap-hang'),
    },
    {
      id: 'op-xuat-kho-bar',
      label: 'Thực hiện: Xuất Kho Ra Bar',
      hint: 'XUAT_KHO_BAR',
      icon: ArrowRightLeft,
      group: 'Nghiệp vụ' as const,
      keywords: 'xuat kho bar issue',
      run: () => nav('/xuat-kho-bar'),
    },
    {
      id: 'op-kiem-kho',
      label: 'Thực hiện: Kiểm Kho',
      hint: 'KIEM_KE',
      icon: ClipboardCheck,
      group: 'Nghiệp vụ' as const,
      keywords: 'kiem kho count',
      run: () => nav('/kiem-kho'),
    },
    {
      id: 'op-kiem-bar',
      label: 'Thực hiện: Kiểm Bar',
      hint: 'KIEM_KE_BAR',
      icon: Coffee,
      group: 'Nghiệp vụ' as const,
      keywords: 'kiem bar count',
      run: () => nav('/kiem-bar'),
    },
    {
      id: 'op-ton-kho',
      label: 'Mở báo cáo Tồn Kho',
      icon: Boxes,
      group: 'Nghiệp vụ' as const,
      keywords: 'ton kho stock report',
      run: () => nav('/ton-kho'),
    },
    {
      id: 'op-gia-von',
      label: 'Mở báo cáo Giá Vốn',
      icon: Calculator,
      group: 'Nghiệp vụ' as const,
      keywords: 'gia von cost report',
      run: () => nav('/gia-von'),
    },
    // Actions
    {
      id: 'add-material',
      label: 'Thêm nguyên vật liệu mới',
      icon: Plus,
      group: 'Thao tác',
      keywords: 'them add material moi',
      run: () => nav('/nguyen-vat-lieu'),
    },
    {
      id: 'open-settings',
      label: 'Mở Cài đặt',
      icon: Settings2,
      group: 'Thao tác',
      keywords: 'cai dat settings',
      run: () => nav('/cai-dat'),
    },
    // Appearance
    {
      id: 'toggle-theme',
      label: 'Đổi giao diện sáng/tối',
      icon: resolvedTheme === 'dark' ? Sun : Moon,
      group: 'Giao diện',
      keywords: 'theme dark light mode',
      run: run(() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')),
    },
  ]

  const groups = ['Điều hướng', 'Nghiệp vụ', 'Thao tác', 'Giao diện'] as const

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh] sm:pt-[15vh]"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl"
          >
            <CommandPrimitive
              className="flex flex-col"
              loop
              shouldFilter
            >
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-border/60 px-4">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <CommandPrimitive.Input
                  value={query}
                  onValueChange={setQuery}
                  autoFocus
                  placeholder="Gõ lệnh hoặc tìm kiếm… (vd: nhập hàng, settings, dark)"
                  className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <kbd className="hidden shrink-0 rounded-md border border-border/60 bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <CommandPrimitive.List className="max-h-[60vh] overflow-y-auto scrollbar-cream p-2">
                <CommandPrimitive.Empty>
                  <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                    <Search className="size-6 opacity-40" />
                    Không tìm thấy lệnh phù hợp.
                  </div>
                </CommandPrimitive.Empty>

                {groups.map((group) => {
                  const items = actions.filter((a) => a.group === group)
                  if (items.length === 0) return null
                  return (
                    <CommandPrimitive.Group
                      key={group}
                      heading={group}
                      className="mb-1 [&_[cmdk-group-heading]]:sticky [&_[cmdk-group-heading]]:top-0 [&_[cmdk-group-heading]]:z-[1] [&_[cmdk-group-heading]]:bg-card [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
                    >
                      {items.map((action) => {
                        const Icon = action.icon
                        return (
                          <CommandPrimitive.Item
                            key={action.id}
                            value={`${action.label} ${action.keywords ?? ''}`}
                            onSelect={action.run}
                            className="group flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                          >
                            <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground transition-colors group-data-[selected=true]:border-primary/30 group-data-[selected=true]:bg-primary/10 group-data-[selected=true]:text-primary">
                              <Icon className="size-4" />
                            </span>
                            <span className="flex-1 truncate">{action.label}</span>
                            {action.hint && (
                              <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                {action.hint}
                              </code>
                            )}
                            <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-data-[selected=true]:opacity-100" />
                          </CommandPrimitive.Item>
                        )
                      })}
                    </CommandPrimitive.Group>
                  )
                })}
              </CommandPrimitive.List>

              {/* Footer */}
              <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <kbd className="rounded border border-border/60 bg-card px-1.5 py-0.5 font-mono">↑↓</kbd>
                  di chuyển
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="rounded border border-border/60 bg-card px-1.5 py-0.5 font-mono">↵</kbd>
                  chọn
                </span>
                <span className="hidden items-center gap-1.5 sm:flex">
                  <kbd className="rounded border border-border/60 bg-card px-1.5 py-0.5 font-mono">⌘K</kbd>
                  mở/đóng
                </span>
              </div>
            </CommandPrimitive>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
