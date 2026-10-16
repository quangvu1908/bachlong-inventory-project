'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CupSoda,
  Menu,
  X,
  Bell,
  Keyboard,
  ChevronLeft,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { StoreSwitcher } from '@/components/inventory/store-switcher'
import { navItems, navGroups } from '@/lib/nav-config'
import { useOperationMaterials } from '@/lib/use-operation-materials'
import { useStore } from '@/lib/store-context'
import { useAuth, ROLE_LABELS } from '@/lib/auth/auth-context'
import { cn } from '@/lib/utils'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const { profile } = useAuth()
  const { selectedStore } = useStore()
  const { materials } = useOperationMaterials(selectedStore?.id, selectedStore?.brand_id)
  const stats = {
    totalMaterials: materials.length,
    lowStockCount: materials.filter((m) => m.khoStock <= m.minStock).length,
  }
  const visibleNavItems = navItems.filter(
    (item) => !item.roles || (profile?.role && item.roles.includes(profile.role))
  )

  // close mobile drawer on route change
  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + '/')

  const SidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <Link
        href="/tong-quan"
        className="flex items-center gap-2.5 border-b border-sidebar-border px-5 py-4 transition-colors hover:bg-sidebar-accent/40"
      >
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <CupSoda className="size-4.5" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-bold tracking-tight text-white">Bạch Long</span>
          <span className="text-[11px] text-sidebar-foreground/70">
            Vận Hành - Quản Lý Kho
          </span>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-cream px-2.5 py-4">
        {navGroups.map((group) => {
          const items = visibleNavItems.filter((i) => i.group === group)
          if (items.length === 0) return null
          return (
            <div key={group} className="mb-4">
              <div className="mb-1.5 px-3.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
                {group}
              </div>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-2.5 rounded-lg py-2 pl-3 pr-3 text-[13px] font-medium transition-colors',
                        active
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <Icon
                        className={cn(
                          'size-4 shrink-0',
                          active ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/80'
                        )}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.code && (
                        <code
                          className={cn(
                            'shrink-0 rounded px-1 py-0.5 font-mono text-[9px]',
                            active
                              ? 'bg-black/10 text-sidebar-primary-foreground'
                              : 'bg-white/5 text-sidebar-foreground/70'
                          )}
                        >
                          {item.code}
                        </code>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Footer info */}
      <div className="m-2.5 mt-0 rounded-lg bg-sidebar-accent/50 px-3.5 py-2.5 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-sidebar-foreground/85">{stats.totalMaterials} nguyên vật liệu</span>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium',
              stats.lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'
            )}
          >
            <span
              className={cn(
                'size-1.5 rounded-full',
                stats.lowStockCount > 0 ? 'bg-amber-400' : 'bg-emerald-400'
              )}
            />
            {stats.lowStockCount > 0
              ? `${stats.lowStockCount} sắp hết`
              : 'Đủ hàng'}
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">
        {SidebarContent}
      </aside>

      {/* Main column */}
      <div className="lg:pl-60">
        {/* Top bar */}
        <header
          className={cn(
            'sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-background px-4 sm:px-6',
          )}
        >
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Mở menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              {SidebarContent}
            </SheetContent>
          </Sheet>

          {/* Breadcrumb / current page — ẩn trên mobile để nhường chỗ cho bộ chọn cửa hàng */}
          <div className="hidden min-w-0 sm:block">
            <CurrentPageLabel pathname={pathname} />
          </div>

          <div className="flex-1" />

          <StoreSwitcher />

          {/* Quick actions */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full"
            aria-label="Thông báo"
          >
            <Bell className="size-4" />
            {stats.lowStockCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {stats.lowStockCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden rounded-full sm:inline-flex"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('tra-house:open-shortcuts')
              )
            }
            aria-label="Phím tắt"
            title="Phím tắt (Shift + ?)"
          >
            <Keyboard className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden rounded-full sm:inline-flex"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('tra-house:open-command-palette')
              )
            }
            aria-label="Lệnh nhanh"
            title="Lệnh nhanh (⌘K)"
          >
            <span className="text-xs font-mono">⌘K</span>
          </Button>
          <ThemeToggle />
          <UserMenu />
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  )
}

function UserMenu() {
  const { profile, signOut } = useAuth()
  if (!profile) return null

  const initial = (profile.full_name || profile.email).charAt(0).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="ml-1 flex items-center gap-2 rounded-full px-1.5 py-1 sm:pr-3"
        >
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="size-7 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initial}
            </span>
          )}
          <span className="hidden flex-col items-start leading-none sm:flex">
            <span className="text-xs font-medium">
              {profile.full_name || profile.email}
            </span>
            {profile.role && (
              <span className="text-[10px] text-muted-foreground">
                {ROLE_LABELS[profile.role]}
              </span>
            )}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="text-sm font-medium">
            {profile.full_name || 'Người dùng'}
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {profile.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => signOut()}
          className="gap-2"
        >
          <LogOut className="size-4" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CurrentPageLabel({ pathname }: { pathname: string | null }) {
  const current = navItems.find(
    (i) => pathname === i.href || pathname?.startsWith(i.href + '/')
  )
  if (!current) {
    return (
      <span className="text-sm font-medium text-muted-foreground">
        Bạch Long
      </span>
    )
  }
  const Icon = current.icon
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-primary" />
      <span className="text-sm font-semibold">{current.label}</span>
      {current.code && (
        <code className="hidden rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
          {current.code}
        </code>
      )}
    </div>
  )
}
