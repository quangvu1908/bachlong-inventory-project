import type { LucideIcon } from 'lucide-react'
import {
  PackagePlus,
  ArrowRightLeft,
  ClipboardCheck,
  Coffee,
  Boxes,
  Calculator,
} from 'lucide-react'

export type OperationCategory = 'action' | 'periodic' | 'report'

export interface InventoryOperation {
  id: string
  code: string
  title: string
  shortName: string
  description: string
  frequency: string
  category: OperationCategory
  icon: LucideIcon
  /** tailwind classes for accent */
  accent: string
  /** destination of the operation in the material flow */
  stage?: 'supplier' | 'warehouse' | 'bar'
}

export const inventoryOperations: InventoryOperation[] = [
  {
    id: 'nhap-hang',
    code: 'NHAP_HANG',
    title: 'Nhập Hàng',
    shortName: 'Nhập kho',
    description:
      'Ghi nhận lô hàng nhập kho từ nhà cung cấp: ngày nhận, tên NVL, số lượng, đơn giá và thành tiền tự tính.',
    frequency: 'Mỗi lần nhận hàng',
    category: 'action',
    icon: PackagePlus,
    accent: 'from-amber-500/15 to-amber-500/5 text-amber-700 dark:text-amber-300',
    stage: 'warehouse',
  },
  {
    id: 'xuat-kho-bar',
    code: 'XUAT_KHO_BAR',
    title: 'Xuất Kho Ra Bar',
    shortName: 'Xuất ra Bar',
    description:
      'Ghi nhận chuyển NVL từ Kho Dự Trữ sang Quầy Bar (luồng nội bộ, không phải bán). Giảm tồn kho ảo.',
    frequency: 'Mỗi lần xuất bar',
    category: 'action',
    icon: ArrowRightLeft,
    accent: 'from-orange-500/15 to-orange-500/5 text-orange-700 dark:text-orange-300',
    stage: 'bar',
  },
  {
    id: 'kiem-kho',
    code: 'KIEM_KE',
    title: 'Kiểm Kho',
    shortName: 'Kiểm Kho Dự Trữ',
    description:
      'Kiểm kê tồn Kho Dự Trữ. Lấy lần kiểm gần nhất làm số tồn cơ sở, sau đó ± nhập/xuất để có số chính xác.',
    frequency: 'Định kỳ / khi lệch số',
    category: 'periodic',
    icon: ClipboardCheck,
    accent: 'from-teal-500/15 to-teal-500/5 text-teal-700 dark:text-teal-300',
    stage: 'warehouse',
  },
  {
    id: 'kiem-bar',
    code: 'KIEM_KE_BAR',
    title: 'Kiểm Bar',
    shortName: 'Kiểm Quầy Bar',
    description:
      'Kiểm kê tồn Quầy Bar theo DVT Bar. Đếm thực tế tại quầy, ảnh hưởng trực tiếp đến báo cáo Giá Vốn.',
    frequency: 'Cuối ngày / tuần / tháng',
    category: 'periodic',
    icon: Coffee,
    accent: 'from-rose-500/15 to-rose-500/5 text-rose-700 dark:text-rose-300',
    stage: 'bar',
  },
  {
    id: 'ton-kho',
    code: 'TON_KHO',
    title: 'Tồn Kho',
    shortName: 'Báo cáo Tồn Kho',
    description:
      'Tra cứu tồn kho tại bất kỳ thời điểm nào. Chỉ xem — không nhập liệu trực tiếp tại tab này.',
    frequency: 'Tra cứu mọi lúc',
    category: 'report',
    icon: Boxes,
    accent: 'from-emerald-500/15 to-emerald-500/5 text-emerald-700 dark:text-emerald-300',
  },
  {
    id: 'gia-von',
    code: 'GIA_VON',
    title: 'Giá Vốn',
    shortName: 'Báo cáo Giá Vốn',
    description:
      'Xem chi phí NVL tiêu thụ trong khoảng thời gian. Công thức: Tiêu thụ = Tồn đầu + Nhập − Tồn cuối.',
    frequency: 'Theo khoảng ngày C2 → C3',
    category: 'report',
    icon: Calculator,
    accent: 'from-violet-500/15 to-violet-500/5 text-violet-700 dark:text-violet-300',
  },
]

export type MaterialCategory =
  | 'tra'
  | 'sua'
  | 'duong'
  | 'tran'
  | 'topping'
  | 'khac'

export interface Material {
  id: string
  name: string
  category: MaterialCategory
  unit: string
  /** quy đổi sang đơn vị bar nếu khác */
  unitBar?: string
  /** hệ số quy đổi 1 kho = ? bar */
  convertFactor?: number
  unitPrice: number
  stock: number
  barStock: number
  minStock: number
  /** hạn sử dụng (ISO date) — nếu có */
  expiryDate?: string
}

export const categoryLabels: Record<MaterialCategory, string> = {
  tra: 'Trà',
  sua: 'Sữa',
  duong: 'Đường',
  tran: 'Trân châu',
  topping: 'Topping',
  khac: 'Khác',
}

