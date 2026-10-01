'use client'

import * as React from 'react'
import {
  CupSoda,
  Settings2,
  Search,
  Bell,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Tổng quan', href: '#tong-quan' },
  { label: 'Nghiệp vụ', href: '#nghiep-vu' },
  { label: 'Nguyên vật liệu', href: '#nguyen-vat-lieu' },
  { label: 'Cài đặt', href: '#cai-dat' },
]

interface AppHeaderProps {
  onOpenSettings: () => void
  lowStockCount: number
}

export function AppHeader({ onOpenSettings, lowStockCount }: AppHeaderProps) {
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300',
        scrolled
          ? 'glass-card border-b border-border/60 shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <a href="#tong-quan" className="flex items-center gap-2.5 shrink-0">
          <div className="relative grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md">
            <CupSoda className="size-5" />
            <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-accent ring-2 ring-background" />
          </div>
          <div className="hidden flex-col leading-none sm:flex">
            <span className="text-base font-bold tracking-tight">
              Trà House
            </span>
            <span className="text-[11px] text-muted-foreground">
              Vận hành kho · Quầy bar
            </span>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Search (decorative on homepage) */}
        <div className="relative hidden lg:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Tìm nguyên vật liệu, phiếu..."
            className="h-9 w-56 rounded-full border border-border/70 bg-card/70 pl-9 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:w-64 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label="Thông báo"
        >
          <Bell className="size-4" />
          {lowStockCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {lowStockCount}
            </span>
          )}
        </Button>

        <ThemeToggle />

        {/* Settings trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenSettings}
          className="hidden gap-2 rounded-full border-primary/20 bg-card/70 sm:inline-flex"
        >
          <Settings2 className="size-4" />
          Cài đặt
        </Button>

        {/* Mobile nav sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden rounded-full"
              aria-label="Mở menu"
            >
              <ChevronDown className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav className="mt-4 flex flex-col gap-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}
              <Button
                variant="outline"
                className="mt-3 justify-start gap-2"
                onClick={onOpenSettings}
              >
                <Settings2 className="size-4" />
                Cài đặt
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

export { navItems, type AppHeaderProps }
