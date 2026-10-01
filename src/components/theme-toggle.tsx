'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Đổi giao diện sáng/tối"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative overflow-hidden rounded-full border-primary/20 bg-card/70 backdrop-blur"
    >
      {mounted ? (
        isDark ? (
          <Moon className="size-4 text-accent" />
        ) : (
          <Sun className="size-4 text-primary" />
        )
      ) : (
        <div className="size-4" />
      )}
    </Button>
  )
}
