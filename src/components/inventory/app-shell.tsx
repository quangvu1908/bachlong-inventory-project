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
  const [scrolled, setScrolled] = React.useState(false)
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

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // close mobile drawer on route change
  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + '/')

  const SidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <Link
        href="/tong-quan"
        className="flex items-center gap-2.5 border-b border-border/60 px-5 py-4 transition-colors hover:bg-secondary/50"
      >
        <div className="relative grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md">
          <CupSoda className="size-5" />
          <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-accent ring-2 ring-background" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-tight">Trà House</span>
          <span className="text-[11px] text-muted-foreground">
            Vận hành kho · Quầy bar
          </span>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-cream px-3 py-4">
        {navGroups.map((group) => {
          const items = visibleNavItems.filter((i) => i.group === group)
          if (items.length === 0) return null
          return (
            <div key={group} className="mb-4">
              <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
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
                        'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                        active
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                    >
                      <Icon
                        className={cn(
                          'size-4 shrink-0 transition-transform group-hover:scale-110',
                          active && 'text-primary-foreground'
                        )}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.code && (
                        <code
                          className={cn(
                            'shrink-0 rounded px-1 py-0.5 font-mono text-[9px]',
                            active
                              ? 'bg-primary-foreground/20 text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
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
      <div className="border-t border-border/60 px-5 py-3 text-[11px] text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>{stats.totalMaterials} nguyên vật liệu</span>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium',
              stats.lowStockCount > 0
                ? 'bg-destructive/10 text-destructive'
                : 'bg-emerald-500/10 text-emerald-600'
            )}
          >
            <span
              className={cn(
                'size-1.5 rounded-full',
                stats.lowStockCount > 0 ? 'bg-destructive' : 'bg-emerald-500'
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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border/60 bg-card/50 backdrop-blur lg:block">
        {SidebarContent}
      </aside>

      {/* Main column */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header
          className={cn(
            'sticky top-0 z-20 flex h-14 items-center gap-2 px-4 transition-all sm:px-6',
            scrolled
              ? 'glass-card border-b border-border/60'
              : 'bg-transparent'
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

          {/* Breadcrumb / current page */}
          <CurrentPageLabel pathname={pathname} />

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
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
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
        Trà House
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
