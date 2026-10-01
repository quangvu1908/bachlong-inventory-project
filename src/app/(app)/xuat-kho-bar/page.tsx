'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader, PageContainer } from '@/components/inventory/page-header'
import { IssueForm } from '@/components/inventory/operation-dialogs'

export default function XuatKhoBarPage() {
  const router = useRouter()
  return (
    <PageContainer>
      <PageHeader
        icon={ArrowRightLeft}
        title="Xuất Kho Ra Bar"
        code="XUAT_KHO_BAR"
        description="Ghi nhận chuyển NVL từ Kho Dự Trữ sang Quầy Bar (luồng nội bộ, không phải bán). Giảm tồn kho ảo, cộng hàng sang quầy Bar theo hệ số quy đổi."
        accent="from-orange-500/15 to-orange-500/5 text-orange-700 dark:text-orange-300"
      />
      <Card className="border-border/60">
        <CardContent className="p-5 sm:p-6">
          <IssueForm onDone={() => router.push('/lich-su')} />
        </CardContent>
      </Card>
    </PageContainer>
  )
}
