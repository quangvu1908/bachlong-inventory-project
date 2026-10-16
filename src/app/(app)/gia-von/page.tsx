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
        accent="from-primary/15 to-accent/10 text-primary"
      />
      <CostReport />
    </PageContainer>
  )
}
