'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PackagePlus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader, PageContainer } from '@/components/inventory/page-header'
import { ReceiptForm, type ReceiptPrefill } from '@/components/inventory/operation-dialogs'

export default function NhapHangPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const prefill: ReceiptPrefill | null = React.useMemo(() => {
    const mid = searchParams.get('mid')
    const qty = Number(searchParams.get('qty'))
    if (mid && qty > 0) return { materialId: mid, quantity: qty }
    return null
  }, [searchParams])

  return (
    <PageContainer>
      <PageHeader
        icon={PackagePlus}
        title="Nhập Hàng"
        code="NHAP_HANG"
        description="Ghi nhận lô hàng nhập kho từ nhà cung cấp: ngày nhận, tên NVL, số lượng, đơn giá và thành tiền tự tính. Có thể cập nhật hạn sử dụng cho lô mới."
        accent="from-amber-500/15 to-amber-500/5 text-amber-700 dark:text-amber-300"
      />
      <Card className="border-border/60">
        <CardContent className="p-5 sm:p-6">
          <ReceiptForm
            onDone={() => router.push('/lich-su')}
            prefill={prefill}
          />
        </CardContent>
      </Card>
    </PageContainer>
  )
}
