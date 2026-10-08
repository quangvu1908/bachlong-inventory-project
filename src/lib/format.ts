export function formatVND(n: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

export function formatNum(n: number, maxFractionDigits = 2): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: maxFractionDigits }).format(n)
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(iso)
  )
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** Số ngày đến hạn sử dụng (âm = đã quá hạn) */
export function daysUntil(iso?: string | null): number | null {
  if (!iso) return null
  const target = new Date(iso + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

export type ExpiryLevel = 'expired' | 'critical' | 'soon' | 'ok' | 'none'

export function expiryLevel(iso?: string | null): ExpiryLevel {
  const d = daysUntil(iso)
  if (d === null) return 'none'
  if (d < 0) return 'expired'
  if (d <= 3) return 'critical'
  if (d <= 14) return 'soon'
  return 'ok'
}

export const expiryLevelMeta: Record<ExpiryLevel, { label: string; classes: string; dot: string }> = {
  expired: { label: 'Đã hết hạn', classes: 'bg-destructive/12 text-destructive border-destructive/30', dot: 'bg-destructive' },
  critical: { label: 'Sắp hết hạn', classes: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/30', dot: 'bg-rose-500' },
  soon: { label: 'Gần hết hạn', classes: 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/30', dot: 'bg-amber-500' },
  ok: { label: 'Còn hạn', classes: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-500' },
  none: { label: '—', classes: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground' },
}
