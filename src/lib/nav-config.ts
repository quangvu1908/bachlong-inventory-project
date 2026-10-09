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
  UtensilsCrossed,
  FileUp,
  Scale,
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
    href: '/nhap-doanh-thu',
    label: 'Nhập Doanh Thu',
    shortLabel: 'Doanh thu',
    icon: FileUp,
    group: 'Nghiệp vụ',
    description: 'Upload file bán hàng từ phần mềm POS',
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
    href: '/sai-lech-tieu-thu',
    label: 'Sai Lệch Tiêu Thụ',
    shortLabel: 'Sai lệch',
    icon: Scale,
    group: 'Báo cáo',
    description: 'So sánh tiêu thụ lý thuyết vs thực tế',
    roles: ['admin', 'brand_manager', 'store_manager'],
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
    href: '/nguyen-vat-lieu',
    label: 'Quản Lý Nguyên Vật Liệu',
    shortLabel: 'Nguyên vật liệu',
    icon: Package,
    group: 'Hệ thống',
    description: 'Nguyên vật liệu, danh mục & đơn vị tính',
    roles: ['admin', 'brand_manager'],
  },
  {
    href: '/san-pham',
    label: 'Sản Phẩm & Công Thức',
    shortLabel: 'Sản phẩm',
    icon: UtensilsCrossed,
    group: 'Hệ thống',
    description: 'Sản phẩm bán ra, công thức & công thức BTP',
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
