'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Clock, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/auth-context'

/**
 * Chặn truy cập giao diện phía client khi chưa đăng nhập hoặc tài khoản
 * chưa được duyệt vai trò. Đây CHỈ là lớp trải nghiệm người dùng — bảo vệ
 * dữ liệu thật nằm ở Row Level Security trong Postgres, nên dù bỏ qua được
 * lớp này cũng không đọc/ghi được dữ liệu không có quyền.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading, session, profile, signOut } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!loading && !session) {
      router.replace('/dang-nhap')
    }
  }, [loading, session, router])

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile || profile.role === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-8 text-center shadow-lg">
          <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-600">
            <Clock className="size-7" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">
            Tài khoản đang chờ duyệt
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {profile?.email ?? 'Tài khoản của bạn'} đã đăng nhập thành công
            nhưng chưa được gán vai trò. Liên hệ quản trị viên hoặc quản lý
            thương hiệu để được cấp quyền truy cập.
          </p>
          <Button
            variant="outline"
            className="mt-6 w-full gap-2"
            onClick={() => signOut()}
          >
            <LogOut className="size-4" />
            Đăng xuất
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
