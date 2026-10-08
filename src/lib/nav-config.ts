import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  PackagePlus,
  ArrowRightLeft,
  ClipboardCheck,
  Coffee,
  Boxes,
  Calculator,
  Package,
  History,
  Settings2,
  Building2,
  Users,
} from 'lucide-react'
import type { Database } from '@/lib/supabase/database.types'

type Role = Database['public']['Enums']['user_role']

export interface NavItem {
  href: string
  label: string
  shortLabel: string
  icon: LucideIcon
  /** category for grouping */
  group: 'Tổng quan' | 'Nghiệp vụ' | 'Báo cáo' | 'Hệ thống'
  /** code badge shown in sidebar */
  code?: string
  /** mobile drawer label */
  description?: string
  /** nếu có, chỉ các vai trò này mới thấy mục menu. Bỏ trống = ai cũng thấy */
  roles?: Role[]
}

export const navItems: NavItem[] = [
  {
    href: '/tong-quan',
    label: 'Tổng quan',
    shortLabel: 'Tổng quan',
    icon: LayoutDashboard,
    group: 'Tổng quan',
    description: 'Bảng điều khiển & sơ đồ luồng',
  },
  {
    href: '/nguyen-vat-lieu',
    label: 'Nguyên vật liệu',
    shortLabel: 'Vật liệu',
    icon: Package,
    group: 'Tổng quan',
    description: 'Quản lý danh mục NVL',
  },
  {
    href: '/lich-su',
    label: 'Lịch sử giao dịch',
    shortLabel: 'Lịch sử',
    icon: History,
    group: 'Tổng quan',
    description: 'Dòng giao dịch gần đây',
  },
  {
    href: '/nhap-hang',
    label: 'Nhập Hàng',
    shortLabel: 'Nhập Hàng',
    icon: PackagePlus,
    group: 'Nghiệp vụ',
    code: 'NHAP_HANG',
    description: 'Ghi nhận nhập kho từ NCC',
  },
  {
    href: '/xuat-kho-bar',
    label: 'Xuất Kho Ra Bar',
    shortLabel: 'Xuất ra Bar',
    icon: ArrowRightLeft,
    group: 'Nghiệp vụ',
    code: 'XUAT_KHO_BAR',
    description: 'Chuyển NVL Kho → Bar',
  },
  {
    href: '/kiem-kho',
    label: 'Kiểm Kho',
    shortLabel: 'Kiểm Kho',
    icon: ClipboardCheck,
    group: 'Nghiệp vụ',
    code: 'KIEM_KE',
    description: 'Kiểm kê Kho Dự Trữ',
  },
  {
    href: '/kiem-bar',
    label: 'Kiểm Bar',
    shortLabel: 'Kiểm Bar',
    icon: Coffee,
    group: 'Nghiệp vụ',
    code: 'KIEM_KE_BAR',
    description: 'Kiểm kê Quầy Bar',
  },
  {
    href: '/ton-kho',
    label: 'Tồn Kho',
    shortLabel: 'Tồn Kho',
    icon: Boxes,
    group: 'Báo cáo',
    description: 'Báo cáo tồn kho (chỉ xem)',
  },
  {
    href: '/gia-von',
    label: 'Giá Vốn',
    shortLabel: 'Giá Vốn',
    icon: Calculator,
    group: 'Báo cáo',
    description: 'Báo cáo giá vốn (chỉ xem)',
  },
  {
    href: '/thuong-hieu',
    label: 'Thương hiệu & Cửa hàng',
    shortLabel: 'Cửa hàng',
    icon: Building2,
    group: 'Hệ thống',
    description: 'Quản lý thương hiệu, cửa hàng trực thuộc',
    roles: ['admin', 'brand_manager'],
  },
  {
    href: '/nguoi-dung',
    label: 'Người dùng',
    shortLabel: 'Người dùng',
    icon: Users,
    group: 'Hệ thống',
    description: 'Gán vai trò & cửa hàng phụ trách',
    roles: ['admin', 'brand_manager'],
  },
  {
    href: '/cai-dat',
    label: 'Cài đặt',
    shortLabel: 'Cài đặt',
    icon: Settings2,
    group: 'Hệ thống',
    description: 'Cấu hình & Google Sheet',
  },
]

export const navGroups: NavItem['group'][] = [
  'Tổng quan',
  'Nghiệp vụ',
  'Báo cáo',
  'Hệ thống',
]
