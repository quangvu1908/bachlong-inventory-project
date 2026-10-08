'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { History, Filter, ArrowDownUp, Inbox, Printer, X, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useStore } from '@/lib/store-context'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'
import { formatVND, formatNum, formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

type TxnType = Database['public']['Enums']['transaction_type']
// transactions_view trả mọi cột dạng nullable (đặc tính view), nhưng trừ
// unit_price/amount (có thể bị giấu khỏi staff), các cột còn lại luôn có giá trị.
type TxnViewRow = Database['public']['Views']['transactions_view']['Row']
interface TxnRow extends Omit<TxnViewRow, 'unit_price' | 'amount' | 'id' | 'store_id' | 'material_id' | 'type' | 'quantity' | 'unit_code' | 'stock_before' | 'stock_after' | 'created_at'> {
  id: string
  store_id: string
  material_id: string
  type: TxnType
  quantity: number
  unit_code: string
  stock_before: number
  stock_after: number
  created_at: string
  unit_price: number | null
  amount: number | null
  material_name: string
}

type FilterType = 'all' | TxnType
type SortMode = 'newest' | 'oldest' | 'amount'

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Tất cả nghiệp vụ' },
  { value: 'receipt', label: 'Nhập hàng' },
  { value: 'issue_to_bar', label: 'Xuất ra Bar' },
  { value: 'warehouse_count', label: 'Kiểm kho' },
  { value: 'bar_count', label: 'Kiểm bar' },
]

