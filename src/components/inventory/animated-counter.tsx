'use client'

import * as React from 'react'

interface AnimatedCounterProps {
  /** target value (number) — for currency/numeric displays */
  value: number
  /** duration in ms */
  duration?: number
  /** decimals */
  decimals?: number
  /** formatter applied to the current displayed value */
  format?: (n: number) => string
  className?: string
}

/**
 * Smoothly counts up (or down) to `value` whenever it changes.
 * Falls back to the formatted final value if reduced-motion is preferred.
 */
export function AnimatedCounter({
  value,
  duration = 700,
  decimals = 0,
  format,
  className,
}: AnimatedCounterProps) {
  const [display, setDisplay] = React.useState(0)
  const fromRef = React.useRef(0)
  const rafRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      setDisplay(value)
      return
    }

    const from = fromRef.current
    const delta = value - from
    if (delta === 0) {
      setDisplay(value)
      return
    }
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3)
      const current = from + delta * eased
      setDisplay(current)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = value
        setDisplay(value)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  const fmt = format ?? ((n: number) =>
    new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(n)
  )

  return <span className={className}>{fmt(display)}</span>
}
