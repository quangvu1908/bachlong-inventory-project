'use client'

import * as React from 'react'
import { Calculator } from 'lucide-react'
import { PageHeader, PageContainer } from '@/components/inventory/page-header'
import { CostReport } from '@/components/inventory/reports-section'

export default function GiaVonPage() {
  return (
    <PageContainer>
      <PageHeader
        icon={Calculator}
        title="Báo cáo Giá Vốn"
        description="Chi phí NVL tiêu thụ theo khoảng ngày. Công thức: Tiêu thụ = Tồn đầu + Nhập − Tồn cuối. Báo cáo chỉ xem."
        accent="from-violet-500/15 to-violet-500/5 text-violet-700 dark:text-violet-300"
      />
      <CostReport />
    </PageContainer>
  )
}
