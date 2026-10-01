'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  History,
  Filter,
  ArrowDownUp,
  Inbox,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useInventoryStore, type TransactionType } from '@/lib/inventory-store'
import {
  transactionTypeMeta,
  formatVND,
  formatNum,
  formatDate,
  formatDateTime,
} from '@/lib/inventory-stats'
import { cn } from '@/lib/utils'

type FilterType = 'all' | TransactionType
type SortMode = 'newest' | 'oldest' | 'amount'

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Tất cả nghiệp vụ' },
  { value: 'NHAP_HANG', label: 'Nhập hàng' },
  { value: 'XUAT_KHO_BAR', label: 'Xuất ra Bar' },
  { value: 'KIEM_KE', label: 'Kiểm kho' },
  { value: 'KIEM_KE_BAR', label: 'Kiểm bar' },
]

export function TransactionHistory() {
  const transactions = useInventoryStore((s) => s.transactions)
  const [filter, setFilter] = React.useState<FilterType>('all')
  const [sort, setSort] = React.useState<SortMode>('newest')

  const filtered = React.useMemo(() => {
    let list = transactions.filter((t) => filter === 'all' || t.type === filter)
    list = [...list].sort((a, b) => {
      if (sort === 'newest') return b.createdAt - a.createdAt
      if (sort === 'oldest') return a.createdAt - b.createdAt
      return b.amount - a.amount
    })
    return list
  }, [transactions, filter, sort])

  const totalReceipt = transactions
    .filter((t) => t.type === 'NHAP_HANG')
    .reduce((s, t) => s + t.amount, 0)
  const totalIssue = transactions
    .filter((t) => t.type === 'XUAT_KHO_BAR')
    .reduce((s, t) => s + t.amount, 0)

  return (
    <section
      id="lich-su"
      className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="outline" className="mb-2 border-accent/30 bg-accent/5 text-accent-foreground">
            <History className="size-3.5" />
            Lịch sử giao dịch
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Dòng giao dịch gần đây
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Mọi phiếu nhập, xuất kho ra bar và kiểm kê đều được ghi nhận đầy đủ.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <SelectTrigger className="h-9 w-[180px] gap-2 rounded-full">
              <Filter className="size-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
            <SelectTrigger className="h-9 w-[150px] gap-2 rounded-full">
              <ArrowDownUp className="size-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="oldest">Cũ nhất</SelectItem>
              <SelectItem value="amount">Thành tiền</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary strip */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryPill label="Tổng giao dịch" value={String(transactions.length)} tone="primary" />
        <SummaryPill
          label="Tổng tiền nhập"
          value={formatVND(totalReceipt)}
          tone="accent"
        />
        <SummaryPill
          label="Tổng tiền xuất Bar"
          value={formatVND(totalIssue)}
          tone="warn"
        />
        <SummaryPill
          label="Đang xem"
          value={String(filtered.length)}
          tone="muted"
        />
      </div>

      <Card className="border-border/60">
        <CardContent className="p-0">
          {/* list */}
          <div className="max-h-[480px] divide-y divide-border/40 overflow-y-auto scrollbar-cream">
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
                <Inbox className="size-8 opacity-50" />
                <p className="text-sm">Chưa có giao dịch phù hợp.</p>
              </div>
            )}
            {filtered.map((tx, idx) => {
              const meta = transactionTypeMeta[tx.type]
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.3) }}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 sm:px-5"
                >
                  {/* icon */}
                  <div
                    className={cn(
                      'grid size-10 shrink-0 place-items-center rounded-xl border',
                      meta.color
                    )}
                  >
                    <span className="size-2 rounded-full" style={{}} />
                    <span className={cn('absolute size-2 rounded-full', meta.dot)} />
                  </div>
                  {/* body */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">
                        {tx.materialName}
                      </span>
                      <span
                        className={cn(
                          'shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium',
                          meta.color
                        )}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span>{formatDate(tx.date)}</span>
                      <span>·</span>
                      <span>{formatDateTime(tx.createdAt)}</span>
                      {tx.note && (
                        <>
                          <span>·</span>
                          <span className="truncate">{tx.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {/* delta + amount */}
                  <div className="shrink-0 text-right">
                    <div
                      className={cn(
                        'text-sm font-bold tabular-nums',
                        tx.type === 'NHAP_HANG'
                          ? 'text-amber-600 dark:text-amber-300'
                          : tx.type === 'XUAT_KHO_BAR'
                          ? 'text-orange-600 dark:text-orange-300'
                          : tx.quantity >= 0
                          ? 'text-teal-600 dark:text-teal-300'
                          : 'text-rose-600 dark:text-rose-300'
                      )}
                    >
                      {meta.sign(tx)} {tx.unit}
                    </div>
                    {tx.amount > 0 && (
                      <div className="text-[11px] tabular-nums text-muted-foreground">
                        {formatVND(tx.amount)}
                      </div>
                    )}
                    {tx.amount === 0 && tx.type.startsWith('KIEM') && (
                      <div className="text-[11px] text-muted-foreground">
                        {formatNum(tx.before)} → {formatNum(tx.after)}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

function SummaryPill({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'primary' | 'accent' | 'warn' | 'muted'
}) {
  const tones = {
    primary: 'border-primary/20 bg-primary/5',
    accent: 'border-accent/20 bg-accent/5',
    warn: 'border-orange-500/20 bg-orange-500/5',
    muted: 'border-border/60 bg-muted/40',
  }
  return (
    <div className={cn('rounded-xl border px-3 py-2', tones[tone])}>
      <div className="text-base font-bold tabular-nums sm:text-lg">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  )
}
