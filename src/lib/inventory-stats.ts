import { useInventoryStore, type Transaction } from '@/lib/inventory-store'
import { categoryLabels, type MaterialCategory } from '@/lib/inventory-data'

export function formatVND(n: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatNum(n: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(n)
}

export function formatDate(iso: string) {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(ts: number) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts))
}

/** days until expiry (negative = expired) */
export function daysUntil(iso?: string): number | null {
  if (!iso) return null
  const target = new Date(iso + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = target.getTime() - today.getTime()
  return Math.round(diff / 86400000)
}

export type ExpiryLevel = 'expired' | 'critical' | 'soon' | 'ok' | 'none'

export function expiryLevel(iso?: string): ExpiryLevel {
  const d = daysUntil(iso)
  if (d === null) return 'none'
  if (d < 0) return 'expired'
  if (d <= 3) return 'critical'
  if (d <= 14) return 'soon'
  return 'ok'
}

export const expiryLevelMeta: Record<
  ExpiryLevel,
  { label: string; classes: string; dot: string }
> = {
  expired: {
    label: 'Đ hết hạn',
    classes:
      'bg-destructive/12 text-destructive border-destructive/30',
    dot: 'bg-destructive',
  },
  critical: {
    label: 'Sắp hết hạn',
    classes:
      'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/30',
    dot: 'bg-rose-500',
  },
  soon: {
    label: 'Gần hết hạn',
    classes:
      'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/30',
    dot: 'bg-amber-500',
  },
  ok: {
    label: 'Còn hạn',
    classes:
      'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  none: {
    label: '—',
    classes: 'bg-muted text-muted-foreground border-border',
    dot: 'bg-muted-foreground',
  },
}

export interface CategoryValue {
  category: MaterialCategory
  label: string
  value: number
  count: number
}

export function useInventoryStats() {
  const materials = useInventoryStore((s) => s.materials)
  const transactions = useInventoryStore((s) => s.transactions)

  const totalMaterials = materials.length
  const lowStockMaterials = materials.filter((m) => m.stock <= m.minStock)
  const lowStockCount = lowStockMaterials.length

  const totalStockValue = materials.reduce(
    (sum, m) => sum + m.unitPrice * m.stock,
    0
  )
  const totalBarValue = materials.reduce((sum, m) => {
    const factor = m.convertFactor ?? 1
    const barUnitPrice = m.unitPrice / factor
    return sum + barUnitPrice * m.barStock
  }, 0)

  const byCategory: CategoryValue[] = (
    Object.keys(categoryLabels) as MaterialCategory[]
  )
    .map((category) => {
      const items = materials.filter((m) => m.category === category)
      const value = items.reduce(
        (sum, m) => sum + m.unitPrice * m.stock,
        0
      )
      return {
        category,
        label: categoryLabels[category],
        value,
        count: items.length,
      }
    })
    .filter((c) => c.count > 0)

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayReceipts = transactions.filter(
    (t) => t.type === 'NHAP_HANG' && t.date === todayStr
  ).length
  const todayReceiptValue = transactions
    .filter((t) => t.type === 'NHAP_HANG' && t.date === todayStr)
    .reduce((s, t) => s + t.amount, 0)

  // expiry tracking
  const expiringMaterials = materials
    .map((m) => ({ m, days: daysUntil(m.expiryDate), level: expiryLevel(m.expiryDate) }))
    .filter((x) => x.level === 'expired' || x.level === 'critical' || x.level === 'soon')
    .sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999))

  // restock suggestions: stock <= minStock
  const restockSuggestions = materials
    .filter((m) => m.stock <= m.minStock)
    .map((m) => {
      const deficit = Math.max(m.minStock - m.stock, 0)
      // suggest order = max(minStock * 2 - stock, deficit * 2, minStock)
      const suggested = Math.max(m.minStock * 2 - m.stock, deficit * 2, m.minStock)
      return { m, deficit, suggested }
    })
    .sort((a, b) => a.m.stock / a.m.minStock - b.m.stock / b.m.minStock)

  // last 7 days transaction counts by day
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const iso = d.toISOString().slice(0, 10)
    const dayTx = transactions.filter((t) => t.date === iso)
    return {
      date: iso,
      label: new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      }).format(d),
      receipt: dayTx.filter((t) => t.type === 'NHAP_HANG').length,
      issue: dayTx.filter((t) => t.type === 'XUAT_KHO_BAR').length,
      check: dayTx.filter(
        (t) => t.type === 'KIEM_KE' || t.type === 'KIEM_KE_BAR'
      ).length,
    }
  })

  // trend: this 7 days vs previous 7 days
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const period7Start = new Date(todayStart.getTime() - 6 * 86400000)
  const prev7Start = new Date(todayStart.getTime() - 13 * 86400000)
  const period7StartIso = period7Start.toISOString().slice(0, 10)
  const prev7StartIso = prev7Start.toISOString().slice(0, 10)
  const todayIso = todayStart.toISOString().slice(0, 10)

  const txIn7 = transactions.filter(
    (t) => t.date >= period7StartIso && t.date <= todayIso
  )
  const txPrev7 = transactions.filter(
    (t) => t.date >= prev7StartIso && t.date < period7StartIso
  )
  const receiptValue7 = txIn7
    .filter((t) => t.type === 'NHAP_HANG')
    .reduce((s, t) => s + t.amount, 0)
  const receiptValuePrev7 = txPrev7
    .filter((t) => t.type === 'NHAP_HANG')
    .reduce((s, t) => s + t.amount, 0)
  const issueValue7 = txIn7
    .filter((t) => t.type === 'XUAT_KHO_BAR')
    .reduce((s, t) => s + t.amount, 0)
  const issueValuePrev7 = txPrev7
    .filter((t) => t.type === 'XUAT_KHO_BAR')
    .reduce((s, t) => s + t.amount, 0)
  const receiptCount7 = txIn7.filter((t) => t.type === 'NHAP_HANG').length
  const receiptCountPrev7 = txPrev7.filter((t) => t.type === 'NHAP_HANG').length

  const pctDelta = (cur: number, prev: number) => {
    if (prev === 0) return cur === 0 ? 0 : 100
    return ((cur - prev) / prev) * 100
  }

  const trends = {
    receiptValue: {
      current: receiptValue7,
      previous: receiptValuePrev7,
      delta: pctDelta(receiptValue7, receiptValuePrev7),
    },
    issueValue: {
      current: issueValue7,
      previous: issueValuePrev7,
      delta: pctDelta(issueValue7, issueValuePrev7),
    },
    receiptCount: {
      current: receiptCount7,
      previous: receiptCountPrev7,
      delta: pctDelta(receiptCount7, receiptCountPrev7),
    },
  }

  return {
    materials,
    transactions,
    totalMaterials,
    lowStockCount,
    lowStockMaterials,
    totalStockValue,
    totalBarValue,
    byCategory,
    todayReceipts,
    todayReceiptValue,
    last7Days,
    expiringMaterials,
    restockSuggestions,
    trends,
  }
}

export const transactionTypeMeta: Record<
  Transaction['type'],
  { label: string; color: string; dot: string; sign: (t: Transaction) => string }
> = {
  NHAP_HANG: {
    label: 'Nhập hàng',
    color: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/25',
    dot: 'bg-amber-500',
    sign: (t) => `+${formatNum(t.quantity)}`,
  },
  XUAT_KHO_BAR: {
    label: 'Xuất ra Bar',
    color: 'text-orange-700 dark:text-orange-300 bg-orange-500/10 border-orange-500/25',
    dot: 'bg-orange-500',
    sign: (t) => `−${formatNum(t.quantity)}`,
  },
  KIEM_KE: {
    label: 'Kiểm kho',
    color: 'text-teal-700 dark:text-teal-300 bg-teal-500/10 border-teal-500/25',
    dot: 'bg-teal-500',
    sign: (t) => (t.quantity >= 0 ? `+${formatNum(t.quantity)}` : formatNum(t.quantity)),
  },
  KIEM_KE_BAR: {
    label: 'Kiểm bar',
    color: 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/25',
    dot: 'bg-rose-500',
    sign: (t) => (t.quantity >= 0 ? `+${formatNum(t.quantity)}` : formatNum(t.quantity)),
  },
}
