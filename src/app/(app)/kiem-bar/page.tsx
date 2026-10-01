'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Coffee } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader, PageContainer } from '@/components/inventory/page-header'
import { BarCountForm } from '@/components/inventory/operation-dialogs'

export default function KiemBarPage() {
  const router = useRouter()
  return (
    <PageContainer>
      <PageHeader
        icon={Coffee}
        title="Kiểm Bar"
        code="KIEM_KE_BAR"
        description="Kiểm kê tồn Quầy Bar theo DVT Bar — đếm thực tế tại quầy. Ảnh hưởng trực tiếp đến báo cáo Giá Vốn. Bắt buộc thực hiện cuối ngày/tuần/tháng."
        accent="from-rose-500/15 to-rose-500/5 text-rose-700 dark:text-rose-300"
      />
      <Card className="border-border/60">
        <CardContent className="p-5 sm:p-6">
          <BarCountForm onDone={() => router.push('/lich-su')} />
        </CardContent>
      </Card>
    </PageContainer>
  )
}
