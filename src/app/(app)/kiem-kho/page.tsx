'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader, PageContainer } from '@/components/inventory/page-header'
import { WarehouseCountForm } from '@/components/inventory/operation-dialogs'

export default function KiemKhoPage() {
  const router = useRouter()
  return (
    <PageContainer>
      <PageHeader
        icon={ClipboardCheck}
        title="Kiểm Kho"
        code="KIEM_KE"
        description="Kiểm kê tồn Kho Dự Trữ — lấy lần kiểm gần nhất làm số tồn cơ sở, sau đó ± nhập/xuất để có số chính xác. Thực hiện định kỳ hoặc khi phát hiện lệch số."
        accent="from-teal-500/15 to-teal-500/5 text-teal-700 dark:text-teal-300"
      />
      <Card className="border-border/60">
        <CardContent className="p-5 sm:p-6">
          <WarehouseCountForm onDone={() => router.push('/lich-su')} />
        </CardContent>
      </Card>
    </PageContainer>
  )
}
