'use client'

import * as React from 'react'
import { Boxes } from 'lucide-react'
import { PageHeader, PageContainer } from '@/components/inventory/page-header'
import { StockReport } from '@/components/inventory/reports-section'

export default function TonKhoPage() {
  return (
    <PageContainer>
      <PageHeader
        icon={Boxes}
        title="Báo cáo Tồn Kho"
        description="Tra cứu tồn kho tại thời điểm hiện tại. Báo cáo chỉ xem — dữ liệu tổng hợp tự động từ các nghiệp vụ, không nhập liệu trực tiếp."
        accent="from-emerald-500/15 to-emerald-500/5 text-emerald-700 dark:text-emerald-300"
      />
      <StockReport />
    </PageContainer>
  )
}