export const categoryStyles: Record<MaterialCategory, string> = {
  tra: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
  sua: 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/25',
  duong: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/25',
  tran: 'bg-violet-500/12 text-violet-700 dark:text-violet-300 border-violet-500/25',
  topping: 'bg-teal-500/12 text-teal-700 dark:text-teal-300 border-teal-500/25',
  khac: 'bg-slate-500/12 text-slate-700 dark:text-slate-300 border-slate-500/25',
}

export const initialMaterials: Material[] = [
  {
    id: 'm1',
    name: 'Trà đen Đài Loan',
    category: 'tra',
    unit: 'kg',
    unitBar: 'g',
    convertFactor: 1000,
    unitPrice: 180000,
    stock: 8.5,
    barStock: 600,
    minStock: 3,
    expiryDate: '2026-12-01',
  },
  {
    id: 'm2',
    name: 'Trà xanh matcha',
    category: 'tra',
    unit: 'kg',
    unitBar: 'g',
    convertFactor: 1000,
    unitPrice: 420000,
    stock: 0.6,
    barStock: 250,
    minStock: 1,
    expiryDate: '2026-10-09',
  },
  {
    id: 'm3',
    name: 'Sữa tươi không đường',
    category: 'sua',
    unit: 'lít',
    unitBar: 'ml',
    convertFactor: 1000,
    unitPrice: 32000,
    stock: 24,
    barStock: 4500,
    minStock: 10,
    expiryDate: '2026-10-06',
  },
  {
    id: 'm4',
    name: 'Sữa đặc có đường',
    category: 'sua',
    unit: 'lon',
    unitBar: 'g',
    convertFactor: 380,
    unitPrice: 22000,
    stock: 30,
    barStock: 1200,
    minStock: 12,
    expiryDate: '2027-04-01',
  },
  {
    id: 'm5',
    name: 'Đường trắng tinh luyện',
    category: 'duong',
    unit: 'kg',
    unitBar: 'g',
    convertFactor: 1000,
    unitPrice: 28000,
    stock: 12,
    barStock: 1800,
    minStock: 5,
  },
  {
    id: 'm6',
    name: 'Đường nâu đen',
    category: 'duong',
    unit: 'kg',
    unitBar: 'g',
    convertFactor: 1000,
    unitPrice: 45000,
    stock: 4.5,
    barStock: 900,
    minStock: 2,
  },
  {
    id: 'm7',
    name: 'Trân châu đen',
    category: 'tran',
    unit: 'kg',
    unitBar: 'g',
    convertFactor: 1000,
    unitPrice: 55000,
    stock: 6.2,
    barStock: 1500,
    minStock: 3,
    expiryDate: '2026-10-13',
  },
  {
    id: 'm8',
    name: 'Trân châu trắng',
    category: 'tran',
    unit: 'kg',
    unitBar: 'g',
    convertFactor: 1000,
    unitPrice: 58000,
    stock: 3.8,
    barStock: 800,
    minStock: 2,
  },
  {
    id: 'm9',
    name: 'Thạch cà phê',
    category: 'topping',
    unit: 'kg',
    unitBar: 'g',
    convertFactor: 1000,
    unitPrice: 60000,
    stock: 2.4,
    barStock: 500,
    minStock: 1.5,
    expiryDate: '2026-10-21',
  },
  {
    id: 'm10',
    name: 'Pudding trứng',
    category: 'topping',
    unit: 'khay',
    unitBar: 'miếng',
    convertFactor: 12,
    unitPrice: 48000,
    stock: 5,
    barStock: 24,
    minStock: 3,
    expiryDate: '2026-10-04',
  },
  {
    id: 'm11',
    name: 'Đá viên',
    category: 'khac',
    unit: 'kg',
    unitBar: 'g',
    convertFactor: 1000,
    unitPrice: 5000,
    stock: 40,
    barStock: 5000,
    minStock: 15,
  },
  {
    id: 'm12',
    name: 'Lá trà đào (sấy)',
    category: 'tra',
    unit: 'kg',
    unitBar: 'g',
    convertFactor: 1000,
    unitPrice: 250000,
    stock: 1.4,
    barStock: 180,
    minStock: 0.8,
  },
]

export const unitOptions = [
  'kg',
  'g',
  'lít',
  'ml',
  'lon',
  'khay',
  'miếng',
  'hộp',
  'bịch',
  'chai',
]

export interface FlowStage {
  id: 'supplier' | 'warehouse' | 'bar'
  label: string
  sub: string
}

export const materialFlow: FlowStage[] = [
  { id: 'supplier', label: 'Nhà cung cấp', sub: 'Nguồn NVL' },
  { id: 'warehouse', label: 'Kho Dự Trữ', sub: 'KIEM_KE' },
  { id: 'bar', label: 'Quầy Bar', sub: 'KIEM_KE_BAR' },
]
