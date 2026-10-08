'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { CupSoda, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/auth-context'

export default function LoginPage() {
  const { loading, session, signInWithGoogle } = useAuth()
  const router = useRouter()
  const [signingIn, setSigningIn] = React.useState(false)

  React.useEffect(() => {
    if (!loading && session) {
      router.replace('/tong-quan')
    }
  }, [loading, session, router])

  const handleSignIn = async () => {
    setSigningIn(true)
    try {
      await signInWithGoogle()
    } catch {
      setSigningIn(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md">
          <CupSoda className="size-7" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">BachLong Inventory</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Hệ thống kiểm soát tồn kho &amp; giá vốn — Mongo &amp; NooShan
        </p>

        <Button
          className="mt-7 w-full gap-2"
          size="lg"
          onClick={handleSignIn}
          disabled={signingIn || loading}
        >
          {signingIn ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <GoogleIcon className="size-4" />
          )}
          Đăng nhập bằng Google
        </Button>

        <p className="mt-5 text-xs text-muted-foreground">
          Chỉ dùng cho nhân sự nội bộ BachLong. Tài khoản mới đăng nhập lần đầu
          sẽ ở trạng thái chờ quản trị viên duyệt.
        </p>
      </div>
    </div>
  )
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}