const typeMeta: Record<TxnType, { label: string; color: string; dot: string }> = {
  receipt: { label: 'Nhập hàng', color: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  issue_to_bar: { label: 'Xuất ra Bar', color: 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  warehouse_count: { label: 'Kiểm kho', color: 'border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300', dot: 'bg-teal-500' },
  bar_count: { label: 'Kiểm bar', color: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
}

export function TransactionHistory() {
  const { selectedStore } = useStore()
  const [loading, setLoading] = React.useState(true)
  const [transactions, setTransactions] = React.useState<TxnRow[]>([])
  const [filter, setFilter] = React.useState<FilterType>('all')
  const [sort, setSort] = React.useState<SortMode>('newest')
  const [detailTx, setDetailTx] = React.useState<TxnRow | null>(null)

  React.useEffect(() => {
    if (!selectedStore) {
      setTransactions([])
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('transactions_view')
      .select('*')
      .eq('store_id', selectedStore.id)
      .order('created_at', { ascending: false })
      .limit(200)
      .then(async ({ data }) => {
        const txns = data ?? []
        const materialIds = Array.from(new Set(txns.map((t) => t.material_id).filter((id): id is string => !!id)))
        const { data: mats } = materialIds.length
          ? await supabase.from('materials').select('id, name').in('id', materialIds)
          : { data: [] as { id: string; name: string }[] }
        const nameById = new Map((mats ?? []).map((m) => [m.id, m.name]))
        const rows: TxnRow[] = txns.map((t) => ({
          ...t,
          material_name: nameById.get(t.material_id ?? '') ?? '—',
        })) as TxnRow[]
        setTransactions(rows)
        setLoading(false)
      })
  }, [selectedStore])

  const filtered = React.useMemo(() => {
    let list = transactions.filter((t) => filter === 'all' || t.type === filter)
    list = [...list].sort((a, b) => {
      if (sort === 'newest') return +new Date(b.created_at) - +new Date(a.created_at)
      if (sort === 'oldest') return +new Date(a.created_at) - +new Date(b.created_at)
      return (b.amount ?? 0) - (a.amount ?? 0)
    })
    return list
  }, [transactions, filter, sort])

  const totalReceipt = transactions.filter((t) => t.type === 'receipt').reduce((s, t) => s + (t.amount ?? 0), 0)

  return (
    <section className="mx-auto max-w-7xl scroll-mt-20 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="outline" className="mb-2 border-accent/30 bg-accent/5 text-accent-foreground">
            <History className="size-3.5" />
            Lịch sử giao dịch
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Dòng giao dịch gần đây</h2>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            {selectedStore ? `Cửa hàng ${selectedStore.name} — ` : ''}
            200 giao dịch gần nhất. Mọi phiếu nhập, xuất kho ra bar và kiểm kê đều được ghi nhận đầy đủ.
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
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
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

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryPill label="Tổng giao dịch" value={String(transactions.length)} tone="primary" />
        <SummaryPill label="Tổng tiền nhập" value={formatVND(totalReceipt)} tone="accent" />
        <SummaryPill label="Lượt xuất Bar" value={String(transactions.filter((t) => t.type === 'issue_to_bar').length)} tone="warn" />
        <SummaryPill label="Đang xem" value={String(filtered.length)} tone="muted" />
      </div>

      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="max-h-[480px] divide-y divide-border/40 overflow-y-auto scrollbar-cream">
            {loading ? (
              <div className="grid place-items-center py-16">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
                <Inbox className="size-8 opacity-50" />
                <p className="text-sm">Chưa có giao dịch phù hợp.</p>
              </div>
            ) : (
              filtered.map((tx, idx) => {
                const meta = typeMeta[tx.type]
                return (
                  <motion.button
                    key={tx.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.3) }}
                    onClick={() => setDetailTx(tx)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus:bg-muted/40 focus:outline-none sm:px-5"
                  >
                    <div className={cn('relative grid size-10 shrink-0 place-items-center rounded-xl border', meta.color)}>
                      <span className={cn('size-2 rounded-full', meta.dot)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{tx.material_name}</span>
                        <span className={cn('shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium', meta.color)}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span>{formatDateTime(tx.created_at)}</span>
                        {tx.note && (
                          <>
                            <span>·</span>
                            <span className="truncate">{tx.note}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className={cn('text-sm font-bold tabular-nums', meta.color.split(' ').find((c) => c.startsWith('text-')))}>
                        {tx.quantity >= 0 ? '+' : ''}{formatNum(tx.quantity)} {tx.unit_code}
                      </div>
                      {tx.amount != null && tx.amount > 0 && (
                        <div className="text-[11px] tabular-nums text-muted-foreground">{formatVND(tx.amount)}</div>
                      )}
                      {(tx.type === 'warehouse_count' || tx.type === 'bar_count') && (
                        <div className="text-[11px] text-muted-foreground">
                          {formatNum(tx.stock_before)} → {formatNum(tx.stock_after)}
                        </div>
                      )}
                    </div>
                  </motion.button>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      <TransactionDetailDialog tx={detailTx} onClose={() => setDetailTx(null)} />
    </section>
  )
}

function TransactionDetailDialog({ tx, onClose }: { tx: TxnRow | null; onClose: () => void }) {
  return (
    <Dialog open={!!tx} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[440px]">
        {tx && <TransactionDetailBody tx={tx} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function TransactionDetailBody({ tx, onClose }: { tx: TxnRow; onClose: () => void }) {
  const meta = typeMeta[tx.type]
  const isCheck = tx.type === 'warehouse_count' || tx.type === 'bar_count'
  const isIssue = tx.type === 'issue_to_bar'

  const handlePrint = () => {
    const amountLine = tx.amount && tx.amount > 0
      ? `<div class="row"><span>Thành tiền</span><strong>${formatVND(tx.amount)}</strong></div>` : ''
    const checkLine = isCheck
      ? `<div class="row"><span>Tồn trước</span><span>${formatNum(tx.stock_before)} ${tx.unit_code}</span></div>
         <div class="row"><span>Tồn sau</span><span>${formatNum(tx.stock_after)} ${tx.unit_code}</span></div>
         <div class="row"><span>Chênh lệch</span><span>${tx.quantity >= 0 ? '+' : ''}${formatNum(tx.quantity)} ${tx.unit_code}</span></div>`
      : ''
    const issueLine = isIssue && tx.bar_quantity != null
      ? `<div class="row"><span>Nhận tại Bar</span><span>+${formatNum(tx.bar_quantity)} ${tx.bar_unit_code}</span></div>` : ''
    const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Phiếu ${meta.label} - ${tx.id}</title>
      <style>
        *{box-sizing:border-box} body{font-family:ui-sans-serif,system-ui,sans-serif;padding:32px;color:#1a1a1a;max-width:480px;margin:0 auto}
        .header{text-align:center;border-bottom:2px solid #8b5e3c;padding-bottom:12px;margin-bottom:16px}
        .header h1{font-size:18px;margin:0;color:#8b5e3c}
        .badge{display:inline-block;background:#f4ede0;color:#8b5e3c;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600;margin-top:6px}
        .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #ddd;font-size:13px}
        .row:last-child{border-bottom:none}
        .row strong{font-weight:600}
        .amount{font-size:20px;font-weight:700;color:#8b5e3c;text-align:right;margin-top:12px}
        .note{margin-top:16px;padding:10px;background:#faf7f2;border-radius:6px;font-size:12px;color:#555}
        .footer{margin-top:24px;text-align:center;font-size:10px;color:#999;border-top:1px solid #eee;padding-top:10px}
        @media print{body{padding:0}}
      </style></head><body>
      <div class="header"><h1>BachLong Inventory</h1><div class="badge">${tx.id.slice(0, 8)}</div></div>
      <div class="row"><span>Ngày giờ</span><strong>${formatDateTime(tx.created_at)}</strong></div>
      <div class="row"><span>Nguyên vật liệu</span><strong>${tx.material_name}</strong></div>
      <div class="row"><span>Loại</span><span>${meta.label}</span></div>
      <div class="row"><span>Số lượng</span><strong>${tx.quantity >= 0 ? '+' : ''}${formatNum(tx.quantity)} ${tx.unit_code}</strong></div>
      ${tx.unit_price ? `<div class="row"><span>Đơn giá</span><span>${formatVND(tx.unit_price)}</span></div>` : ''}
      ${amountLine}${checkLine}${issueLine}
      ${tx.note ? `<div class="note"><strong>Ghi chú:</strong> ${tx.note}</div>` : ''}
      <div class="footer">In lúc ${new Date().toLocaleString('vi-VN')} · BachLong Inventory</div>
      <script>window.onload=function(){window.print()}</script>
      </body></html>`
    const printWin = window.open('', '_blank', 'width=520,height=700')
    if (printWin) {
      printWin.document.write(html)
      printWin.document.close()
    }
  }

  return (
    <div>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span className={cn('grid size-9 place-items-center rounded-xl border', meta.color)}>
            <span className={cn('size-2.5 rounded-full', meta.dot)} />
          </span>
          Chi tiết giao dịch
        </DialogTitle>
        <DialogDescription>Phiếu {meta.label} · {tx.id.slice(0, 8)}</DialogDescription>
      </DialogHeader>

      <div className="space-y-1.5 py-2">
        <DetailRow label="Nguyên vật liệu" value={tx.material_name} strong />
        <DetailRow label="Loại nghiệp vụ" value={meta.label} />
        <DetailRow label="Giờ ghi nhận" value={formatDateTime(tx.created_at)} />
        <div className="my-2 border-t border-border/60" />
        <DetailRow label="Số lượng" value={`${tx.quantity >= 0 ? '+' : ''}${formatNum(tx.quantity)} ${tx.unit_code}`} strong />
        {tx.unit_price != null && <DetailRow label="Đơn giá" value={formatVND(tx.unit_price)} />}
        {tx.amount != null && tx.amount > 0 && (
          <DetailRow label="Thành tiền" value={formatVND(tx.amount)} strong tone="text-primary" />
        )}
        {isIssue && tx.bar_quantity != null && (
          <>
            <div className="my-2 border-t border-border/60" />
            <DetailRow label="Nhận tại Bar" value={`+${formatNum(tx.bar_quantity)} ${tx.bar_unit_code}`} tone="text-teal-600 dark:text-teal-300" />
          </>
        )}
        {isCheck && (
          <>
            <div className="my-2 border-t border-border/60" />
            <DetailRow label="Tồn trước" value={`${formatNum(tx.stock_before)} ${tx.unit_code}`} />
            <DetailRow label="Tồn sau" value={`${formatNum(tx.stock_after)} ${tx.unit_code}`} />
            <DetailRow
              label="Chênh lệch"
              value={`${tx.quantity >= 0 ? '+' : ''}${formatNum(tx.quantity)} ${tx.unit_code}`}
              tone={tx.quantity >= 0 ? 'text-teal-600 dark:text-teal-300' : 'text-rose-600 dark:text-rose-300'}
            />
          </>
        )}
        {tx.note && (
          <div className="mt-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs">
            <span className="font-medium text-muted-foreground">Ghi chú: </span>
            {tx.note}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} className="gap-1.5">
          <X className="size-4" />
          Đóng
        </Button>
        <Button onClick={handlePrint} className="gap-1.5">
          <Printer className="size-4" />
          In phiếu
        </Button>
      </div>
    </div>
  )
}

function DetailRow({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('tabular-nums', strong && 'font-semibold', tone)}>{value}</span>
    </div>
  )
}

function SummaryPill({ label, value, tone }: { label: string; value: string; tone: 'primary' | 'accent' | 'warn' | 'muted' }) {
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
